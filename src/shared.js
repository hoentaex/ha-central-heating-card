// Shared helpers: i18n (de / en), number and time formatting, config defaults.

export const SECTIONS = ["header", "now", "burner"];
export const VIEWS = ["takt", "days", "months"];

export const DEFAULTS = {
  preset: "auto",
  name: "",
  subtitle: "",
  entities: {},
  outdoor_entity: "",
  hide: [],
  sections: SECTIONS,
  animations: true,
  default_view: "takt",
  heating_base_temp: 15,
  takt_warn_min: 5,
  takt_good_min: 10,
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
    burner: "Brenner",
    v_takt: "Takt 7 Tage",
    v_days: "30 Tage",
    v_months: "12 Monate",
    loading: "Lade Verlauf …",
    load_error: "Verlauf nicht verfügbar: {e}",
    starts_per_day: "Starts/Tag",
    min_per_start: "min je Start",
    starts: "Starts",
    mean_range: "Mittel {a}–{b}",
    today_starts: "heute bisher {n} Starts",
    today_so_far: "heute bisher",
    today_short: "heute",
    no_starts: "In den letzten 7 Tagen kein Brennerstart",
    no_data_on: "keine Daten · {day}",
    flame_hours: "Flamme {h} h",
    lg_starts: "Starts je Tag",
    lg_runtime: "Ø Laufzeit (min, 0–{max})",
    note_takt: "Ampel",
    scale_warn: "< {v} min",
    scale_mid: "{a}–{b} min",
    scale_good: "> {v} min",
    hint_takt:
      "Starts und Laufzeit aus dem Verlauf. Balkenfarbe = Ampel des Tages; Ziel sind deutlich über {v} Minuten je Start. Kurze Läufe kosten Brennstoff und verschleißen Zündung und Düse.",
    hours_in_days: "h in {n} Tagen",
    hours_short: "h",
    per_hdd: "{v} h je Heizgradtag",
    starts_sum: "{n} Starts",
    mean_temp: "Ø {v} °C außen",
    lg_hours: "Brennerstunden",
    lg_temp: "Außentemp. {lo}–{hi} °C",
    hint_days:
      "Je kälter, desto länger läuft der Brenner. Stunden je Heizgradtag rechnen das Wetter heraus. Die Integration zählt nur volle Stunden.",
    hours_since: "h seit {m}",
    stats_since: "Langzeitstatistik beginnt {m}",
    hint_months_short: "laufender Monat bis heute",
    no_stats: "Keine Langzeitstatistik der Brennerstunden",
    so_far: "bis heute",
    prev_is: "Vorjahr {v} h",
    min_each: "Ø {v} min je Start",
    lg_prev_month: "Vorjahresmonat",
    hint_months: "Brennerstunden je Monat. Der laufende Monat ist heller.",
    note_months: "mit Vorjahr",
    takt_warn: "taktet stark",
    takt_mid: "taktet etwas",
    takt_good: "läuft ruhig",
    takt_pill: "{s} · Ø {v} min",
    starts_today: "{n} Starts heute",
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
    burner: "Burner",
    v_takt: "Cycling 7 days",
    v_days: "30 days",
    v_months: "12 months",
    loading: "Loading history …",
    load_error: "History not available: {e}",
    starts_per_day: "starts/day",
    min_per_start: "min per start",
    starts: "starts",
    mean_range: "mean {a}–{b}",
    today_starts: "today {n} starts so far",
    today_so_far: "today so far",
    today_short: "today",
    no_starts: "No burner start in the last 7 days",
    no_data_on: "no data · {day}",
    flame_hours: "flame {h} h",
    lg_starts: "Starts per day",
    lg_runtime: "Ø running time (min, 0–{max})",
    note_takt: "rating",
    scale_warn: "< {v} min",
    scale_mid: "{a}–{b} min",
    scale_good: "> {v} min",
    hint_takt:
      "Starts and running time from the history. Bar colour = the day's rating; aim for well over {v} minutes per start. Short runs waste fuel and wear the ignition and nozzle.",
    hours_in_days: "h in {n} days",
    hours_short: "h",
    per_hdd: "{v} h per heating degree day",
    starts_sum: "{n} starts",
    mean_temp: "Ø {v} °C outdoors",
    lg_hours: "Burner hours",
    lg_temp: "Outdoor temp. {lo}–{hi} °C",
    hint_days:
      "The colder, the longer the burner runs. Hours per heating degree day take the weather out. The integration counts whole hours only.",
    hours_since: "h since {m}",
    stats_since: "long-term statistics start {m}",
    hint_months_short: "running month up to today",
    no_stats: "No long-term statistics of the burner hours",
    so_far: "so far",
    prev_is: "previous year {v} h",
    min_each: "Ø {v} min per start",
    lg_prev_month: "Same month last year",
    hint_months: "Burner hours per month. The running month is lighter.",
    note_months: "vs. last year",
    takt_warn: "short cycling",
    takt_mid: "cycles a bit",
    takt_good: "runs smoothly",
    takt_pill: "{s} · Ø {v} min",
    starts_today: "{n} starts today",
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
