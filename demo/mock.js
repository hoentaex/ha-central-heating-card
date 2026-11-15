// Fake `hass` for the demo page and the tests: the real entities of both houses (15 Nov 2026) as the entity
// registry and the state machine show them. Wolf SmartSet (`wolflink`), German entity ids, English
// names. Viessmann ViCare (`vicare`), German names, number entities for the heating curve.

const W = "dev_wolf";
const V = "dev_vicare";

// [entity_id, friendly name, state, unit, extra attributes, translation_key]
export const WOLF = [
  ["sensor.aussentemperatur", "Wolf Outside temperature", "7", "°C"],
  ["sensor.betriebsart", "Wolf Operating mode", "heizbetrieb"],
  ["sensor.brennerbetriebsstunden", "Wolf Burner hours run", "19535", "h"],
  ["sensor.brennerbetriebsstunden_2_brennerstufe", "Wolf Burner hours run, burner stage 2", "3773", "h"],
  ["sensor.brennerstarts", "Wolf Burner starts", "334624"],
  ["sensor.circuit_with_mixer_1_day_temperature", "Wolf Day temperature", "22", "°C"],
  ["sensor.circuit_with_mixer_1_economy_temperature", "Wolf Economy temperature", "20", "°C"],
  ["sensor.circuit_with_mixer_1_room_temperature", "Wolf Room temperature", "31.9", "°C"],
  ["sensor.circuit_with_mixer_1_set_room_temperature", "Wolf Set room temperature", "22.5", "°C"],
  ["sensor.eingestellte_warmwassersolltemperatur", "Wolf Adjusted DHW set temperature", "55", "°C"],
  ["sensor.flamme", "Wolf Flame", "aus"],
  ["sensor.kesselkreispumpe", "Wolf Boiler circuit pump", "ein"],
  ["sensor.kesselsolltemperatur", "Wolf Set boiler temperature", "51", "°C"],
  ["sensor.kesseltemperatur", "Wolf Boiler water temperature", "49", "°C"],
  ["sensor.ladepumpe", "Wolf Charging pump", "aus"],
  ["sensor.mischerkreispumpe", "Wolf Mixer circuit pump", "ein"],
  ["sensor.mischermotor_mm", "Wolf Mixer motor MM", "0"],
  ["sensor.mkp_mischerkreispumpe", "Wolf MKP Mixer circuit pump", "1"],
  ["sensor.netzbetriebstunden", "Wolf Hours with mains power on", "160222", "h"],
  ["sensor.raumsolltemperatur", "Wolf Set room temperature", "22.5", "°C"],
  ["sensor.raumtemperatur", "Wolf Room temperature", "31.9", "°C"],
  ["sensor.sollwertkorrektur", "Wolf Set value correction", "0.5"],
  ["sensor.spartemperatur", "Wolf Economy temperature", "18", "°C"],
  ["sensor.speichersolltemperatur", "Wolf Set cylinder temperature", "55", "°C"],
  ["sensor.speichertemperatur", "Wolf Cylinder temperature", "52", "°C"],
  ["sensor.tagtemperatur", "Wolf Day temperature", "22", "°C"],
  ["sensor.vf_vorlauffuhler_mischerkreis", "Wolf VF Mixer circuit flow sensor", "47.6"],
  ["sensor.vorlauftemperatur", "Wolf Flow temperature", "47.6", "°C"],
  ["sensor.zeitprogramm_direkter_heizkreis", "Wolf Direct heating circuit time program", "1"],
  ["sensor.zeitprogramm_mischerkreis", "Wolf Mixer circuit time program", "1"],
  ["sensor.zeitprogramm_warmwasser", "Wolf DHW time program", "1"],
];

