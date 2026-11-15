// The three burner views as SVG (600 × 150, stretched to the card's width) plus what the readout above the chart
// shows at rest and while scrubbing. Lines are 1.5 px (non-scaling) as in the sibling cards; dots are HTML marks
// so they stay round.
import { hdd, taktClass } from "./data.js";
import { esc, fmtNum, locale } from "./shared.js";

export const W = 600;
export const H = 150;

const line = (pts, cls) =>
  `<polyline class="${cls}" points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}"/>`;
const grid = (ys) =>
  ys.map((y) => `<line class="grid" x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`).join("");
const niceMax = (v, step) => Math.max(step, Math.ceil((v || 0) / step) * step);
const rect = (cls, x, w, y) =>
  `<rect class="${cls}" x="${x.toFixed(1)}" width="${w.toFixed(1)}" y="${y.toFixed(1)}" height="${Math.max(1, H - y).toFixed(1)}" rx="2"/>`;

const weekday = (d, lang, tz) =>
  d.toLocaleDateString(locale(lang), { weekday: "short", timeZone: tz }).replace(".", "");
const dayLabel = (d, lang, tz) =>
  d
    .toLocaleDateString(locale(lang), { weekday: "short", day: "2-digit", month: "2-digit", timeZone: tz })
    .replace(",", "");
const shortDate = (d, lang, tz) =>
  d.toLocaleDateString(locale(lang), { day: "2-digit", month: "2-digit", timeZone: tz });
export const monthLabel = (y, m, lang) =>
  new Date(Date.UTC(y, m, 15)).toLocaleDateString(locale(lang), { month: "short", year: "2-digit", timeZone: "UTC" });

const readout = (main, sub) => `<span class="v num">${main}</span><span class="k num">${esc(sub)}</span>`;
const big = (v, unit) => `${v}<small>${esc(unit)}</small>`;

