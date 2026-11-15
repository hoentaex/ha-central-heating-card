// Shared helpers: i18n (de / en), number and time formatting, config defaults.

export const SECTIONS = ["header", "now"];

export const DEFAULTS = {
  preset: "auto",
  name: "",
  subtitle: "",
  entities: {},
  outdoor_entity: "",
  hide: [],
  sections: SECTIONS,
  animations: true,
};

const STRINGS = {
  de: {
    title: "Heizung",
    now: "Jetzt",
    st_running: "Brenner läuft",
    st_dhw: "Warmwasser lädt",
    st_idle: "Bereit",
    st_offline: "Keine Verbindung",
    burner_on: "Brenner läuft",
    burner_off: "Brenner aus",
    burner_unknown: "Brenner unbekannt",
    since: "seit {time}",
    since_min: "seit {n} min",
    off_since: "aus seit {time}",
    modulation: "Modulation {v} %",
    boiler: "Kessel",
    flow: "Vorlauf",
    dhw: "Warmwasser",
    outdoor: "Außen",
    room: "Raum",
    target: "Soll {v}",
    curve: "Kurve {v}",
    boiler_supply: "Kesselvorlauf {v}",
    reached: "erreicht",
    below: "−{v} K",
    above: "+{v} K",
    room_line: "Raum {v} · Soll {t}",
    room_implausible: "(unplausibel, der Fühler sitzt vermutlich am Kessel)",
    dhw_short: "WW",
    as_of: "Stand {time}",
    pump_boiler: "Kesselkreis",
    pump_heating: "Heizkreis",
    pump_mixer: "Mischerkreis",
    pump_dhw_charge: "Speicherladung",
    pump_dhw_circ: "Zirkulation",
    pump_solar: "Solar",
    mode_auto: "Automatik",
    mode_heat: "Heizen",
    mode_off: "Aus",
    mode_heat_cool: "Automatik",
    prog_normal: "Normal",
    prog_reduced: "Reduziert",
    prog_comfort: "Komfort",
    no_entities: "Keine Heizung gefunden. Bitte preset (wolflink / vicare) oder entities konfigurieren.",
    open: "Details öffnen",
  },
  en: {
    title: "Heating",
    now: "Now",
    st_running: "Burner on",
    st_dhw: "Heating hot water",
    st_idle: "Ready",
    st_offline: "No connection",
    burner_on: "Burner on",
    burner_off: "Burner off",
    burner_unknown: "Burner unknown",
    since: "since {time}",
    since_min: "for {n} min",
    off_since: "off since {time}",
    modulation: "Modulation {v} %",
    boiler: "Boiler",
    flow: "Flow",
    dhw: "Hot water",
    outdoor: "Outdoor",
    room: "Room",
    target: "Target {v}",
    curve: "Curve {v}",
    boiler_supply: "Boiler supply {v}",
    reached: "reached",
    below: "−{v} K",
    above: "+{v} K",
    room_line: "Room {v} · target {t}",
    room_implausible: "(implausible, the sensor probably sits at the boiler)",
    dhw_short: "DHW",
    as_of: "as of {time}",
    pump_boiler: "Boiler circuit",
    pump_heating: "Heating circuit",
    pump_mixer: "Mixer circuit",
    pump_dhw_charge: "Cylinder charging",
    pump_dhw_circ: "Circulation",
    pump_solar: "Solar",
    mode_auto: "Auto",
    mode_heat: "Heating",
    mode_off: "Off",
    mode_heat_cool: "Auto",
    prog_normal: "Normal",
    prog_reduced: "Reduced",
    prog_comfort: "Comfort",
    no_entities: "No heating found. Please configure preset (wolflink / vicare) or entities.",
    open: "Open details",
  },
};

export const langOf = (hass, config) => {
  const lang = String(config?.language || hass?.locale?.language || hass?.language || "en").slice(0, 2);
  return lang in STRINGS ? lang : "en";
};

/** t(key, { name: value }) with {name} placeholders; unknown keys come back as they are. */
export const translator =
  (lang) =>
  (key, vars = {}) =>
    String(STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

/** Whether the translation table knows a key (for optional labels such as modes). */
export const hasKey = (lang, key) => key in (STRINGS[lang] || {}) || key in STRINGS.en;

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export const locale = (lang) => (lang === "de" ? "de-DE" : "en-GB");

/** Number in the card's language (de: decimal comma), or "–" when it is not a finite number. */
export const fmtNum = (value, lang, digits = 0) => {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return "–";
  return n.toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

/** Temperature with one decimal when it has one: "47,6" / "49". */
export const fmtTemp = (value, lang) =>
  value === null || value === undefined ? "–" : fmtNum(value, lang, Number.isInteger(value) ? 0 : 1);

export const fmtTime = (date, lang, tz) =>
  date.toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });

/** Mode label: known modes translated, anything else (Wolf "heizbetrieb") with a capital first letter. */
export function modeLabel(mode, lang) {
  if (!mode || ["unavailable", "unknown"].includes(mode)) return "";
  const key = `mode_${String(mode).toLowerCase()}`;
  if (hasKey(lang, key)) return translator(lang)(key);
  const s = String(mode).replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
