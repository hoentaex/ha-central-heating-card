// Visual editor (ha-form) for both cards. The entity overrides are flat form fields (e_burner …) that map to the
// `entities:` object of the config; everything left at its default is dropped from the YAML again.
import { DEFAULTS, langOf, SECTIONS, VIEWS } from "./shared.js";

const LABELS = {
  de: {
    name: "Name",
    subtitle: "Untertitel (leer: Hersteller · Betriebsart · Stand)",
    g_heating: "Heizung",
    g_entities: "Entitäten (leer: automatisch erkannt)",
    g_rating: "Takt-Ampel und Heizgradtage",
    g_display: "Darstellung",
    preset: "Integration",
    p_auto: "Automatisch",
    p_wolflink: "Wolf SmartSet (wolflink)",
    p_vicare: "Viessmann ViCare (vicare)",
    outdoor_entity: "Außentemperatur (ersetzt den Fühler der Heizung)",
    fuel: "Brennstoff",
    f_oil: "Heizöl (L)",
    f_gas: "Gas (m³)",
    fuel_entity: "Brennstoffzähler (L bzw. m³, steigend)",
    kwh_per_unit: "Energie je L bzw. m³",
    boiler_efficiency: "Kesselnutzungsgrad",
    maintenance_date: "Letzte Wartung",
    heating_base_temp: "Heizgrenze für Heizgradtage",
    takt_warn_min: "Rot unter (min je Start)",
    takt_good_min: "Grün ab (min je Start)",
    e_burner: "Brenner (an/aus)",
    e_modulation: "Modulation",
    e_boiler_temp: "Kesseltemperatur",
    e_boiler_target: "Kessel-Soll",
    e_flow_temp: "Vorlauf",
    e_dhw_temp: "Warmwasser-Speicher",
    e_dhw_target: "Warmwasser-Soll",
    e_burner_hours: "Brennerstunden",
    e_burner_starts: "Brennerstarts",
    e_room_temp: "Raumtemperatur",
    e_pump_dhw_charge: "Speicherladepumpe",
    e_pump_dhw_circ: "Zirkulationspumpe",
    sections: "Abschnitte",
    hide: "Ausblenden",
    default_view: "Brenner-Ansicht beim Öffnen",
    language: "Sprache",
    lang_auto: "Automatisch",
    animations: "Animation (Flamme, Pumpen)",
    illustration: "Illustrierter Kopf (Heizraum)",
    illustration_theme: "Bild im Kopf",
    theme_auto: "Wie das Theme",
    theme_day: "Tag",
    theme_night: "Nacht",
    popup: "Große Karte als Popup (sonst aufklappen)",
    h_outdoor: "Für Heizgradtage und die Heizkurve. Nützlich, wenn der Fühler der Heizung in der Sonne hängt.",
    h_fuel_entity: "Optional. Ergibt Brennstoff je Brennerstunde und je Heizgradtag.",
    h_maintenance: "Optional. Stunden und Starts seit diesem Tag in der Fußzeile.",
    s_header: "Kopf",
    s_now: "Jetzt",
    s_tips: "Optimierung",
    s_burner: "Brenner",
    s_curve: "Heizkurve",
    s_dhw: "Warmwasser",
    s_solar: "Solar",
    s_efficiency: "Effizienz",
    s_footer: "Fußzeile",
    v_takt: "Takt 7 Tage",
    v_days: "30 Tage",
    v_months: "12 Monate",
    x_boiler: "Kessel",
    x_flow: "Vorlauf",
    x_dhw: "Warmwasser",
    x_outdoor: "Außen",
    x_room: "Raum",
    x_pumps: "Pumpen",
  },
  en: {
    name: "Name",
    subtitle: "Subtitle (empty: maker · mode · time)",
    g_heating: "Heating",
    g_entities: "Entities (empty: detected automatically)",
    g_rating: "Cycling rating and degree days",
    g_display: "Display",
    preset: "Integration",
    p_auto: "Automatic",
    p_wolflink: "Wolf SmartSet (wolflink)",
    p_vicare: "Viessmann ViCare (vicare)",
    outdoor_entity: "Outdoor temperature (replaces the heating's sensor)",
    fuel: "Fuel",
    f_oil: "Heating oil (L)",
    f_gas: "Gas (m³)",
    fuel_entity: "Fuel meter (L or m³, increasing)",
    kwh_per_unit: "Energy per L or m³",
    boiler_efficiency: "Boiler efficiency",
    maintenance_date: "Last service",
    heating_base_temp: "Heating limit for degree days",
    takt_warn_min: "Red below (min per start)",
    takt_good_min: "Green from (min per start)",
    e_burner: "Burner (on/off)",
    e_modulation: "Modulation",
    e_boiler_temp: "Boiler temperature",
    e_boiler_target: "Boiler target",
    e_flow_temp: "Flow",
    e_dhw_temp: "Hot-water cylinder",
    e_dhw_target: "Hot-water target",
    e_burner_hours: "Burner hours",
    e_burner_starts: "Burner starts",
    e_room_temp: "Room temperature",
    e_pump_dhw_charge: "Cylinder charging pump",
    e_pump_dhw_circ: "Circulation pump",
    sections: "Sections",
    hide: "Hide",
    default_view: "Burner view at start",
    language: "Language",
    lang_auto: "Automatic",
    animations: "Animation (flame, pumps)",
    illustration: "Illustrated header (boiler room)",
    illustration_theme: "Header picture",
    theme_auto: "Follow the theme",
    theme_day: "Day",
    theme_night: "Night",
    popup: "Main card as a popup (else expand)",
    h_outdoor: "For degree days and the heating curve. Useful when the heating's sensor gets sun.",
    h_fuel_entity: "Optional. Gives fuel per burner hour and per degree day.",
    h_maintenance: "Optional. Hours and starts since that day in the footer.",
    s_header: "Header",
    s_now: "Now",
    s_tips: "Optimisation",
    s_burner: "Burner",
    s_curve: "Heating curve",
    s_dhw: "Hot water",
    s_solar: "Solar",
    s_efficiency: "Efficiency",
    s_footer: "Footer",
    v_takt: "Cycling 7 days",
    v_days: "30 days",
    v_months: "12 months",
    x_boiler: "Boiler",
    x_flow: "Flow",
    x_dhw: "Hot water",
    x_outdoor: "Outdoor",
    x_room: "Room",
    x_pumps: "Pumps",
  },
};