/** Takt: starts per day as bars (colored by the day's rating), the mean running time per start as a line. */
export function taktView(days, summary, { t, lang, tz, warn = 5, good = 10 }) {
  const n = days.length;
  const bw = W / n;
  const yMax = niceMax(Math.max(...days.map((d) => d.starts ?? 0)), 20);
  const y = (v) => H - (v / yMax) * (H - 8);
  const mMax = Math.max(20, niceMax(Math.max(...days.map((d) => d.min ?? 0)), 10));
  const ym = (v) => H - 8 - (Math.min(v, mMax) / mMax) * (H - 20);
  let svg = grid([y(yMax / 2), y(yMax)]);
  days.forEach((d, i) => {
    if (!d.starts) return;
    const cls = `bar ${d.min === null ? "" : taktClass(d.min, warn, good)}${d.today ? " partial" : ""}`;
    svg += rect(cls, i * bw + bw * 0.18, bw * 0.64, y(d.starts));
  });
  const pts = days.map((d, i) => (d.min === null ? null : [(i + 0.5) * bw, ym(d.min)])).filter(Boolean);
  if (pts.length > 1) svg += line(pts, "run");
  const marks = days.map((d, i) => (d.min === null ? null : { x: (i + 0.5) * bw, y: ym(d.min) })).filter(Boolean);
  const today = days.at(-1);
  const rest = summary
    ? readout(
        `${big(fmtNum(summary.perDay, lang), t("starts_per_day"))} · ${big(fmtNum(summary.min, lang, 1), t("min_per_start"))}`,
        [
          t("mean_range", { a: shortDate(summary.from, lang, tz), b: shortDate(summary.to, lang, tz) }),
          today?.starts !== null && today?.starts !== undefined
            ? t("today_starts", { n: fmtNum(today.starts, lang) })
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      )
    : readout("–", t("no_starts"));
  const at = (i) => {
    const d = days[i];
    const when = d.today ? t("today_so_far") : dayLabel(d.start, lang, tz);
    if (d.starts === null) return readout("–", t("no_data_on", { day: when }));
    return readout(
      `${big(fmtNum(d.starts, lang), t("starts"))}${d.min === null ? "" : ` · ${big(fmtNum(d.min, lang, 1), t("min_per_start"))}`}`,
      `${when}${d.hours === null ? "" : ` · ${t("flame_hours", { h: fmtNum(d.hours, lang, 1) })}`}`,
    );
  };
  return {
    svg,
    n,
    at,
    rest,
    marks,
    axis: days.map((d) => (d.today ? t("today_short") : weekday(d.start, lang, tz))),
    legend: [
      ["bar", "color-mix(in srgb, var(--chc-warn) 45%, transparent)", t("lg_starts")],
      ["line", "var(--chc-text)", t("lg_runtime", { max: mMax })],
    ],
    scale: summary ? Math.min(100, (summary.min / (good * 1.5)) * 100) : null,
    note: t("note_takt"),
  };
}

/** 30 days: burner hours per day as bars, the outdoor temperature dashed. */
export function daysView(days, { t, lang, tz, base = 15 }) {
  const n = days.length;
  const bw = W / n;
  const yMax = niceMax(Math.max(...days.map((d) => d.hours ?? 0)), 4);
  const y = (v) => H - (v / yMax) * (H - 8);
  const temps = days.map((d) => d.temp).filter((v) => v !== null);
  const tLo = temps.length ? Math.floor(Math.min(...temps) / 5) * 5 : 0;
  const tHi = temps.length ? Math.max(tLo + 5, Math.ceil(Math.max(...temps) / 5) * 5) : 20;
  const yt = (v) => H - 6 - ((v - tLo) / (tHi - tLo)) * (H - 16);
  let svg = grid([y(yMax / 2), y(yMax)]);
  days.forEach((d, i) => {
    if (d.hours) svg += rect(`bar heat${d.today ? " partial" : ""}`, i * bw + bw * 0.18, bw * 0.64, y(d.hours));
  });
  const tl = days.map((d, i) => (d.temp === null ? null : [(i + 0.5) * bw, yt(d.temp)])).filter(Boolean);
  if (tl.length > 1) svg += line(tl, "temp");
  const hours = days.reduce((s, d) => s + (d.hours ?? 0), 0);
  const deg = days.reduce((s, d) => s + hdd(d.temp, base), 0);
  const starts = days.some((d) => d.starts !== null) ? days.reduce((s, d) => s + (d.starts ?? 0), 0) : null;
  const rest = readout(
    big(fmtNum(hours, lang), t("hours_in_days", { n })),
    [
      deg > 0 ? t("per_hdd", { v: fmtNum(hours / deg, lang, 2) }) : "",
      starts ? t("starts_sum", { n: fmtNum(starts, lang) }) : "",
      temps.length ? t("mean_temp", { v: fmtNum(temps.reduce((s, v) => s + v, 0) / temps.length, lang, 1) }) : "",
    ]
      .filter(Boolean)
      .join(" · "),
  );
  const at = (i) => {
    const d = days[i];
    const when = d.today ? t("today_so_far") : dayLabel(d.start, lang, tz);
    const sub = [
      when,
      d.starts === null ? "" : t("starts_sum", { n: fmtNum(d.starts, lang) }),
      d.temp === null ? "" : `${fmtNum(d.temp, lang, 1)} °C`,
    ]
      .filter(Boolean)
      .join(" · ");
    return readout(d.hours === null ? "–" : big(fmtNum(d.hours, lang), t("hours_short")), sub);
  };
  const step = Math.round(n / 3);
  return {
    svg,
    n,
    at,
    rest,
    axis: [...new Set([0, step, 2 * step, n - 1].map((i) => Math.min(n - 1, i)))].map((i) =>
      i === n - 1 ? t("today_short") : shortDate(days[i].start, lang, tz),
    ),
    legend: [
      ["bar", "var(--chc-heat)", t("lg_hours")],
      ...(temps.length ? [["dash", "var(--chc-temp)", t("lg_temp", { lo: tLo, hi: tHi })]] : []),
    ],
    hint: t("hint_days"),
    note: `${shortDate(days[0].start, lang, tz)}–${shortDate(days[n - 1].start, lang, tz)}`,
  };
}

/** 13 months: burner hours per month next to the same month a year earlier; the running month is lighter. */
export function monthsView(months, { t, lang }) {
  const first = months.findIndex((m) => m.hours !== null);
  const rows = first < 0 ? months : months.slice(first);
  const n = rows.length;
  const bw = W / n;
  const hasPrev = rows.some((m) => m.prevHours !== null);
  const yMax = niceMax(Math.max(...rows.flatMap((m) => [m.hours ?? 0, m.prevHours ?? 0])), 50);
  const y = (v) => H - (v / yMax) * (H - 8);
  let svg = grid([y(yMax / 2), y(yMax)]);
  rows.forEach((m, i) => {
    if (hasPrev && m.prevHours) svg += rect("bar prev", i * bw + bw * 0.14, bw * 0.32, y(m.prevHours));
    if (m.hours)
      svg += rect(
        `bar heat${m.current ? " partial" : ""}`,
        hasPrev ? i * bw + bw * 0.5 : i * bw + bw * 0.2,
        bw * (hasPrev ? 0.36 : 0.6),
        y(m.hours),
      );
  });
  const total = rows.reduce((s, m) => s + (m.hours ?? 0), 0);
  const label = (m) => monthLabel(m.y, m.m, lang);
  const rest =
    first < 0
      ? readout("–", t("no_stats"))
      : readout(
          big(fmtNum(total, lang), t("hours_since", { m: label(rows[0]) })),
          first > 0 ? t("stats_since", { m: label(rows[0]) }) : t("hint_months_short"),
        );
  const at = (i) => {
    const m = rows[i];
    const name = `${label(m)}${m.current ? ` ${t("so_far")}` : ""}`;
    const sub = [
      name,
      m.prevHours === null ? "" : t("prev_is", { v: fmtNum(m.prevHours, lang) }),
      m.starts === null ? "" : t("starts_sum", { n: fmtNum(m.starts, lang) }),
      m.starts && m.hours ? t("min_each", { v: fmtNum((m.hours * 60) / m.starts, lang, 1) }) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return readout(m.hours === null ? "–" : big(fmtNum(m.hours, lang), t("hours_short")), sub);
  };
  return {
    svg,
    n,
    at,
    rest,
    axis: rows.map((m, i) => (n > 7 && i % 2 ? "" : label(m))),
    legend: [
      ["bar", "var(--chc-heat)", t("lg_hours")],
      ...(hasPrev ? [["bar", "color-mix(in srgb, var(--chc-sub) 40%, transparent)", t("lg_prev_month")]] : []),
    ],
    hint: t("hint_months"),
    note: t("note_months"),
  };
}

// ---------- heating curve and hot water ----------

export const CH = 180;
const hourLabel = (d, lang, tz) =>
  d
    .toLocaleString(locale(lang), {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    })
    .replace(",", "");

/**
 * Heating curve: flow over outdoor temperature as dots (setback hours as rings), the set curves (ViCare) or the
 * trend of the normal hours as lines. `curves`: { normal, reduced } functions or null.
 */
export function curveView({ pts, fit }, curves, { t, lang, tz }) {
  const xs = pts.map((p) => p.x);
  const xLo = Math.floor((Math.min(...xs) - 1) / 2) * 2;
  const xHi = Math.max(xLo + 6, Math.ceil((Math.max(...xs) + 1) / 2) * 2);
  const fns = curves ? [curves.normal, curves.reduced].filter(Boolean) : fit ? [(x) => fit.a + fit.b * x] : [];
  const ys = [...pts.map((p) => p.y), ...fns.flatMap((f) => [f(xLo), f(xHi)])];
  const yLo = Math.floor((Math.min(...ys) - 2) / 10) * 10;
  const yHi = Math.max(yLo + 20, Math.ceil((Math.max(...ys) + 2) / 10) * 10);
  const X = (v) => ((v - xLo) / (xHi - xLo)) * W;
  const Y = (v) => CH - 6 - ((v - yLo) / (yHi - yLo)) * (CH - 14);
  const yTicks = [];
  for (let v = yLo; v <= yHi; v += 10) yTicks.push(v);
  let svg = grid(yTicks.map(Y));
  const path = (f, cls) => {
    const p = [];
    for (let x = xLo; x <= xHi + 1e-9; x += 0.5) p.push([X(x), Y(f(x))]);
    return line(p, cls);
  };
  if (curves?.normal) svg += path(curves.normal, "curve");
  if (curves?.reduced) svg += path(curves.reduced, "curve2");
  if (!curves && fit) svg += path((x) => fit.a + fit.b * x, "fit");
  const marks = pts.map((p) => ({ x: X(p.x), y: Y(p.y), cls: p.low ? "pt low" : "pt" }));
  const at0 = curves?.normal ? curves.normal(0) : null;
  const rest = fit
    ? readout(
        big(fmtNum(fit.a, lang), t("flow_at_zero")),
        [
          fit.b > -0.05 ? t("per_kelvin_none") : t("per_kelvin", { v: fmtNum(-fit.b, lang, 2) }),
          at0 === null ? "" : t("target_at_zero", { v: fmtNum(at0, lang) }),
        ]
          .filter(Boolean)
          .join(" · "),
      )
    : readout("–", t("curve_too_few"));
  const at = (i) => {
    const p = pts[i];
    return readout(
      `${big(fmtNum(p.y, lang, 1), t("flow_c"))} · ${big(fmtNum(p.x, lang, 1), t("outdoor_c"))}`,
      `${hourLabel(p.start, lang, tz)} · ${t(p.low ? "setback" : "normal_op")}`,
    );
  };
  const step = (xHi - xLo) / 4;
  return {
    svg,
    marks,
    n: pts.length,
    at,
    rest,
    yLabels: yTicks.map((v) => ({ y: Y(v), text: `${v}°` })),
    axis: [0, 1, 2, 3, 4].map((k) => `${fmtNum(xLo + k * step, lang)} °C`),
    legend: [
      ["fill", "var(--chc-heat)", t("lg_normal")],
      ["ring", "var(--chc-heat)", t("lg_setback")],
      ...(curves?.normal ? [["line", "var(--chc-heat)", t("lg_curve_normal")]] : []),
      ...(curves?.reduced ? [["dash", "var(--chc-heat)", t("lg_curve_reduced")]] : []),
      ...(!curves && fit ? [["dash", "var(--chc-sub)", t("lg_trend")]] : []),
    ],
  };
}

/** Hot water: the cylinder temperature over the last 48 hours with the target as a dashed line. */
export function dhwView(rows, target, { t, lang, tz }) {
  const vals = rows.map((r) => r.dhw);
  const known = vals.filter((v) => v !== null);
  const lo = Math.floor((Math.min(...known, target ?? Infinity) - 3) / 5) * 5;
  const hi = Math.max(lo + 15, Math.ceil((Math.max(...known, target ?? -Infinity) + 3) / 5) * 5);
  const n = rows.length;
  const xOf = (i) => ((i + 0.5) / n) * W;
  const yOf = (i) => (vals[i] === null ? H / 2 : H - 6 - ((vals[i] - lo) / (hi - lo)) * (H - 14));
  const Y = (v) => H - 6 - ((v - lo) / (hi - lo)) * (H - 14);
  let svg = grid([Y(lo), Y((lo + hi) / 2), Y(hi)]);
  if (target !== null)
    svg += `<line class="target" x1="0" x2="${W}" y1="${Y(target).toFixed(1)}" y2="${Y(target).toFixed(1)}"/>`;
  const pts = vals.map((v, i) => (v === null ? null : [xOf(i), yOf(i)])).filter(Boolean);
  if (pts.length > 1) svg += line(pts, "water");
  const min = Math.min(...known);
  const max = Math.max(...known);
  const rest = readout(
    big(`${fmtNum(min, lang)}–${fmtNum(max, lang)}`, t("dhw_range")),
    target === null
      ? t("last_48h")
      : `${t("target", { v: `${fmtNum(target, lang)} °C` })} · ${t(min >= target - 1 ? "dhw_above" : "dhw_swings")}`,
  );
  const at = (i) =>
    readout(
      vals[i] === null ? "–" : big(fmtNum(vals[i], lang, 1), "°C"),
      `${hourLabel(rows[i].start, lang, tz)}${target === null ? "" : ` · ${t("target", { v: `${fmtNum(target, lang)} °C` })}`}`,
    );
  return {
    svg,
    n,
    xOf,
    yOf,
    at,
    rest,
    yLabels: [lo, (lo + hi) / 2, hi].map((v) => ({ y: Y(v), text: `${fmtNum(v, lang)}°` })),
    axis: [rows[0], rows[Math.floor(n / 2)], rows[n - 1]].map((r, k) =>
      k === 2 ? t("now_short") : hourLabel(r.start, lang, tz),
    ),
    legend: [
      ["line", "var(--chc-water)", t("lg_cylinder")],
      ...(target === null ? [] : [["dash", "var(--chc-sub)", t("lg_target")]]),
    ],
  };
}
