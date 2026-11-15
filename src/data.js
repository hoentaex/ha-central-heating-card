// What the card loads from the recorder and what it derives from it.
//
// - History (state changes, kept ~10 days): the burner's on/off and the starts counter, for the cycling analysis
//   of the last 7 days to the minute. Wolf's starts counter has no state_class, so it has no long-term statistics;
//   its history still works. Without a counter the starts are the burner's off→on changes.
// - Long-term statistics: burner hours and starts per day (30 days) and per month (25 months), outdoor mean.
import { dayStart, parts, zoned } from "./tz.js";

const MIN = 60e3;
const ms = (t) => (typeof t === "number" ? (t < 1e11 ? t * 1000 : t) : Date.parse(t));
const val = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

/** Small promise cache: in-flight requests are shared, failures are not kept. */
export class Cache {
  constructor(now = () => Date.now()) {
    this._map = new Map();
    this._now = now;
  }

  get(key, expires, load) {
    const hit = this._map.get(key);
    if (hit && hit.expires > this._now()) return hit.promise;
    const promise = Promise.resolve()
      .then(load)
      .catch((err) => {
        if (this._map.get(key)?.promise === promise) this._map.delete(key);
        throw err;
      });
    this._map.set(key, { promise, expires });
    return promise;
  }

  clear() {
    this._map.clear();
  }
}

export const statsRequest = (ids, start, end, period, types = ["change", "mean"]) => ({
  type: "recorder/statistics_during_period",
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  statistic_ids: ids,
  period,
  types,
});

export const historyRequest = (ids, start, end) => ({
  type: "history/history_during_period",
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  entity_ids: ids,
  minimal_response: true,
  no_attributes: true,
  significant_changes_only: false,
});

/** Calendar-day key "2026-11-15" of instant `t` in `tz`. */
export const dayKey = (t, tz) => {
  const p = parts(ms(t), tz);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
};

/** Calendar-month key "2026-11" of instant `t` in `tz`. */
export const monthKey = (t, tz) => dayKey(t, tz).slice(0, 7);

/** The last `n` calendar days up to today, oldest first: [{ start, end, key, today }] (today ends now). */
export function dayWindows(now, tz, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = dayStart(now, tz, -i);
    const end = i === 0 ? now : dayStart(now, tz, -i + 1);
    out.push({ start, end, key: dayKey(start, tz), today: i === 0 });
  }
  return out;
}