/** Roles offered in the editor (all others can still be set in YAML under `entities:`). */
export const EDITOR_ROLES = [
  "burner",
  "modulation",
  "boiler_temp",
  "boiler_target",
  "flow_temp",
  "dhw_temp",
  "dhw_target",
  "burner_hours",
  "burner_starts",
  "room_temp",
  "pump_dhw_charge",
  "pump_dhw_circ",
];
const HIDE = ["boiler", "flow", "dhw", "outdoor", "room", "pumps"];

const ent = (name, domain) => ({ name, selector: { entity: domain ? { domain } : {} } });
const num = (name, min, max, step, unit) => ({
  name,
  selector: { number: { min, max, step, mode: "box", unit_of_measurement: unit } },
});
const grid = (...schema) => ({ type: "grid", name: "", schema });
const group = (title, schema, expanded = false) => ({
  type: "expandable",
  name: "",
  title,
  flatten: true,
  expanded,
  schema,
});
const select = (name, options) => ({ name, selector: { select: { mode: "dropdown", options } } });
const multi = (name, options) => ({ name, selector: { select: { multiple: true, mode: "list", options } } });

export const editorSchema = (lang, { mini = false } = {}) => {
  const L = LABELS[lang] || LABELS.en;
  return [
    grid({ name: "name", selector: { text: {} } }, { name: "subtitle", selector: { text: {} } }),
    group(
      L.g_heating,
      [
        select(
          "preset",
          ["auto", "wolflink", "vicare"].map((p) => ({ value: p, label: L[`p_${p}`] })),
        ),
        ent("outdoor_entity", ["sensor", "weather"]),
        grid(
          select("fuel", [
            { value: "oil", label: L.f_oil },
            { value: "gas", label: L.f_gas },
          ]),
          ent("fuel_entity", ["sensor", "input_number"]),
        ),
        grid(num("kwh_per_unit", 1, 20, 0.1, "kWh"), num("boiler_efficiency", 0.5, 1.1, 0.01, "")),
        { name: "maintenance_date", selector: { date: {} } },
      ],
      true,
    ),
    group(L.g_entities, [grid(...EDITOR_ROLES.map((r) => ent(`e_${r}`)))]),
    group(L.g_rating, [
      grid(num("takt_warn_min", 1, 30, 1, "min"), num("takt_good_min", 2, 60, 1, "min")),
      num("heating_base_temp", 0, 25, 0.5, "°C"),
    ]),
    group(L.g_display, [
      ...(mini
        ? []
        : [
            multi(
              "sections",
              SECTIONS.map((s) => ({ value: s, label: L[`s_${s}`] })),
            ),
          ]),
      multi(
        "hide",
        HIDE.map((h) => ({ value: h, label: L[`x_${h}`] })),
      ),
      grid(
        ...(mini
          ? []
          : [
              select(
                "default_view",
                VIEWS.map((v) => ({ value: v, label: L[`v_${v}`] })),
              ),
            ]),
        select("language", [
          { value: "", label: L.lang_auto },
          { value: "de", label: "Deutsch" },
          { value: "en", label: "English" },
        ]),
      ),
      grid(
        { name: "animations", selector: { boolean: {} } },
        ...(mini ? [{ name: "popup", selector: { boolean: {} } }] : []),
        { name: "illustration", selector: { boolean: {} } },
        select("illustration_theme", [
          { value: "", label: L.theme_auto },
          { value: "day", label: L.theme_day },
          { value: "night", label: L.theme_night },
        ]),
      ),
    ]),
  ];
};

