/*
 * Central Heating Card for Home Assistant
 * https://github.com/hoentaex/ha-central-heating-card
 *
 * Oil or gas central heating in one card: burner with an animated flame, temperatures with their targets, pumps.
 * Finds the entities of the Wolf SmartSet (wolflink) and Viessmann ViCare (vicare) integrations by itself.
 *
 * Layout and look follow the cards of juju35 (https://github.com/juju35). MIT licence.
 */
import { CH, curveView, daysView, dhwView, H, monthsView, solarView, taktView, W } from "./charts.js";
import {
  availability,
  Cache,
  curvePoints,
  efficiency,
  fetchMaintenance,
  fetchHistory,
  fetchHourly,
  fetchStats,
  hourRows,
  pumpSummary,
  statDays,
  statMonths,
  summerLoad,
  taktClass,
  taktDays,
  taktSummary,
} from "./data.js";
import { detect, resolveEntities } from "./detect.js";
import "./editor.js";
import { flameSVG } from "./flame.js";
import { num, onOff, readHeating, statusOf, vicareCurve } from "./heating.js";
import { svgIcon } from "./icons.js";
import { KPI_STYLE, kpiGrid } from "./kpi.js";
import "./popup.js";
import { scrub } from "./scrub.js";
import { DEFAULTS, esc, fmtNum, fmtTemp, fmtTime, langOf, modeLabel, SECTIONS, translator, VIEWS } from "./shared.js";
import { TipStore } from "./store.js";
import { BANNER_STYLE, fitPill, isNight, sceneSVG, sceneState } from "./banner.js";
import { STYLE as BASE_STYLE } from "./styles.js";
import { burnerDetail, targetLine } from "./texts.js";
import { buildTips } from "./tips.js";
import { tzOf } from "./tz.js";

const VERSION = __VERSION__;
const STYLE = BASE_STYLE + BANNER_STYLE + KPI_STYLE;
// One cache for all cards on the page: the full card and the mini card share the recorder requests.
const SHARED = new Cache();
// Done / hidden tips, kept in Home Assistant's per-user data (shared by all cards on the page).
const STORE = new TipStore();
const RELOAD_MS = 5 * 60e3;

/** Same on/off reading as the live state (Wolf "ein"/"aus", binary sensors "on"/"off"). */
const isOn = (s) => onOff({ states: { x: { state: s } } }, "x");

export const TAKT_COLOR = { warn: "var(--chc-warn)", mid: "var(--chc-mid)", good: "var(--chc-good)" };

export const STATUS_COLOR = {
  running: "var(--chc-heat)",
  dhw: "var(--chc-water)",
  idle: "var(--chc-sub)",
  offline: "var(--chc-warn)",
};

/** Config of a new card: the integration found in this installation. */
export function stubConfig(hass) {
  const found = detect(hass);
  return { preset: found?.platform || "auto" };
}

class HeatingCardBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = "";
  }

  _illustrated() {
    return this._config.illustration !== false;
  }

  /** Measure the banner's pill after each render, and again whenever the card is resized. */
  _afterRender() {
    if (!this._illustrated()) return;
    fitPill(this.shadowRoot);
    if (!this._ro && typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => fitPill(this.shadowRoot));
      this._ro.observe(this);
    }
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
  }

  /**
   * The illustrated header: the flame logo, the title with the status pill and the subtitle on the sky, the boiler at
   * the right. `button` is the close (dialog) or open (mini card) button, drawn as a frosted round button top right.
   */
  _banner(x, { sub, button }) {
    const { t, h, status, color, lang, animate } = x;
    const pill = this._pill(x);
    const name = this._config.name || t("title");
    const state = sceneState(status, h.burner.on);
    const flowV = h.flow.v ?? h.boiler.v;
    const scene = sceneSVG({
      platform: this._resolved?.platform || this._config.preset,
      state,
      level: h.burner.level,
      display: h.boiler.v === null ? "––" : `${fmtTemp(h.boiler.v, lang)}°`,
      readout: flowV === null ? "" : `${fmtTemp(flowV, lang)}°`,
      readoutLabel: esc(t(h.flow.v === null ? "boiler" : "flow")),
      animate,
    });
    return `<div class="banner${isNight(this._hass, this._config) ? " night" : ""}${state.warm ? " warm" : ""}">
      ${scene}
      <div class="head">
        <div class="logo" style="--c:${color}">${flameSVG({ on: !!h.burner.on, level: h.burner.level, small: true, animate })}</div>
        <div class="titles">
          <div class="trow"><div class="name" title="${esc(name)}">${esc(name)}</div><span class="pill" style="--c:${pill.color}" title="${esc(pill.text)}"><span class="dot"></span><span><span class="pl">${esc(pill.text)}</span><span class="ps">${esc(pill.short)}</span></span></span></div>
          ${sub ? `<div class="sub" title="${esc(sub)}">${esc(sub)}</div>` : ""}
        </div>
      </div>
      <div class="ground ${state.ground}"></div>
      ${button || ""}
    </div>`;
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const sections = Array.isArray(config.sections) ? config.sections.filter((s) => SECTIONS.includes(s)) : SECTIONS;
    this._config = { ...DEFAULTS, ...config, sections, hide: Array.isArray(config.hide) ? config.hide : [] };
    this._resolved = null;
    this._sig = "";
    this._data = null;
    this._loadedAt = 0;
    if (this._hass) this._render();
  }

  /** Whether this card needs the long-term statistics (the mini card only shows the cycling). */
  _wantsStats() {
    return false;
  }

  /** (Re)load the history (and statistics) on first use and then at most every five minutes. */
  _maybeLoad() {
    const e = this._resolved?.entities || {};
    if (!e.burner && !e.burner_hours) return;
    if (this._loading || (this._loadedAt && Date.now() - this._loadedAt < RELOAD_MS)) return;
    this._loading = true;
    this._load().finally(() => {
      this._loading = false;
    });
  }

  async _load() {
    STORE.load(this._hass).then(() => this._render());
    const e = this._resolved.entities;
    const tz = tzOf(this._hass);
    const now = new Date();
    try {
      const [hist, stats, hourly, maint] = await Promise.all([
        fetchHistory(this._hass, SHARED, e, tz, now),
        this._wantsStats() ? fetchStats(this._hass, SHARED, e, tz, now).catch(() => null) : null,
        this._wantsStats() ? fetchHourly(this._hass, SHARED, e, now).catch(() => null) : null,
        this._wantsStats() && this._config.maintenance_date
          ? fetchMaintenance(this._hass, SHARED, e, this._config.maintenance_date, tz).catch(() => null)
          : null,
      ]);
      const takt = taktDays(hist, e, isOn, tz, now);
      this._data = {
        takt,
        summary: taktSummary(takt),
        days: stats ? statDays(stats.days, e, tz, now) : null,
        months: stats ? statMonths(stats.months, e, tz, now) : null,
        hours: hourly ? hourRows(hourly, e, now) : null,
        charge: pumpSummary(hist, e.pump_dhw_charge, isOn, tz, now),
        circ: pumpSummary(hist, e.pump_dhw_circ, isOn, tz, now),
        solarPump: pumpSummary(hist, e.pump_solar, isOn, tz, now),
        avail: e.burner ? availability(hist, e.burner, tz, now) : null,
        maint,
        error: null,
      };
      const base = Number(this._config.heating_base_temp) || 15;
      this._data.eff = this._data.days ? efficiency(this._data.days, base) : null;
      this._data.summer = this._data.months ? summerLoad(this._data.months) : null;
    } catch (err) {
      this._data = { takt: [], summary: null, days: null, months: null, error: String(err?.message || err) };
    }
    this._loadedAt = Date.now();
    this._render();
  }

  /** Header pill: no connection, else the cycling rating (once loaded), else the live status. */
  _pill({ t, lang, status, color }) {
    const s = this._data?.summary;
    if (status === "offline" || !s) return { text: t(`st_${status}`), short: t(`st_${status}`), color };
    const c = taktClass(s.min, Number(this._config.takt_warn_min) || 5, Number(this._config.takt_good_min) || 10);
    return {
      text: t("takt_pill", { s: t(`takt_${c}`), v: fmtNum(s.min, lang, 1) }),
      short: t(`takt_${c}`),
      color: TAKT_COLOR[c],
    };
  }

  set hass(hass) {
    const first = !this._hass || this._hass.entities !== hass.entities;
    this._hass = hass;
    if (first || !this._resolved) this._resolved = resolveEntities(hass, this._config);
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  /** Re-render only when one of the card's entities (or the language) changed. */
  _signature() {
    const st = this._hass?.states || {};
    const ids = Object.values(this._resolved?.entities || {});
    return [
      langOf(this._hass, this._config),
      this._hass?.themes?.darkMode ? "dark" : "light",
      ...ids.map((id) => `${id}=${st[id]?.state}@${st[id]?.last_updated ?? ""}`),
    ].join("|");
  }

  _ctx() {
    const lang = langOf(this._hass, this._config);
    const tz = tzOf(this._hass);
    const t = translator(lang);
    const e = this._resolved?.entities || {};
    const h = readHeating(this._hass, e);
    const status = statusOf(h);
    return {
      lang,
      tz,
      t,
      e,
      h,
      status,
      color: STATUS_COLOR[status],
      now: new Date(),
      animate: this._config.animations !== false,
    };
  }

  _hidden(key) {
    return this._config.hide.includes(key);
  }

  _subtitle({ h, t, lang, tz }) {
    if (this._config.subtitle) return this._config.subtitle;
    const parts = [this._resolved?.brand, modeLabel(h.mode, lang)];
    if (h.program) parts.push(t(`prog_${h.program}`));
    if (h.updated) parts.push(t("as_of", { time: fmtTime(h.updated, lang, tz) }));
    return parts.filter(Boolean).join(" · ");
  }
}