/** History rows (compressed `{ s, lu, lc }` or full state objects) as [{ t, s }] in time order. */
export function historyPoints(rows) {
  return (rows || [])
    .map((r) => ({ t: ms(r.lc ?? r.lu ?? r.last_changed ?? r.last_updated), s: r.s ?? r.state }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
}

/**
 * Burner time and starts per window from on/off points. `isOn(state)` → true / false / null (unknown).
 * A start is a change from off to on inside the window; the state at the first point is not a start.
 */
export function burnerDays(points, windows, isOn, now = Date.now()) {
  const out = windows.map(() => ({ onMs: 0, starts: 0, covered: 0 }));
  for (let i = 0; i < points.length; i++) {
    const a = points[i].t;
    const b = i + 1 < points.length ? points[i + 1].t : now;
    const on = isOn(points[i].s);
    const wasOff = i > 0 && isOn(points[i - 1].s) === false;
    windows.forEach((w, k) => {
      const lo = Math.max(a, w.start.getTime());
      const hi = Math.min(b, w.end.getTime());
      if (hi > lo && on !== null) {
        out[k].covered += hi - lo;
        if (on) out[k].onMs += hi - lo;
      }
      if (on && wasOff && a >= w.start.getTime() && a < w.end.getTime()) out[k].starts += 1;
    });
  }
  return out;
}

/** Value of a counter at time `t`: the last numeric point at or before t (null if none). */
const counterAt = (points, t) => {
  let v = null;
  for (const p of points) {
    if (p.t > t) break;
    const n = val(Number.parseFloat(p.s));
    if (n !== null) v = n;
  }
  return v;
};

/** Increase of a counter per window (null without a value before or in the window; resets count as null). */
export function counterDays(points, windows) {
  const first = points.find((p) => val(Number.parseFloat(p.s)) !== null);
  return windows.map((w) => {
    if (!first || first.t >= w.end.getTime()) return null;
    const a = counterAt(points, w.start.getTime()) ?? val(Number.parseFloat(first.s));
    const b = counterAt(points, w.end.getTime() - 1);
    if (a === null || b === null || b < a) return null;
    return b - a;
  });
}

/**
 * Cycling per day: [{ start, key, today, starts, hours, min }] for the last `n` days (today included, unfinished).
 * `min` is the mean running time per start in minutes; days without data have nulls.
 */
export function taktDays(history, e, isOn, tz, now = new Date(), n = 8) {
  const windows = dayWindows(now, tz, n);
  const burner = burnerDays(historyPoints(history?.[e.burner]), windows, isOn, now.getTime());
  const counter = e.burner_starts ? counterDays(historyPoints(history?.[e.burner_starts]), windows) : [];
  return windows.map((w, i) => {
    const b = burner[i];
    const hasBurner = b.covered > 0.5 * (w.end - w.start);
    const starts = counter[i] ?? (hasBurner ? b.starts : null);
    const hours = hasBurner ? b.onMs / 3.6e6 : null;
    const min = starts && hours !== null ? (hours * 60) / starts : null;
    return { start: w.start, key: w.key, today: w.today, starts, hours, min };
  });
}

/** Mean over the finished days: starts per day, minutes per start (null when the burner never started). */
export function taktSummary(days) {
  const done = days.filter((d) => !d.today && d.starts !== null && d.hours !== null);
  const starts = done.reduce((s, d) => s + d.starts, 0);
  const hours = done.reduce((s, d) => s + d.hours, 0);
  if (!done.length || !starts) return null;
  return {
    days: done.length,
    perDay: starts / done.length,
    min: (hours * 60) / starts,
    from: done[0].start,
    to: done.at(-1).start,
  };
}

/** Rating of the mean running time per start: warn (< warn min), mid (< good min), good. */
export const taktClass = (min, warn = 5, good = 10) => (min < warn ? "warn" : min < good ? "mid" : "good");

// ---------- long-term statistics ----------

const byKey = (rows, keyOf, field) => {
  const m = new Map();
  for (const r of rows || []) {
    const v = val(r[field]);
    if (v !== null) m.set(keyOf(r.start), v);
  }
  return m;
};

/** 30 (n) days: [{ start, key, today, hours, starts, temp, hours2, mod, solar, fuel }] from daily statistics. */
export function statDays(stats, e, tz, now = new Date(), n = 30) {
  const k = (t) => dayKey(t, tz);
  const hours = byKey(stats?.[e.burner_hours], k, "change");
  const starts = byKey(stats?.[e.burner_starts], k, "change");
  const temp = byKey(stats?.[e.outdoor], k, "mean");
  const hours2 = byKey(stats?.[e.burner_hours_2], k, "change");
  const mod = byKey(stats?.[e.modulation], k, "mean");
  const solar = byKey(stats?.[e.solar_today], k, "change");
  const fuel = byKey(stats?.[e.fuel], k, "change");
  return dayWindows(now, tz, n).map((w) => ({
    start: w.start,
    key: w.key,
    today: w.today,
    hours: hours.get(w.key) ?? null,
    starts: starts.get(w.key) ?? null,
    temp: temp.get(w.key) ?? null,
    hours2: hours2.get(w.key) ?? null,
    mod: mod.get(w.key) ?? null,
    solar: solar.get(w.key) ?? null,
    fuel: fuel.get(w.key) ?? null,
  }));
}

/**
 * The last 13 calendar months (the running one last), with the same month a year earlier:
 * [{ y, m, key, current, hours, starts, temp, prevHours, prevStarts }].
 */
export function statMonths(stats, e, tz, now = new Date(), n = 13) {
  const k = (t) => monthKey(t, tz);
  const hours = byKey(stats?.[e.burner_hours], k, "change");
  const starts = byKey(stats?.[e.burner_starts], k, "change");
  const temp = byKey(stats?.[e.outdoor], k, "mean");
  const solar = byKey(stats?.[e.solar_today], k, "change");
  const p = parts(now.getTime(), tz);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(p.y, p.m - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const prev = `${y - 1}-${String(m + 1).padStart(2, "0")}`;
    out.push({
      y,
      m,
      key,
      current: i === 0,
      hours: hours.get(key) ?? null,
      starts: starts.get(key) ?? null,
      temp: temp.get(key) ?? null,
      prevHours: hours.get(prev) ?? null,
      prevStarts: starts.get(prev) ?? null,
      solar: solar.get(key) ?? null,
    });
  }
  return out;
}

/** Heating degree days of a mean temperature (base = heating limit, e.g. 15 °C). */
export const hdd = (temp, base) => (temp === null ? 0 : Math.max(0, base - temp));

// ---------- requests ----------

const bucket = (now, minutes) => Math.floor(now.getTime() / (minutes * MIN));

/** History of the burner, the starts counter and the hot-water pumps over the last `days` days (cached 5 min). */
export function fetchHistory(hass, cache, e, tz, now = new Date(), days = 8) {
  const ids = [e.burner, e.burner_starts, e.pump_dhw_charge, e.pump_dhw_circ, e.pump_solar].filter(Boolean);
  if (!ids.length) return Promise.resolve({});
  const start = dayStart(now, tz, -(days - 1));
  return cache.get(`hist|${ids.join(",")}|${bucket(now, 5)}`, Date.now() + 5 * MIN, () =>
    hass.callWS(historyRequest(ids, new Date(start.getTime() - 6 * 3600e3), now)),
  );
}

/** Daily (31 days) and monthly (25 months) statistics of burner hours, starts and outdoor temperature. */
export function fetchStats(hass, cache, e, tz, now = new Date()) {
  const ids = [
    e.burner_hours,
    e.burner_starts,
    e.outdoor,
    e.burner_hours_2,
    e.modulation,
    e.solar_today,
    e.fuel,
  ].filter(Boolean);
  if (!ids.length) return Promise.resolve({ days: {}, months: {} });
  const p = parts(now.getTime(), tz);
  const end = new Date(now.getTime() + 60 * MIN);
  return cache.get(`stats|${ids.join(",")}|${bucket(now, 30)}`, Date.now() + 30 * MIN, async () => {
    const [days, months] = await Promise.all([
      hass.callWS(statsRequest(ids, dayStart(now, tz, -30), end, "day")),
      hass.callWS(statsRequest(ids, zoned(p.y, p.m - 24, 1, 0, tz), end, "month")),
    ]);
    return { days: days || {}, months: months || {} };
  });
}

/** Hourly means of the last 48 hours: flow, outdoor and hot-water temperature (cached 15 minutes). */
export function fetchHourly(hass, cache, e, now = new Date(), hours = 48) {
  const ids = [e.flow_temp, e.outdoor, e.dhw_temp].filter(Boolean);
  if (!ids.length) return Promise.resolve({});
  const start = new Date(Math.floor(now.getTime() / 3600e3) * 3600e3 - (hours - 1) * 3600e3);
  return cache.get(`hourly|${ids.join(",")}|${bucket(now, 15)}`, Date.now() + 15 * MIN, () =>
    hass.callWS(statsRequest(ids, start, now, "hour", ["mean"])),
  );
}

// ---------- hourly values: heating curve and hot water ----------

/** The last `n` hours, oldest first: [{ start, flow, outdoor, dhw }] (null where nothing was recorded). */
export function hourRows(stats, e, now = new Date(), n = 48) {
  const at = (id) => {
    const m = new Map();
    for (const r of stats?.[id] || []) {
      const v = val(r.mean);
      if (v !== null) m.set(Math.floor(ms(r.start) / 3600e3), v);
    }
    return m;
  };
  const flow = at(e.flow_temp);
  const outdoor = at(e.outdoor);
  const dhw = at(e.dhw_temp);
  const last = Math.floor(now.getTime() / 3600e3);
  const out = [];
  for (let h = last - n + 1; h <= last; h++)
    out.push({
      start: new Date(h * 3600e3),
      flow: flow.get(h) ?? null,
      outdoor: outdoor.get(h) ?? null,
      dhw: dhw.get(h) ?? null,
    });
  // The running hour has no statistics yet: drop it when it is empty.
  if (out.length && out.at(-1).flow === null && out.at(-1).dhw === null) out.pop();
  return out;
}

/** Least-squares line y = a + b·x, or null with fewer than 4 points or less than 2 K spread outdoors. */
export function fitLine(pts) {
  if (pts.length < 4) return null;
  const xs = pts.map((p) => p.x);
  if (Math.max(...xs) - Math.min(...xs) < 2) return null;
  const mx = xs.reduce((s, v) => s + v, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const b = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx;
  return { a: my - b * mx, b };
}

/**
 * Points of the heating curve (outdoor → flow) with a flag `low` for setback (or hot-water priority) hours, found
 * from the data alone: points more than 4 K below the trend are set aside and the trend is fitted again on the rest
 * (a few rounds). The set curves are only drawn, not used here: the measured flow often runs a few K below them.
 */
export function curvePoints(rows) {
  const pts = rows
    .map((r, i) =>
      r.flow === null || r.outdoor === null ? null : { i, x: r.outdoor, y: r.flow, start: r.start, low: false },
    )
    .filter(Boolean);
  let fit = fitLine(pts);
  for (let round = 0; fit && round < 4; round++) {
    for (const p of pts) p.low = p.y < fit.a + fit.b * p.x - 4;
    const next = fitLine(pts.filter((p) => !p.low));
    if (!next) break;
    fit = next;
  }
  if (fit) for (const p of pts) p.low = p.y < fit.a + fit.b * p.x - 4;
  return { pts, fit };
}

/**
 * Runs of a pump per day (charging, circulation) over the finished days of the history window:
 * { perDay (runs), minPerRun, hoursPerDay } or null without data.
 */
export function pumpSummary(history, id, isOn, tz, now = new Date(), n = 8) {
  if (!id || !history?.[id]) return null;
  const windows = dayWindows(now, tz, n);
  const days = burnerDays(historyPoints(history[id]), windows, isOn, now.getTime())
    .map((d, i) => ({ ...d, today: windows[i].today, full: windows[i].end - windows[i].start }))
    .filter((d) => !d.today && d.covered > 0.5 * d.full);
  if (!days.length) return null;
  const runs = days.reduce((s, d) => s + d.starts, 0);
  const onMs = days.reduce((s, d) => s + d.onMs, 0);
  return {
    days: days.length,
    perDay: runs / days.length,
    minPerRun: runs ? onMs / 60e3 / runs : null,
    hoursPerDay: onMs / 3.6e6 / days.length,
  };
}

// ---------- efficiency, maintenance, availability ----------

/** Share of the time (0 … 1) the entity had a usable state over the last `days` days, or null without history. */
export function availability(history, id, tz, now = new Date(), days = 7) {
  const pts = historyPoints(history?.[id]);
  if (!pts.length) return null;
  const start = dayStart(now, tz, -(days - 1)).getTime() - 0;
  const from = Math.max(start, pts[0].t);
  const total = now.getTime() - from;
  if (total <= 0) return null;
  let bad = 0;
  pts.forEach((p, i) => {
    const a = Math.max(p.t, from);
    const b = i + 1 < pts.length ? pts[i + 1].t : now.getTime();
    if (b > a && ["unavailable", "unknown"].includes(String(p.s).toLowerCase())) bad += b - a;
  });
  return 1 - bad / total;
}

/**
 * Key figures of the last 30 days: burner hours per heating degree day, starts per heating degree day, share of
 * stage 2, mean modulation while running, fuel per burner hour and per heating degree day. Missing inputs → null.
 */
export function efficiency(days, base = 15) {
  const full = days.filter((d) => !d.today);
  const sum = (k) => (full.some((d) => d[k] !== null) ? full.reduce((s, d) => s + (d[k] ?? 0), 0) : null);
  const hours = sum("hours");
  const deg = full.reduce((s, d) => s + hdd(d.temp, base), 0);
  const starts = sum("starts");
  const hours2 = sum("hours2");
  const fuel = sum("fuel");
  // Daily mean modulation over 24 h divided by the share of the day the burner ran.
  const mods = full.filter((d) => d.mod !== null && d.hours).map((d) => Math.min(100, d.mod / (d.hours / 24)));
  return {
    days: full.length,
    hours,
    deg,
    hoursPerHdd: hours !== null && deg > 0 ? hours / deg : null,
    startsPerHdd: starts !== null && deg > 0 ? starts / deg : null,
    stage2: hours2 !== null && hours ? hours2 / hours : null,
    modulation: mods.length ? mods.reduce((s, v) => s + v, 0) / mods.length : null,
    fuel,
    fuelPerHour: fuel !== null && hours ? fuel / hours : null,
    fuelPerHdd: fuel !== null && deg > 0 ? fuel / deg : null,
  };
}

/** Mean burner hours per summer month (June–September) with data, or null (hot water only). */
export function summerLoad(months) {
  const s = months.filter((m) => [5, 6, 7, 8].includes(m.m) && m.hours !== null && !m.current);
  return s.length >= 2 ? s.reduce((a, m) => a + m.hours, 0) / s.length : null;
}

/** Counter readings (burner hours, starts) at the end of the maintenance day, from the statistics' state. */
export function fetchMaintenance(hass, cache, e, date, tz) {
  const ids = [e.burner_hours, e.burner_starts].filter(Boolean);
  const d = new Date(date);
  if (!ids.length || Number.isNaN(d.getTime())) return Promise.resolve(null);
  const start = dayStart(d, tz, 0);
  return cache.get(`maint|${ids.join(",")}|${start.getTime()}`, Date.now() + 12 * 60 * MIN, async () => {
    const res = await hass.callWS(statsRequest(ids, start, dayStart(d, tz, 1), "day", ["state"]));
    const last = (id) => {
      const rows = res?.[id] || [];
      const v = rows.length ? val(rows.at(-1).state) : null;
      return v;
    };
    return {
      hours: e.burner_hours ? last(e.burner_hours) : null,
      starts: e.burner_starts ? last(e.burner_starts) : null,
    };
  });
}