const HELPERS = { outdoor_entity: "h_outdoor", fuel_entity: "h_fuel_entity", maintenance_date: "h_maintenance" };
export const helperFor = (lang, name) => (HELPERS[name] ? (LABELS[lang] || LABELS.en)[HELPERS[name]] : undefined);
export const labelFor = (lang, name) => (LABELS[lang] || LABELS.en)[name] ?? name;

// Defaults shown in the form (and dropped again from the YAML when left as they are).
const formDefaults = (mini) => {
  const { entities, ...rest } = DEFAULTS;
  return {
    ...rest,
    popup: mini,
    sections: SECTIONS,
    hide: [],
    language: "",
    illustration: true,
    illustration_theme: "",
  };
};

/** Card config → form data: defaults filled in, `entities:` spread to e_* fields. */
export const toFormData = (config, mini = false) => {
  const { entities = {}, ...rest } = config;
  const data = { ...formDefaults(mini), ...rest };
  for (const r of EDITOR_ROLES) data[`e_${r}`] = entities[r] || "";
  return data;
};

/**
 * Form data → minimal card config: empty values and defaults dropped, e_* fields gathered under `entities:`
 * (roles not in the editor are kept from `previous`).
 */
export const fromFormData = (data, mini = false, previous = {}) => {
  const defaults = formDefaults(mini);
  const config = {};
  const entities = { ...(previous.entities || {}) };
  for (const r of EDITOR_ROLES) delete entities[r];
  for (const [k, v] of Object.entries(data)) {
    const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
    if (k.startsWith("e_")) {
      if (!empty) entities[k.slice(2)] = v;
      continue;
    }
    if (empty) continue;
    if (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k])) continue;
    config[k] = v;
  }
  if (Array.isArray(config.sections)) config.sections = SECTIONS.filter((s) => config.sections.includes(s));
  if (Object.keys(entities).length) config.entities = entities;
  return config;
};

// HTMLElement only exists in the browser; the tests load this module in Node.
const Element = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class EditorBase extends Element {
  static get mini() {
    return false;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _lang() {
    return this._config?.language || langOf(this._hass);
  }

  _render() {
    if (!this._hass || !this._config) return;
    const mini = this.constructor.mini;
    const lang = this._lang();
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => labelFor(this._lang(), s.name);
      this._form.computeHelper = (s) => helperFor(this._lang(), s.name);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const { type } = this._config;
        const config = { type, ...fromFormData({ ...ev.detail.value, type: undefined }, mini, this._config) };
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    const data = toFormData(this._config, mini);
    const key = JSON.stringify(data);
    if (key !== this._dataKey) {
      this._dataKey = key;
      this._form.data = data;
    }
    if (lang !== this._schemaLang) {
      this._schemaLang = lang;
      this._form.schema = editorSchema(lang, { mini });
    }
  }
}

export class CentralHeatingCardEditor extends EditorBase {}
export class CentralHeatingMiniCardEditor extends EditorBase {
  static get mini() {
    return true;
  }
}
// Guarded so the module also loads outside a browser (tests).
if (typeof customElements !== "undefined") {
  if (!customElements.get("central-heating-card-editor"))
    customElements.define("central-heating-card-editor", CentralHeatingCardEditor);
  if (!customElements.get("central-heating-mini-card-editor"))
    customElements.define("central-heating-mini-card-editor", CentralHeatingMiniCardEditor);
}