export class CentralHeatingCard extends HeatingCardBase {
  static getConfigElement() {
    return document.createElement("central-heating-card-editor");
  }

  static getStubConfig(hass) {
    return { type: "custom:central-heating-card", ...stubConfig(hass) };
  }

  getCardSize() {
    return 9;
  }

  _wantsStats() {
    return ["burner", "curve", "dhw", "solar", "efficiency", "footer"].some((s) => this._config.sections.includes(s));
  }

  setConfig(config) {
    if (!VIEWS.includes(this._view)) this._view = VIEWS.includes(config?.default_view) ? config.default_view : "takt";
    super.setConfig(config);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _render() {
    if (!this._config || !this._hass) return;
    const x = this._ctx();
    const { t } = x;
    const show = (s) => this._config.sections.includes(s);
    const body = Object.keys(x.e).length
      ? (show("now") ? this._nowSection(x) : "") +
        (show("tips") ? this._tipsSection(x) : "") +
        (show("burner") && (x.e.burner || x.e.burner_hours) ? this._burnerSection(x) : "") +
        (show("curve") && x.e.flow_temp && x.e.outdoor ? this._panelSection("curve", "curve", x, true) : "") +
        (show("dhw") && x.e.dhw_temp ? this._panelSection("dhw", "drop", x) : "") +
        (show("solar") && x.e.solar_today ? this._panelSection("solar", "sun", x, false, x.t("solar_note")) : "") +
        (show("efficiency") ? this._efficiencySection(x) : "") +
        (show("footer") ? this._footer(x) : "")
      : `<div class="empty">${svgIcon("alert")}<span>${esc(t("no_entities"))}</span></div>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card class="${x.animate ? "anim" : ""}">
      ${show("header") ? this._header(x) : ""}
      <div class="content">${body}</div>
    </ha-card>`;
    this._afterRender();
    this._wireMore(this.shadowRoot);
    this._wireTips();
    const close = this.shadowRoot.querySelector("[data-close]");
    if (close) close.onclick = () => this.dispatchEvent(new CustomEvent("chc-close"));
    this._mountChart();
    this._mountCurve();
    this._mountDhw();
    this._mountSolar();
    this._maybeLoad();
  }

  /** Panel with readout, plot, axis, legend, extra and hint; element ids prefixed with `p`. */
  _panelSection(p, icon, { t }, tall = false, note = null) {
    return `<section>
      <div class="section-title">${svgIcon(icon)}<span>${esc(t(`${p}_title`))}</span><span class="note">${esc(note ?? t("last_48h"))}</span></div>
      <div class="panel">
        <div class="readout" id="${p}-readout"></div>
        <div class="plot${tall ? " tall" : ""}" id="${p}-plot"></div>
        <div class="axis" id="${p}-axis"></div>
        <div class="legend" id="${p}-legend"></div>
        <div id="${p}-extra"></div>
        <div class="hint" id="${p}-hint"></div>
      </div>
    </section>`;
  }

  /** Fills a panel from a view; returns the element getter of that panel. */
  _fill(p, view, height) {
    const $ = (id) => this.shadowRoot.getElementById(`${p}-${id}`);
    const pos = (x, y) => `left:${((x / W) * 100).toFixed(2)}%;top:${((y / height) * 100).toFixed(2)}%`;
    $("plot").innerHTML =
      `<svg viewBox="0 0 ${W} ${height}" preserveAspectRatio="none" aria-hidden="true">${view.svg}</svg>
      ${(view.yLabels || []).map((l) => `<span class="ylab" style="top:${((l.y / height) * 100).toFixed(2)}%">${esc(l.text)}</span>`).join("")}
      ${(view.marks || []).map((m) => `<div class="${m.cls || "mark"}" style="${pos(m.x, m.y)}"></div>`).join("")}
      <div class="hl" hidden></div><div class="hdot" hidden></div>`;
    $("readout").innerHTML = view.rest;
    $("axis").innerHTML = view.axis.map((a) => `<span>${esc(a)}</span>`).join("");
    $("legend").innerHTML = view.legend
      .map(([kind, color, txt]) => `<span><i class="sw ${kind}" style="--sw:${color}"></i>${esc(txt)}</span>`)
      .join("");
    $("extra").innerHTML = "";
    $("hint").textContent = "";
    return $;
  }

  _emptyPanel(p, msg) {
    const $ = (id) => this.shadowRoot.getElementById(`${p}-${id}`);
    $("readout").innerHTML = `<span class="v">–</span><span class="k">${esc(msg)}</span>`;
    for (const id of ["plot", "axis", "legend", "extra", "hint"]) $(id).innerHTML = "";
  }

  /** The set curves (ViCare: normal and reduced program), or null when the integration does not report them. */
  _setCurves(e) {
    const slope = num(this._hass, e.curve_slope);
    const shift = num(this._hass, e.curve_shift);
    const normal = num(this._hass, e.normal_temp);
    const reduced = num(this._hass, e.reduced_temp);
    if (slope === null || shift === null || normal === null) return null;
    return {
      slope,
      shift,
      rt: normal,
      rr: reduced,
      normal: (v) => vicareCurve(v, normal, slope, shift),
      reduced: reduced === null ? null : (v) => vicareCurve(v, reduced, slope, shift),
    };
  }

  _mountCurve() {
    const plot = this.shadowRoot?.getElementById("curve-plot");
    if (!plot) return;
    const { t, lang, tz, e } = this._ctx();
    const d = this._data;
    if (!d) return this._emptyPanel("curve", t("loading"));
    if (!d.hours) return this._emptyPanel("curve", t("no_stats"));
    const curves = this._setCurves(e);
    const cp = curvePoints(d.hours);
    if (cp.pts.length < 4) return this._emptyPanel("curve", t("curve_too_few"));
    const view = curveView(cp, curves, { t, lang, tz });
    const $ = this._fill("curve", view, CH);
    let hint = curves
      ? t("hint_curve_set", {
          s: fmtNum(curves.slope, lang, 1),
          n: `${curves.shift > 0 ? "+" : ""}${fmtNum(curves.shift, lang)}`,
          r: fmtNum(curves.rt, lang),
          rr: fmtNum(curves.rr, lang),
        })
      : t("hint_curve_trend");
    if (!curves && cp.fit && cp.fit.b > -0.3) hint += ` ${t("hint_curve_flat")}`;
    $("hint").textContent = hint;
    // Scrubbing: the dot nearest to the pointer.
    const readout = $("readout");
    const dots = [...plot.querySelectorAll(".pt")];
    const pick = (ev) => {
      const r = plot.getBoundingClientRect();
      const px = ev.clientX - r.left;
      const py = ev.clientY - r.top;
      let best = 0;
      let bd = Number.POSITIVE_INFINITY;
      view.marks.forEach((m, i) => {
        const dd = ((m.x / W) * r.width - px) ** 2 + ((m.y / CH) * r.height - py) ** 2;
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      for (const [i, el] of dots.entries()) el.classList.toggle("on", i === best);
      readout.innerHTML = view.at(best);
    };
    plot.onpointermove = pick;
    plot.onpointerdown = pick;
    plot.onpointerleave = () => {
      for (const el of dots) el.classList.remove("on");
      readout.innerHTML = view.rest;
    };
  }

  _mountDhw() {
    const plot = this.shadowRoot?.getElementById("dhw-plot");
    if (!plot) return;
    const { t, lang, tz, h } = this._ctx();
    const d = this._data;
    if (!d) return this._emptyPanel("dhw", t("loading"));
    if (!d.hours?.some((r) => r.dhw !== null)) return this._emptyPanel("dhw", t("no_stats"));
    const view = dhwView(d.hours, h.dhw.target, { t, lang, tz });
    const $ = this._fill("dhw", view, H);
    const badge = (cls, key) => `<span class="badge ${cls}">${esc(t(key))}</span>`;
    const e = this._resolved?.entities || {};
    $("extra").innerHTML = kpiGrid(
      [
        {
          k: t("k_storage"),
          v: h.dhw.v === null ? null : fmtTemp(h.dhw.v, lang),
          u: "°C",
          icon: "drop",
          c: "var(--chc-water)",
          s: h.dhw.target === null ? "" : t("k_storage_p", { v: `${fmtTemp(h.dhw.target, lang)} °C` }),
          p: h.dhw.target === null ? undefined : Math.min(100, (h.dhw.v / 75) * 100),
          m: h.dhw.target === null ? undefined : Math.min(100, (h.dhw.target / 75) * 100),
          more: e.dhw_temp,
        },
        d.charge && {
          k: t("k_charges"),
          v: fmtNum(d.charge.perDay, lang, 1),
          u: t("u_per_day"),
          d: d.charge.perDay > 4 ? badge("mid", "b_often") : badge("good", "b_rare"),
          icon: "update",
          c: "var(--chc-water)",
          s: t("k_charges_p", { m: fmtNum(d.charge.minPerRun, lang), t: fmtNum(d.charge.hoursPerDay * 60, lang) }),
          more: e.pump_dhw_charge,
        },
        d.circ && {
          k: t("k_circ"),
          v: fmtNum(d.circ.hoursPerDay, lang, 1),
          u: t("u_h_day"),
          d: d.circ.hoursPerDay > 6 ? badge("mid", "b_long") : "",
          icon: "clock",
          c: "var(--chc-water)",
          s: t("k_circ_p", { n: fmtNum(d.circ.perDay, lang) }),
          more: e.pump_dhw_circ,
        },
      ],
      { cols: 2 },
    );
    this._wireMore($("extra"));
    $("hint").textContent = d.charge || d.circ ? t("hint_dhw") : "";
    scrub(plot, view, $("readout"));
  }

  // ---------- optimisation tips ----------

  /** Id of this heating in the tip store (the burner entity, else the platform). */
  _heatingId() {
    const e = this._resolved?.entities || {};
    return this._config.tip_id || e.burner || e.boiler_temp || this._resolved?.platform || "heating";
  }

  _tipsSection(x) {
    const d = this._data;
    if (!d || d.error) return "";
    const { t, lang, tz, e, h } = x;
    const { tips, ok } = buildTips({
      lang,
      h,
      e,
      d,
      curves: this._setCurves(e),
      num: (id) => num(this._hass, id),
      warn: Number(this._config.takt_warn_min) || 5,
      good: Number(this._config.takt_good_min) || 10,
      platform: this._resolved?.platform,
    });
    const id = this._heatingId();
    this._tips = tips;
    this._openTips = this._openTips || new Set();
    this._confirm = this._confirm || new Set();
    this._errors = this._errors || {};
    const hidden = tips.filter((tip) => STORE.get(id, tip.id)?.hidden);
    const shown = tips.filter((tip) => !STORE.get(id, tip.id)?.hidden);
    const open = shown.filter((tip) => !STORE.get(id, tip.id)?.done).length;
    const date = (iso) =>
      new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: tz,
      });
    const rows = shown
      .map((tip) => {
        const entry = STORE.get(id, tip.id);
        const done = entry?.done;
        const ev = tip.ev.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
        let act;
        if (done) {
          const parts = [t("done_on", { d: date(done) })];
          if (entry.before) parts.push(t("done_before", { v: `${fmtNum(entry.before, lang, 2)} h/Kd` }));
          const since = (d.days || []).filter((r) => !r.today && r.start >= new Date(done));
          const after =
            since.length >= 3 ? efficiency(since, Number(this._config.heating_base_temp) || 15).hoursPerHdd : null;
          if (after !== null && entry.before) {
            const pct = Math.round(((after - entry.before) / entry.before) * 100);
            parts.push(t("done_after", { v: `${fmtNum(after, lang, 2)} h/Kd`, p: `${pct > 0 ? "+" : ""}${pct} %` }));
          } else parts.push(t("done_wait", { d: date(new Date(new Date(done).getTime() + 7 * 864e5)) }));
          act = `<div class="where">${esc(parts.join(" "))}</div>
            <div class="act"><button type="button" class="btn" data-tip-act="undo" data-tip="${tip.id}">${esc(t("btn_undo"))}</button></div>`;
        } else if (tip.action && this._confirm.has(tip.id)) {
          const a = tip.action;
          const q = t("confirm_q", {
            label: a.label,
            from: fmtNum(a.from, lang, a.from % 1 ? 1 : 0),
            to: fmtNum(a.to, lang, a.to % 1 ? 1 : 0),
            unit: a.unit,
          });
          act = `<div class="confirm"><span>${esc(q)}</span>
              <button type="button" class="btn primary" data-tip-act="apply" data-tip="${tip.id}">${esc(t("btn_set"))}</button>
              <button type="button" class="btn" data-tip-act="cancel" data-tip="${tip.id}">${esc(t("btn_cancel"))}</button></div>
            <div class="where"><code>number.set_value</code> · <code>${esc(a.entity)}</code></div>`;
        } else {
          const a = tip.action;
          act = `<div class="act">
              ${a ? `<button type="button" class="btn primary" data-tip-act="ask" data-tip="${tip.id}">${esc(t("btn_apply", { label: a.label, to: fmtNum(a.to, lang, a.to % 1 ? 1 : 0), unit: a.unit }))}</button>` : ""}
              <button type="button" class="btn" data-tip-act="done" data-tip="${tip.id}">${esc(t("btn_done"))}</button>
              <button type="button" class="btn" data-tip-act="hide" data-tip="${tip.id}">${esc(t("btn_hide"))}</button></div>
            ${tip.where ? `<div class="where">${esc(tip.where)}</div>` : ""}`;
        }
        const err = this._errors[tip.id]
          ? `<div class="err">${esc(t("set_error", { e: this._errors[tip.id] }))}</div>`
          : "";
        return `<details class="tip ${done ? "done" : tip.sev}" data-tip="${tip.id}"${this._openTips.has(tip.id) || this._confirm.has(tip.id) ? " open" : ""}>
          <summary><span class="sev"></span><span><div class="tt">${esc((done && entry.title) || tip.title)}</div><div class="ts">${esc(done ? t("done_short") : tip.short)}</div></span>
            ${done ? `<span class="gain">✓</span>` : tip.gain ? `<span class="gain">${esc(tip.gain)}</span>` : "<span></span>"}${svgIcon("chev", "chev")}</summary>
          <div class="body"><div class="ev">${ev}</div><div class="why">${esc(tip.why)}</div>
            <ol>${tip.todo.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${act}${err}</div>
        </details>`;
      })
      .join("");
    const okRow = ok.length
      ? `<div class="okrow"><span>${esc(t("tips_ok"))}</span>${ok.map((o) => `<span class="pump"><span class="dot"></span>${esc(o)}</span>`).join("")}</div>`
      : "";
    const hiddenRow = hidden.length
      ? `<div class="okrow"><span>${esc(t("tips_hidden", { n: hidden.length }))}</span><button type="button" class="linkbtn" data-tip-act="unhide">${esc(t("tips_show"))}</button></div>`
      : "";
    return `<section>
      <div class="section-title">${svgIcon("bulb")}<span>${esc(t("tips_title"))}</span><span class="note">${esc(shown.length ? t("tips_open", { n: open }) : t("tips_none"))}</span></div>
      ${rows ? `<div class="tips">${rows}</div>` : ""}${okRow}${hiddenRow}
      ${rows ? `<div class="hint" style="margin-top:8px">${esc(t("tips_hint"))}</div>` : ""}
    </section>`;
  }

  /** Clicks in the tips section (delegated, wired once). */
  _wireTips() {
    if (this._tipsWired) return;
    this._tipsWired = true;
    this._openTips = this._openTips || new Set();
    this._confirm = this._confirm || new Set();
    this._errors = this._errors || {};
    // Other cards on the page (and the dialog) change the same store.
    STORE.onChange(() => this._render());
    this.shadowRoot.addEventListener(
      "toggle",
      (ev) => {
        const el = ev.target;
        if (!el.matches?.("details.tip")) return;
        if (el.open) this._openTips.add(el.dataset.tip);
        else this._openTips.delete(el.dataset.tip);
      },
      true,
    );
    this.shadowRoot.addEventListener("click", async (ev) => {
      const b = ev.target.closest?.("[data-tip-act]");
      if (!b) return;
      const act = b.dataset.tipAct;
      const tipId = b.dataset.tip;
      const id = this._heatingId();
      const tip = this._tips?.find((x) => x.id === tipId);
      const today = new Date().toISOString().slice(0, 10);
      const before = this._data?.eff?.hoursPerHdd ?? null;
      this._openTips.add(tipId);
      if (act === "ask") this._confirm.add(tipId);
      else if (act === "cancel") this._confirm.delete(tipId);
      else if (act === "done") await STORE.set(this._hass, id, tipId, { done: today, before, title: tip?.title });
      else if (act === "undo") await STORE.set(this._hass, id, tipId, null);
      else if (act === "hide") await STORE.set(this._hass, id, tipId, { hidden: true });
      else if (act === "unhide") {
        for (const x of this._tips || []) if (STORE.get(id, x.id)?.hidden) await STORE.set(this._hass, id, x.id, null);
      } else if (act === "apply" && tip?.action) {
        b.disabled = true;
        try {
          await this._hass.callService("number", "set_value", { entity_id: tip.action.entity, value: tip.action.to });
          delete this._errors[tipId];
          this._confirm.delete(tipId);
          await STORE.set(this._hass, id, tipId, {
            done: today,
            before,
            title: tip.title,
            set: { [tip.action.entity]: tip.action.to },
          });
        } catch (err) {
          this._errors[tipId] = String(err?.message || err);
        }
      }
      this._render();
    });
  }

  /** Tiles with an entity open Home Assistant's dialog of it. */
  _wireMore(root) {
    for (const el of root.querySelectorAll("[data-more]"))
      el.onclick = () =>
        this.dispatchEvent(
          new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.more }, bubbles: true, composed: true }),
        );
  }

  _mountSolar() {
    const plot = this.shadowRoot?.getElementById("solar-plot");
    if (!plot) return;
    const { t, lang, tz, e } = this._ctx();
    const d = this._data;
    if (!d) return this._emptyPanel("solar", t("loading"));
    if (!d.days?.some((r) => r.solar !== null)) return this._emptyPanel("solar", t("no_stats"));
    const today = num(this._hass, e.solar_today) ?? d.days.at(-1).solar ?? 0;
    const view = solarView(d.days, today, { t, lang, tz });
    const $ = this._fill("solar", view, H);
    const coll = num(this._hass, e.solar_collector);
    const stor = num(this._hass, e.solar_storage);
    const months = (d.months || []).slice(1).filter((m) => m.solar !== null);
    let year = null;
    let best = null;
    if (months.length) {
      year = months.reduce((s, m) => s + m.solar, 0);
      best = months.reduce((a, m) => (m.solar > a.solar ? m : a));
    }
    const k = Number(this._config.kwh_per_unit) || 10;
    const eff = Number(this._config.boiler_efficiency) || 0.85;
    const fuel = this._config.fuel === "gas" ? "gas" : "oil";
    $("extra").innerHTML = kpiGrid(
      [
        {
          k: t("k_collector"),
          v: coll === null && stor === null ? null : `${fmtTemp(coll, lang)} / ${fmtTemp(stor, lang)}`,
          u: "°C",
          icon: "sun",
          c: "var(--chc-solar)",
          s: t("k_collector_p"),
          more: e.solar_collector || e.solar_storage,
        },
        d.solarPump && {
          k: t("k_solar_pump"),
          v: fmtNum(d.solarPump.hoursPerDay, lang, 1),
          u: t("u_h_day"),
          icon: "clock",
          c: "var(--chc-solar)",
          s: t("k_solar_pump_p"),
          more: e.pump_solar,
        },
        year !== null && {
          k: t("k_solar_year"),
          v: fmtNum(year / 1000, lang, 1),
          u: "MWh",
          icon: "sun",
          c: "var(--chc-solar)",
          s: t("k_solar_year_p", {
            m: new Date(Date.UTC(best.y, best.m, 15)).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
              month: "long",
              timeZone: "UTC",
            }),
            v: fmtNum(best.solar, lang),
          }),
        },
        year !== null && {
          k: t("k_saved"),
          v: `≈ ${fmtNum(Math.round(year / (k * eff) / 10) * 10, lang)}`,
          u: t(`u_saved_${fuel}`),
          icon: "drop",
          c: "var(--chc-good)",
          s: t("k_saved_p", { k: fmtNum(k, lang), e: fmtNum(eff * 100, lang) }),
        },
      ],
      { cols: 2 },
    );
    this._wireMore($("extra"));
    scrub(plot, view, $("readout"));
  }

  _efficiencySection({ t, lang, e }) {
    const d = this._data;
    const f = d?.eff;
    if (!f) return "";
    const fuel = this._config.fuel === "gas" ? "gas" : "oil";
    const unit = t(`unit_${fuel}`);
    const base = Number(this._config.heating_base_temp) || 15;
    const life = num(this._hass, e.burner_hours_2) / num(this._hass, e.burner_hours);
    const tiles = kpiGrid(
      [
        f.hoursPerHdd !== null && {
          k: t("k_hpk"),
          v: fmtNum(f.hoursPerHdd, lang, 2),
          u: "h/Kd",
          icon: "clock",
          c: "var(--chc-heat)",
          s: t("k_hpk_p", { h: fmtNum(f.hours, lang), d: fmtNum(f.deg, lang) }),
          more: e.burner_hours,
        },
        f.fuelPerHour !== null && {
          k: t(`k_fuel_h_${fuel}`),
          v: fmtNum(f.fuelPerHour, lang, 2),
          u: `${unit}/h`,
          icon: "drop",
          c: "var(--chc-heat)",
          s: t("k_fuel_h_p", { f: `${fmtNum(f.fuel, lang)} ${unit}`, h: fmtNum(f.hours, lang) }),
        },
        f.fuelPerHdd !== null && {
          k: t(`k_fuel_k_${fuel}`),
          v: fmtNum(f.fuelPerHdd, lang, 2),
          u: `${unit}/Kd`,
          icon: "thermo",
          c: "var(--chc-heat)",
          s: t("k_fuel_k_p", { b: base }),
        },
        f.startsPerHdd !== null && {
          k: t("k_spk"),
          v: fmtNum(f.startsPerHdd, lang, 1),
          icon: "update",
          c: "var(--chc-heat)",
          s: t("k_spk_p"),
          more: e.burner_starts,
        },
        f.stage2 !== null && {
          k: t("k_stage2"),
          v: fmtNum(f.stage2 * 100, lang),
          u: "%",
          icon: "fire",
          c: "var(--chc-heat)",
          s: Number.isFinite(life) ? t("k_stage2_p", { v: fmtNum(life * 100, lang) }) : "",
          p: f.stage2 * 100,
          more: e.burner_hours_2,
        },
        f.modulation !== null && {
          k: t("k_mod"),
          v: `≈ ${fmtNum(f.modulation, lang)}`,
          u: "%",
          icon: "gauge",
          c: "var(--chc-heat)",
          s: t("k_mod_p"),
          p: f.modulation,
        },
        d.summer !== null &&
          d.summer !== undefined && {
            k: t("k_summer"),
            v: fmtNum(d.summer, lang),
            u: t("u_h_month"),
            icon: "sun",
            c: "var(--chc-water)",
            s: t("k_summer_p"),
          },
      ],
      { cols: 2 },
    );
    if (!tiles) return "";
    return `<section>
      <div class="section-title">${svgIcon("gauge")}<span>${esc(t("eff_title"))}</span><span class="note">${esc(t("eff_note"))}</span></div>
      ${tiles}
    </section>`;
  }

  /** Footer figures as tiles: burner hours, starts, since the last service and how often the cloud answered. */
  _footer({ t, lang, tz, e }) {
    const hours = num(this._hass, e.burner_hours);
    const starts = num(this._hass, e.burner_starts);
    const m = this._data?.maint;
    const a = this._data?.avail;
    const date = this._config.maintenance_date
      ? new Date(this._config.maintenance_date).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: tz,
        })
      : "";
    const tiles = kpiGrid(
      [
        {
          k: t("f_hours"),
          v: hours === null ? null : fmtNum(hours, lang),
          u: "h",
          icon: "clock",
          c: "var(--chc-heat)",
          s: hours !== null && starts ? t("f_hours_d", { v: fmtNum((hours * 60) / starts, lang, 1) }) : "",
          more: e.burner_hours,
        },
        {
          k: t("f_starts"),
          v: starts === null ? null : fmtNum(starts, lang),
          icon: "update",
          c: "var(--chc-heat)",
          s: t("f_starts_d"),
          more: e.burner_starts,
        },
        {
          k: t("f_maint"),
          v: m && m.hours !== null && hours !== null ? fmtNum(hours - m.hours, lang) : null,
          u: "h",
          icon: "wrench",
          c: "var(--chc-temp)",
          s:
            m && m.starts !== null && starts !== null
              ? t("f_maint_d", { n: fmtNum(starts - m.starts, lang), d: date })
              : t("f_maint_d0", { d: date }),
        },
        {
          k: t("f_avail"),
          v: a === null || a === undefined ? null : fmtNum(a * 100, lang, 1),
          u: "%",
          icon: "cloud",
          c: a !== null && a !== undefined && a < 0.95 ? "var(--chc-mid)" : "var(--chc-good)",
          st: a !== null && a !== undefined && a < 0.95 ? "warn" : "",
          s: t("f_avail_d", { b: this._resolved?.brand || "" }),
          p: a === null || a === undefined ? undefined : a * 100,
          more: e.burner,
        },
      ],
      { cols: 2 },
    );
    if (!tiles) return "";
    return `<section>
      <div class="section-title">${svgIcon("wrench")}<span>${esc(t("f_title"))}</span><span class="note">${esc(t("f_note"))}</span></div>
      ${tiles}
    </section>`;
  }

  _burnerSection({ t }) {
    const btn = (v) =>
      `<button type="button" data-view="${v}" aria-pressed="${this._view === v}">${esc(t(`v_${v}`))}</button>`;
    return `<section>
      <div class="section-title">${svgIcon("bars")}<span>${esc(t("burner"))}</span><span class="note" id="note"></span></div>
      <div class="panel">
        <div class="seg" role="group">${VIEWS.map(btn).join("")}</div>
        <div class="readout" id="readout"></div>
        <div class="plot" id="plot"></div>
        <div class="axis" id="axis"></div>
        <div class="legend" id="legend"></div>
        <div id="extra"></div>
        <div class="hint" id="hint"></div>
      </div>
    </section>`;
  }

  /** Fills the burner panel for the selected view and wires up the buttons and scrubbing. */
  _mountChart() {
    const root = this.shadowRoot;
    const plot = root?.getElementById("plot");
    if (!plot) return;
    const { t, lang, tz } = this._ctx();
    const $ = (id) => root.getElementById(id);
    for (const b of root.querySelectorAll(".seg button")) {
      b.setAttribute("aria-pressed", String(b.dataset.view === this._view));
      b.onclick = () => {
        this._view = b.dataset.view;
        this._mountChart();
      };
    }
    const empty = (msg) => {
      $("readout").innerHTML = `<span class="v">–</span><span class="k">${esc(msg)}</span>`;
      plot.innerHTML = "";
      for (const id of ["axis", "legend", "hint", "note", "extra"]) $(id).innerHTML = "";
    };
    const d = this._data;
    if (!d) return empty(t("loading"));
    if (d.error) return empty(t("load_error", { e: d.error }));
    const warn = Number(this._config.takt_warn_min) || 5;
    const good = Number(this._config.takt_good_min) || 10;
    let view;
    if (this._view === "months") {
      if (!d.months) return empty(t("no_stats"));
      view = monthsView(d.months, { t, lang });
    } else if (this._view === "days") {
      if (!d.days) return empty(t("no_stats"));
      view = daysView(d.days, { t, lang, tz, base: Number(this._config.heating_base_temp) || 15 });
    } else {
      view = taktView(d.takt, d.summary, { t, lang, tz, warn, good });
      view.hint = t("hint_takt", { v: good });
      view.extra = d.summary
        ? `<div class="scale"><i></i><i></i><i></i><b style="left:${view.scale.toFixed(1)}%"></b></div>
           <div class="scalelbl"><span>${esc(t("scale_warn", { v: warn }))}</span><span>${esc(t("scale_mid", { a: warn, b: good }))}</span><span>${esc(t("scale_good", { v: good }))}</span></div>`
        : "";
    }
    const pos = (m) => `left:${((m.x / W) * 100).toFixed(2)}%;top:${((m.y / H) * 100).toFixed(2)}%`;
    plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${view.svg}</svg>
      ${(view.marks || []).map((m) => `<div class="mark" style="${pos(m)}"></div>`).join("")}
      <div class="hl" hidden></div>`;
    $("readout").innerHTML = view.rest;
    $("note").textContent = view.note || "";
    $("axis").innerHTML = view.axis.map((a) => `<span>${esc(a)}</span>`).join("");
    $("legend").innerHTML = view.legend
      .map(([kind, color, txt]) => `<span><i class="sw ${kind}" style="--sw:${color}"></i>${esc(txt)}</span>`)
      .join("");
    $("extra").innerHTML = view.extra || "";
    $("hint").textContent = view.hint || "";
    scrub(plot, view, $("readout"));
  }

  _header(x) {
    const { t, h, color, animate } = x;
    const name = this._config.name || t("title");
    const sub = this._subtitle(x);
    if (this._illustrated()) {
      const button = this._config._dialog
        ? `<button type="button" class="zoom" data-close aria-label="${esc(t("close"))}">${svgIcon("close")}</button>`
        : "";
      return this._banner(x, { sub, button });
    }
    const pill = this._pill(x);
    return `<div class="header">
      <div class="logo" style="--c:${color}">${flameSVG({ on: !!h.burner.on, level: h.burner.level, small: true, animate })}</div>
      <div class="titles"><div class="name">${esc(name)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>
      <span class="pill" style="--c:${pill.color}" title="${esc(pill.text)}"><span class="dot"></span><span><span class="pl">${esc(pill.text)}</span><span class="ps">${esc(pill.short)}</span></span></span>
      ${this._config._dialog ? `<button type="button" class="zoom" data-close aria-label="${esc(t("close"))}">${svgIcon("close")}</button>` : ""}
    </div>`;
  }

  /**
   * The now tiles: boiler, flow, hot water (bar against the target, the mark at the target), outdoor with the last
   * 24 hours as a curve, and today's burner starts (wide, red while the burner cycles). A value that is not there
   * leaves its tile out; the rows close up.
   */
  _nowTiles(x, cols) {
    const { t, h, lang, e } = x;
    const pct = (v, max) => (v === null ? undefined : Math.max(0, Math.min(100, (v / max) * 100)));
    const temp = (v) => (v === null || v === undefined ? null : fmtTemp(v, lang));
    const show = (key, entity) => entity && !this._hidden(key);
    const hours = (this._data?.hours || []).slice(-24).map((r) => r.outdoor);
    const known = hours.filter((v) => v !== null);
    const today = this._data?.takt?.at(-1);
    const warn = Number(this._config.takt_warn_min) || 5;
    const good = Number(this._config.takt_good_min) || 10;
    const cls = today?.min ? taktClass(today.min, warn, good) : null;
    return kpiGrid(
      [
        show("boiler", e.boiler_temp) && {
          key: "boiler",
          k: t("boiler"),
          v: temp(h.boiler.v),
          u: "°C",
          icon: "fire",
          c: "var(--chc-heat)",
          s:
            h.boiler.target === null && h.boiler.supply !== null
              ? t("boiler_supply", { v: `${fmtTemp(h.boiler.supply, lang)} °C` })
              : targetLine(h.boiler.v, h.boiler.target, "target", lang, t),
          p: h.boiler.target === null ? undefined : pct(h.boiler.v, 90),
          m: pct(h.boiler.target, 90),
          more: e.boiler_temp,
        },
        show("flow", e.flow_temp) && {
          key: "flow",
          k: t("flow"),
          v: temp(h.flow.v),
          u: "°C",
          icon: "thermo",
          c: "var(--chc-heat)",
          s: targetLine(h.flow.v, h.flow.target, "curve", lang, t),
          p: h.flow.target === null ? undefined : pct(h.flow.v, 90),
          m: pct(h.flow.target, 90),
          more: e.flow_temp,
        },
        show("dhw", e.dhw_temp) && {
          key: "dhw",
          k: t("dhw"),
          v: temp(h.dhw.v),
          u: "°C",
          icon: "drop",
          c: "var(--chc-water)",
          s: targetLine(h.dhw.v, h.dhw.target, "target", lang, t),
          p: h.dhw.target === null ? undefined : pct(h.dhw.v, 75),
          m: pct(h.dhw.target, 75),
          more: e.dhw_temp,
        },
        show("outdoor", e.outdoor) && {
          key: "outdoor",
          k: t("outdoor"),
          v: temp(h.outdoor),
          u: "°C",
          icon: "thermo",
          c: "var(--chc-temp)",
          s:
            known.length > 1
              ? t("k_24h", { lo: fmtTemp(Math.min(...known), lang), hi: fmtTemp(Math.max(...known), lang) })
              : "",
          sp: known.length > 1 ? hours : null,
          more: e.outdoor,
        },
        show("starts", e.burner_starts || e.burner) && {
          key: "starts",
          k: t("k_starts_today"),
          v: today && today.starts !== null ? fmtNum(today.starts, lang) : null,
          u: today?.min ? t("k_per_start", { v: fmtNum(today.min, lang, 1) }) : "",
          icon: "update",
          c: cls === "warn" ? "var(--chc-warn)" : cls === "mid" ? "var(--chc-mid)" : "var(--chc-heat)",
          st: cls === "warn" ? "bad" : cls === "mid" ? "warn" : "",
          s: today?.min ? t("k_starts_goal", { v: fmtNum(good, lang) }) : "",
          p: today?.min ? pct(today.min, good * 2) : undefined,
          m: today?.min ? 50 : undefined,
          wide: true,
          more: e.burner_starts || e.burner,
        },
      ],
      { cols },
    );
  }

  _nowSection(x) {
    const { t, h, lang, tz, now, animate } = x;
    const b = h.burner;
    const pumps = this._hidden("pumps")
      ? ""
      : h.pumps
          .map(
            (p) =>
              `<span class="pump${p.on ? " on" : ""}${p.on === null ? " unknown" : ""}"><span class="dot"></span>${esc(t(p.key))}</span>`,
          )
          .join("");
    let room = "";
    if (h.room && h.room.v !== null && !this._hidden("room")) {
      const v = `${fmtTemp(h.room.v, lang)} °C`;
      room = h.room.plausible
        ? esc(t("room_line", { v, t: h.room.target === null ? "–" : `${fmtTemp(h.room.target, lang)} °C` }))
        : `${esc(t("room"))} <s>${esc(v)}</s> ${esc(t("room_implausible"))}`;
      room = `<div class="hint room">${room}</div>`;
    }
    const bt = b.on === null ? t("burner_unknown") : t(b.on ? "burner_on" : "burner_off");
    // With the illustrated header, the flame is drawn in the banner: the burner state goes into the section title.
    const flat = this._illustrated() && this._config.sections.includes("header");
    if (flat)
      return `<section>
      <div class="section-title">${svgIcon("clock")}<span>${esc(t("now"))}</span><span class="note">${esc([bt, burnerDetail(b, now, lang, tz, t)].filter(Boolean).join(" · "))}</span></div>
      ${this._nowTiles(x, 3)}
      ${pumps ? `<div class="pumps">${pumps}</div>` : ""}${room}
    </section>`;
    return `<section>
      <div class="section-title">${svgIcon("clock")}<span>${esc(t("now"))}</span></div>
      <div class="now">
        <div class="burner${b.on ? " on" : ""}">${flameSVG({ on: !!b.on, level: b.level, animate })}
          <div><div class="bt">${esc(bt)}</div><div class="bs">${esc(burnerDetail(b, now, lang, tz, t))}</div></div></div>
        ${this._nowTiles(x, 2)}
      </div>
      ${pumps ? `<div class="pumps">${pumps}</div>` : ""}${room}
    </section>`;
  }
}

/** One row: flame, name, status and the main temperatures. */
export class CentralHeatingMiniCard extends HeatingCardBase {
  static getConfigElement() {
    return document.createElement("central-heating-mini-card-editor");
  }

  static getStubConfig(hass) {
    return { type: "custom:central-heating-mini-card", ...stubConfig(hass) };
  }

  constructor() {
    super();
    this._expanded = false;
  }

  setConfig(config) {
    super.setConfig({ popup: true, ...config });
    if (this._inline) this._inline.setConfig(this._mainConfig());
  }

  set hass(hass) {
    super.hass = hass;
    if (this._dialog?.isOpen) this._dialog.hass = hass;
    if (this._inline) this._inline.hass = hass;
  }

  get hass() {
    return this._hass;
  }

  _mainConfig() {
    const { popup, ...rest } = this._config;
    return { ...rest, type: "custom:central-heating-card" };
  }

  _open(opener) {
    const t = translator(langOf(this._hass, this._config));
    if (this._config.popup === false) {
      this._expanded = !this._expanded;
      const box = this.shadowRoot.querySelector("[data-inline]");
      if (this._expanded) {
        this._inline = document.createElement("central-heating-card");
        this._inline.setConfig(this._mainConfig());
        this._inline.hass = this._hass;
        box.append(this._inline);
      } else {
        box.replaceChildren();
        this._inline = null;
      }
      this._render();
      this.dispatchEvent(new Event("iron-resize", { bubbles: true, composed: true }));
      return;
    }
    this._dialog = this._dialog || document.createElement("central-heating-dialog");
    this._dialog.open({ config: this._mainConfig(), hass: this._hass, opener, label: this._config.name || t("title") });
  }

  getCardSize() {
    return this._expanded ? 12 : 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 3, rows: "auto" };
  }

  _render() {
    if (!this._config || !this._hass) return;
    const x = this._ctx();
    const { t, h, color, lang, animate } = x;
    const name = this._config.name || t("title");
    const pill = this._pill(x);
    const takt = this._data?.takt || [];
    const today = takt.at(-1);
    const parts = [];
    if (today && today.starts !== null) parts.push(esc(t("starts_today", { n: fmtNum(today.starts, lang) })));
    if (h.boiler.v !== null) parts.push(`${esc(t("boiler"))} <b>${fmtTemp(h.boiler.v, lang)} °C</b>`);
    if (h.dhw.v !== null) parts.push(`${esc(t("dhw_short"))} <b>${fmtTemp(h.dhw.v, lang)} °C</b>`);
    if (h.outdoor !== null) parts.push(`${esc(t("outdoor"))} <b>${fmtTemp(h.outdoor, lang)} °C</b>`);
    const inline = this._config.popup === false;
    const btn = `<button type="button" class="zoom" data-open ${inline ? `aria-expanded="${this._expanded}"` : 'aria-haspopup="dialog"'} aria-label="${esc(t("open"))}">${svgIcon(inline && this._expanded ? "collapse" : "expand")}</button>`;
    if (!this.shadowRoot.firstChild) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="wrap"><div data-row></div><div data-inline></div></div>`;
      this.shadowRoot.addEventListener("click", (e) => {
        const open = e.target.closest?.("[data-open]");
        if (open) this._open(open);
      });
    }
    if (this._illustrated()) {
      this.shadowRoot.querySelector("[data-row]").innerHTML = `<ha-card class="${animate ? "anim" : ""}">
        ${this._banner(x, { sub: this._subtitle(x), button: btn })}
        <div class="mrow"><div class="mdetail">${parts.join(" · ")}</div>${this._spark(takt, pill.color)}</div>
      </ha-card>`;
      this._afterRender();
      this._maybeLoad();
      return;
    }
    this.shadowRoot.querySelector("[data-row]").innerHTML = `<ha-card class="${animate ? "anim" : ""}">
      <div class="mini">
        <div class="logo" style="--c:${color}">${flameSVG({ on: !!h.burner.on, level: h.burner.level, small: true, animate })}</div>
        <div class="mmain">
          <div class="mtop"><span class="name">${esc(name)}</span>
            <span class="pill" style="--c:${pill.color}" title="${esc(pill.text)}"><span class="dot"></span><span>${esc(pill.short)}</span></span></div>
          <div class="mdetail">${parts.join(" · ")}</div>
        </div>
        ${this._spark(takt, pill.color)}
        ${btn}
      </div>
    </ha-card>`;
    this._maybeLoad();
  }

  /** Starts per day as small bars, today last. */
  _spark(takt, color) {
    const v = takt.map((d) => d.starts ?? 0);
    const max = Math.max(...v, 0);
    if (!max) return "";
    const bars = v
      .map((n, i) => {
        const h = Math.max(1, (n / max) * 32);
        return `<rect${i === v.length - 1 ? ' class="last"' : ""} x="${i * 11}" y="${(34 - h).toFixed(1)}" width="7" height="${h.toFixed(1)}" rx="1.5"></rect>`;
      })
      .join("");
    return `<svg class="spark" viewBox="0 0 ${v.length * 11 - 4} 34" style="--c:${color}" aria-hidden="true">${bars}</svg>`;
  }
}

if (!customElements.get("central-heating-card")) customElements.define("central-heating-card", CentralHeatingCard);
if (!customElements.get("central-heating-mini-card"))
  customElements.define("central-heating-mini-card", CentralHeatingMiniCard);

window.customCards = window.customCards || [];
for (const [type, name, description] of [
  [
    "central-heating-card",
    "Central Heating Card",
    "Oil or gas heating (Wolf, Viessmann): burner, temperatures, pumps.",
  ],
  ["central-heating-mini-card", "Central Heating Mini Card", "Heating in one row."],
]) {
  if (!window.customCards.some((c) => c.type === type))
    window.customCards.push({
      type,
      name,
      description,
      preview: true,
      documentationURL: "https://github.com/hoentaex/ha-central-heating-card",
    });
}

console.info(
  `%c CENTRAL-HEATING-CARD %c v${VERSION} `,
  "color:#1d0e06;background:#ff7a45;font-weight:700",
  "color:#ff7a45",
);