export const VIESSMANN = [
  ["binary_sensor.vicare_burner_active", "VPlusHO1 45 Brenner", "off", null, {}, "burner"],
  [
    "binary_sensor.vicare_circulation_pump_active",
    "VPlusHO1 45 Heizkreisumwälzpumpe",
    "on",
    null,
    {},
    "circulation_pump",
  ],
  [
    "binary_sensor.vicare_dhw_charging_active",
    "VPlusHO1 45 WW-Aufladung",
    "off",
    null,
    {},
    "domestic_hot_water_charging",
  ],
  [
    "binary_sensor.vicare_dhw_circulation_pump_active",
    "VPlusHO1 45 WW-Zirkulationspumpe",
    "off",
    null,
    {},
    "domestic_hot_water_circulation_pump",
  ],
  ["binary_sensor.vicare_dhw_pump_active", "VPlusHO1 45 WW-Pumpe", "off", null, {}, "domestic_hot_water_pump"],
  ["binary_sensor.vicare_frost_protection_active", "VPlusHO1 45 Frostschutz", "off", null, {}, "frost_protection"],
  ["binary_sensor.vicare_solar_pump_active", "VPlusHO1 45 Solarpumpe", "off", null, {}, "solar_pump"],
  ["climate.vicare_heating", "VPlusHO1 45 Heizung", "auto", null, { active_vicare_program: "normal" }, "heating"],
  ["number.vplusho1_40_komforttemperatur", "VPlusHO1 45 Komforttemperatur", "20", "°C", {}, "comfort_temperature"],
  ["number.vplusho1_40_normaltemperatur", "VPlusHO1 45 Normaltemperatur", "23", "°C", {}, "normal_temperature"],
  [
    "number.vplusho1_40_reduzierte_temperatur",
    "VPlusHO1 45 Reduzierte Temperatur",
    "18",
    "°C",
    {},
    "reduced_temperature",
  ],
  [
    "number.vplusho1_40_steigung_der_heizkurve",
    "VPlusHO1 45 Steigung der Heizkurve",
    "1.2",
    null,
    {},
    "heating_curve_slope",
  ],
  [
    "number.vplusho1_40_verschiebung_der_heizkurve",
    "VPlusHO1 45 Verschiebung der Heizkurve",
    "10",
    "°C",
    {},
    "heating_curve_shift",
  ],
  ["number.vplusho1_40_warmwassertemperatur", "VPlusHO1 45 WW-Temperatur", "58", "°C", {}, "dhw_temperature"],
  [
    "sensor.vicare_boiler_supply_temperature",
    "VPlusHO1 45 Kesselvorlauftemperatur",
    "48",
    "°C",
    {},
    "boiler_supply_temperature",
  ],
  ["sensor.vicare_boiler_temperature", "VPlusHO1 45 Kesseltemperatur", "56.3", "°C", {}, "boiler_temperature"],
  ["sensor.vicare_burner_hours", "VPlusHO1 45 Brennerbetriebsstunden", "16721", "h", {}, "burner_hours"],
  ["sensor.vicare_burner_modulation", "VPlusHO1 45 Brennermodulation", "0", "%", {}, "burner_modulation"],
  ["sensor.vicare_burner_starts", "VPlusHO1 45 Brennerstarts", "80031", null, {}, "burner_starts"],
  [
    "sensor.vicare_hot_water_max_temperature",
    "VPlusHO1 45 WW-Höchsttemperatur",
    "60",
    "°C",
    {},
    "hotwater_max_temperature",
  ],
  [
    "sensor.vicare_hot_water_min_temperature",
    "VPlusHO1 45 WW-Mindesttemperatur",
    "10",
    "°C",
    {},
    "hotwater_min_temperature",
  ],
  ["sensor.vicare_outside_temperature", "VPlusHO1 45 Außentemperatur", "5.6", "°C", {}, "outside_temperature"],
  [
    "sensor.vicare_solar_collector_temperature",
    "VPlusHO1 45 Solarkollektor-Temperatur",
    "5.7",
    "°C",
    {},
    "solar_collector_temperature",
  ],
  [
    "sensor.vicare_solar_energy_production_today",
    "VPlusHO1 45 Solarenergie-Erzeugung heute",
    "3.382",
    "kWh",
    {},
    "solar_power_production_today",
  ],
  [
    "sensor.vicare_solar_storage_temperature",
    "VPlusHO1 45 Solarspeicher-Temperatur",
    "40.2",
    "°C",
    {},
    "solar_storage_temperature",
  ],
  ["sensor.vicare_supply_temperature", "VPlusHO1 45 Vorlauftemperatur", "49", "°C", {}, "supply_temperature"],
  [
    "sensor.vplusho1_40_ww_speichertemperatur",
    "VPlusHO1 45 WW-Speichertemperatur",
    "62.6",
    "°C",
    {},
    "dhw_storage_temperature",
  ],
  ["water_heater.vicare_water", "VPlusHO1 45 Warmwasser", "off", null, {}, "domestic_hot_water"],
];

// What changes while the burner runs (and hot water is charged in Wolf).
const RUNNING = {
  wolf: { "sensor.flamme": "ein", "sensor.kesseltemperatur": "58" },
  viessmann: {
    "binary_sensor.vicare_burner_active": "on",
    "sensor.vicare_burner_modulation": "48",
    "sensor.vicare_boiler_temperature": "61.4",
  },
};
const DHW = {
  wolf: { "sensor.ladepumpe": "ein" },
  viessmann: { "binary_sensor.vicare_dhw_charging_active": "on" },
};

export const HOUSES = {
  wolf: { rows: WOLF, platform: "wolflink", device: W },
  viessmann: { rows: VIESSMANN, platform: "vicare", device: V },
};

/**
 * hass for one house. `burner`: burner on, `dhw`: hot water charging, `unavailable`: cloud gone,
 * `minutesAgo`: when the burner state last changed.
 */
export function makeHass({
  house = "wolf",
  lang = "de",
  burner = false,
  dhw = false,
  unavailable = false,
  now = new Date(),
  minutesAgo = 7,
} = {}) {
  const { rows, platform, device } = HOUSES[house];
  const over = { ...(burner ? RUNNING[house] : {}), ...(dhw ? DHW[house] : {}) };
  const changed = new Date(now.getTime() - minutesAgo * 60e3).toISOString();
  const updated = new Date(now.getTime() - 40e3).toISOString();
  const states = {};
  const entities = {};
  for (const [id, name, state, unit, attrs = {}, key] of rows) {
    states[id] = {
      entity_id: id,
      state: unavailable ? "unavailable" : (over[id] ?? state),
      attributes: { friendly_name: name, ...(unit ? { unit_of_measurement: unit } : {}), ...attrs },
      last_changed: changed,
      last_updated: updated,
    };
    entities[id] = { entity_id: id, platform, device_id: device, translation_key: key, name: null };
  }
  return {
    states,
    entities,
    language: lang,
    locale: { language: lang },
    config: { time_zone: "Europe/Berlin" },
  };
}
