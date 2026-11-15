/*
 * Central Heating Card for Home Assistant
 * https://github.com/hoentaex/ha-central-heating-card
 *
 * Oil or gas central heating in one card: burner with an animated flame, temperatures with their targets, pumps.
 * Finds the entities of the Wolf SmartSet (wolflink) and Viessmann ViCare (vicare) integrations by itself.
 *
 * Layout and look follow the cards of juju35 (https://github.com/juju35). MIT licence.
 */
import { resolveEntities } from "./detect.js";
import { flameSVG } from "./flame.js";
import { readHeating, statusOf } from "./heating.js";
import { svgIcon } from "./icons.js";
import { DEFAULTS, esc, fmtTemp, fmtTime, langOf, modeLabel, SECTIONS, translator } from "./shared.js";
import { burnerDetail, targetLine } from "./texts.js";
import { STYLE } from "./styles.js";
import { tzOf } from "./tz.js";

const VERSION = __VERSION__;

export const STATUS_COLOR = {
  running: "var(--chc-heat)",
  dhw: "var(--chc-water)",
  idle: "var(--chc-sub)",
  offline: "var(--chc-warn)",
};

class HeatingCardBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sig = "";
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const sections = Array.isArray(config.sections) ? config.sections.filter((s) => SECTIONS.includes(s)) : SECTIONS;
    this._config = { ...DEFAULTS, ...config, sections, hide: Array.isArray(config.hide) ? config.hide : [] };
    this._resolved = null;
    this._sig = "";
    if (this._hass) this._render();
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
  static getStubConfig() {
    return { type: "custom:central-heating-card", preset: "auto" };
  }

  getCardSize() {
    return 5;
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
      ? show("now")
        ? this._nowSection(x)
        : ""
      : `<div class="empty">${svgIcon("alert")}<span>${esc(t("no_entities"))}</span></div>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card class="${x.animate ? "anim" : ""}">
      ${show("header") ? this._header(x) : ""}
      <div class="content">${body}</div>
    </ha-card>`;
  }

  _header(x) {
    const { t, h, status, color, animate } = x;
    const name = this._config.name || t("title");
    const sub = this._subtitle(x);
    return `<div class="header">
      <div class="logo" style="--c:${color}">${flameSVG({ on: !!h.burner.on, level: h.burner.level, small: true, animate })}</div>
      <div class="titles"><div class="name">${esc(name)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>
      <span class="pill" style="--c:${color}"><span class="dot"></span><span>${esc(t(`st_${status}`))}</span></span>
    </div>`;
  }

  _tile(key, label, v, sub, meter = null) {
    const m = meter
      ? `<div class="meter" style="--c:${meter.color}"><i style="width:${meter.fill}%"></i>${meter.mark === null ? "" : `<b style="left:${meter.mark}%"></b>`}</div>`
      : "";
    return `<div class="tile" data-tile="${key}"><span class="k">${esc(label)}</span>
      <span class="v num">${v}${v === "–" ? "" : "<small>°C</small>"}</span><span class="s">${esc(sub)}</span>${m}</div>`;
  }

  _nowSection(x) {
    const { t, h, lang, tz, now, e, animate } = x;
    const b = h.burner;
    const pct = (v, max) => (v === null ? 0 : Math.max(0, Math.min(100, (v / max) * 100)));
    const meter = (v, target, max, color) =>
      target === null ? null : { fill: pct(v, max), mark: pct(target, max), color };
    const tiles = [];
    if (e.boiler_temp && !this._hidden("boiler"))
      tiles.push(
        this._tile(
          "boiler",
          t("boiler"),
          fmtTemp(h.boiler.v, lang),
          h.boiler.target === null && h.boiler.supply !== null
            ? t("boiler_supply", { v: `${fmtTemp(h.boiler.supply, lang)} °C` })
            : targetLine(h.boiler.v, h.boiler.target, "target", lang, t),
          meter(h.boiler.v, h.boiler.target, 90, "var(--chc-heat)"),
        ),
      );
    if (e.flow_temp && !this._hidden("flow"))
      tiles.push(
        this._tile(
          "flow",
          t("flow"),
          fmtTemp(h.flow.v, lang),
          targetLine(h.flow.v, h.flow.target, "curve", lang, t),
          meter(h.flow.v, h.flow.target, 90, "var(--chc-heat)"),
        ),
      );
    if (e.dhw_temp && !this._hidden("dhw"))
      tiles.push(
        this._tile(
          "dhw",
          t("dhw"),
          fmtTemp(h.dhw.v, lang),
          targetLine(h.dhw.v, h.dhw.target, "target", lang, t),
          meter(h.dhw.v, h.dhw.target, 75, "var(--chc-water)"),
        ),
      );
    if (e.outdoor && !this._hidden("outdoor"))
      tiles.push(this._tile("outdoor", t("outdoor"), fmtTemp(h.outdoor, lang), ""));

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
    return `<section>
      <div class="section-title">${svgIcon("clock")}<span>${esc(t("now"))}</span></div>
      <div class="now">
        <div class="burner${b.on ? " on" : ""}">${flameSVG({ on: !!b.on, level: b.level, animate })}
          <div><div class="bt">${esc(bt)}</div><div class="bs">${esc(burnerDetail(b, now, lang, tz, t))}</div></div></div>
        <div class="tiles">${tiles.join("")}</div>
      </div>
      ${pumps ? `<div class="pumps">${pumps}</div>` : ""}${room}
    </section>`;
  }
}

/** One row: flame, name, status and the main temperatures. */
export class CentralHeatingMiniCard extends HeatingCardBase {
  static getStubConfig() {
    return { type: "custom:central-heating-mini-card", preset: "auto" };
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 3, rows: "auto" };
  }

  _render() {
    if (!this._config || !this._hass) return;
    const { t, h, status, color, lang, animate } = this._ctx();
    const name = this._config.name || t("title");
    const parts = [];
    if (h.boiler.v !== null) parts.push(`${esc(t("boiler"))} <b>${fmtTemp(h.boiler.v, lang)} °C</b>`);
    if (h.dhw.v !== null) parts.push(`${esc(t("dhw_short"))} <b>${fmtTemp(h.dhw.v, lang)} °C</b>`);
    if (h.outdoor !== null) parts.push(`${esc(t("outdoor"))} <b>${fmtTemp(h.outdoor, lang)} °C</b>`);
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card class="${animate ? "anim" : ""}">
      <div class="mini">
        <div class="logo" style="--c:${color}">${flameSVG({ on: !!h.burner.on, level: h.burner.level, small: true, animate })}</div>
        <div class="mmain">
          <div class="mtop"><span class="name">${esc(name)}</span>
            <span class="pill" style="--c:${color}"><span class="dot"></span><span>${esc(t(`st_${status}`))}</span></span></div>
          <div class="mdetail">${parts.join(" · ")}</div>
        </div>
      </div>
    </ha-card>`;
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
