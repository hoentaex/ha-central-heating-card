// Fake `hass` for the demo page and the tests: the real entities of both houses (15 Nov 2026) as the entity
// registry and the state machine show them. Wolf SmartSet (`wolflink`), German entity ids, English
// names. Viessmann ViCare (`vicare`), German names, number entities for the heating curve.

import { dayStart, parts, zoned } from "../src/tz.js";

// Values set from the card (number.set_value) and the per-user frontend data, kept for the page's lifetime.
export const SETS = {};
const USER_DATA = {};
let onSet = null;
/** The demo page re-renders when the card sets a value. */
export const setOnChange = (fn) => {
  onSet = fn;
};

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
      state: unavailable ? "unavailable" : (over[id] ?? SETS[id] ?? state),
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
    callWS: makeCallWS(house, () => now),
    callService: async (domain, service, data) => {
      if (domain !== "number" || service !== "set_value") throw new Error(`${domain}.${service} not in the demo`);
      SETS[data.entity_id] = String(data.value);
      setTimeout(() => onSet?.(), 0);
    },
  };
}

// ---------- recorder: history and long-term statistics (real numbers, 16.10.–15.11.2026) ----------

const TZ = "Europe/Berlin";

/** Per house: the last 7 finished days (starts, flame hours), today's pace, 31 days of statistics, 13 months. */
export const RECORDER = {
  wolf: {
    burner: "sensor.flamme",
    on: "ein",
    off: "aus",
    counter: "sensor.brennerstarts",
    counterEnd: 334624,
    hours: {
      "sensor.vorlauftemperatur": [
        47.5, 47.8, 47.8, 46.1, 43.0, 34.4, 37.5, 38.2, 37.5, 38.3, 39.0, 38.9, 43.8, 47.0, 48.1, 48.5, 48.5, 46.4,
        47.7, 47.7, 47.7, 47.2, 46.1, 47.4, 47.8, 48.0, 47.1, 46.8, 37.0, 38.0, 39.0, 40.5, 38.4, 40.3, 39.9, 41.3,
        47.9, 47.2, 48.0, 48.1, 48.2, 48.0, 43.5, 35.1, 43.8, 46.7, 47.5,
      ],
      "sensor.aussentemperatur": [
        1, 0.4, 0, 0, 0.6, 1, 0.4, 0, -0.4, -1, -1, 0.2, 1.5, 5.5, 10.2, 9.0, 8.5, 8.2, 5.6, 3.3, 1.6, 1, 0.8, 0, 0,
        -0.2, -1, -1.2, -2, -2.8, -3, -3, -3, -2.1, -0.9, 0.7, 2.9, 4.8, 5, 5.3, 6.6, 7, 6.2, 5.5, 6, 6.8, 6.4,
      ],
      "sensor.speichertemperatur": [
        55.4, 52.8, 50.9, 55.2, 56.6, 55.5, 53.9, 52.1, 50.6, 56.7, 54.5, 53.2, 56.6, 55.5, 53.8, 51.7, 50.3, 55.9,
        56.1, 54.7, 52.8, 51.6, 56.4, 55.3, 52.9, 51.0, 52.2, 57, 56.0, 54.8, 53.1, 51.6, 52.0, 56.6, 54.6, 51.7, 50.6,
        57, 56.5, 55.9, 54.5, 53.2, 52.0, 50.6, 52.7, 56.0, 53.1,
      ],
    },
    pumps: { "sensor.ladepumpe": [6, 10.3] },
    outages: true,
    maintenance: { "sensor.brennerbetriebsstunden": 19123, "sensor.brennerstarts": 301240 },
    takt: { starts: [85, 96, 110, 88, 81, 85, 73], hours: [5.23, 6.53, 6.69, 8.58, 4.57, 5.9, 5.1], today: [81, 5.17] },
    days: {
      "sensor.brennerbetriebsstunden": [
        1, 2, 1, 2, 4, 4, 4, 6, 3, 3, 3, 1, 2, 4, 4, 0, 7, 4, 4, 2, 4, 3, 3, 8, 7, 7, 8, 5, 6, 5, 5,
      ],
      "sensor.brennerbetriebsstunden_2_brennerstufe": [
        0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0, 1, 2, 1, 2, 1, 1, 2, 1, 2,
      ],
      "sensor.oilfox_of0000000000_usagecounterquantity": [
        3, 2, 1, 2, 5, 7, 4, 8, 3, 4, 2, 3, 2, 4, 5, 5, 4, 4, 6, 3, 6, 2, 5, 8, 6, 9, 12, 3, 10, 0, 18,
      ],
      "sensor.aussentemperatur": [
        12.8, 11.5, 11.2, 10.5, 9.0, 9.4, 10.3, 9.3, 9.0, 8.9, 7.6, 11.8, 9.7, 4.6, 7.4, 2.3, 8.3, 7.1, 7.2, 7.5, 6.0,
        4.1, 4.7, 8.5, 6.6, 5.6, 7.8, 9.4, 3.4, 2.3, 2.1,
      ],
    },
    months: {
      "sensor.brennerbetriebsstunden": [null, null, null, null, null, null, null, null, 4, 6, 13, 59, 78],
      "sensor.aussentemperatur": [null, null, null, null, null, null, null, null, 22.8, 20.8, 16.2, 10.1, 6.0],
    },
  },
  viessmann: {
    burner: "binary_sensor.vicare_burner_active",
    on: "on",
    off: "off",
    counter: "sensor.vicare_burner_starts",
    counterEnd: 80031,
    hours: {
      "sensor.vicare_supply_temperature": [
        58.0, 49.6, 48.0, 47.4, 47.5, 47.7, 45.7, 49.3, 61.5, 54.8, 56.5, 54.6, 58.5, 58.7, 57.6, 55, 55.5, 55.2, 56.4,
        58.6, 59.2, 59.6, 59.5, 60.3, 51.2, 49.5, 49.5, 49.9, 47.6, 50.9, 50.2, 50.8, 61.7, 56.5, 57.7, 56.7, 55.0,
        56.9, 54.8, 54.3, 54.2, 54.8, 56.4, 55.2, 54.4, 53.5, 56.7,
      ],
      "sensor.vicare_outside_temperature": [
        1.8, 1.1, 0.7, 0.3, 0.1, -0.2, -0.6, -0.9, -1.2, -1.2, -0.9, 0.0, 1.4, 3.3, 5.2, 7.3, 8, 7.6, 5.3, 2.9, 1.6,
        0.7, 0.1, -0.2, -0.6, -0.9, -1.1, -1.5, -1.7, -2.1, -2.1, -2.0, -1.5, -1.1, -0.3, 0.8, 3.0, 5.8, 6.8, 7.8, 8.5,
        8.7, 8.5, 6.7, 5.7, 6.1, 5.7,
      ],
      "sensor.vplusho1_40_ww_speichertemperatur": [
        67.7, 68.6, 68.6, 68.6, 68.6, 67.8, 67.6, 67.6, 66.7, 66.4, 65.6, 64.1, 62.1, 65.1, 66.4, 66.4, 66.4, 66.4,
        66.1, 65.9, 67.2, 68.2, 69.2, 69.6, 69.6, 69.6, 69.6, 69.6, 69.6, 69.3, 68.6, 68.6, 68.0, 67.6, 66.7, 65.7,
        63.2, 61.2, 61.6, 61.6, 61.6, 61.6, 62.1, 62.6, 62.6, 62.6, 62.6,
      ],
    },
    pumps: {
      "binary_sensor.vicare_dhw_charging_active": [1, 14],
      "binary_sensor.vicare_dhw_circulation_pump_active": [115, 5],
      "binary_sensor.vicare_solar_pump_active": [1, 132],
    },
    maintenance: { "sensor.vicare_burner_hours": 16033, "sensor.vicare_burner_starts": 76012 },
    takt: { starts: [36, 41, 40, 45, 44, 39, 32], hours: [6, 8, 8, 8, 7, 6, 6], today: [42, 8.34] },
    days: {
      "sensor.vicare_burner_hours": [
        2, 4, 5, 3, 4, 5, 3, 7, 3, 7, 5, 3, 5, 6, 5, 7, 5, 7, 7, 5, 5, 4, 7, 6, 8, 8, 8, 7, 6, 6, 8,
      ],
      "sensor.vicare_burner_starts": [
        7, 20, 34, 17, 21, 37, 22, 42, 20, 52, 31, 17, 33, 34, 28, 45, 30, 43, 42, 29, 23, 26, 40, 36, 41, 40, 45, 44,
        39, 32, 39,
      ],
      "sensor.vicare_burner_modulation": [
        3.9, 8.1, 9.6, 5.8, 6.0, 9.8, 6.7, 12.4, 7.4, 14.3, 10.4, 5.6, 9.3, 10.8, 9.9, 13.3, 9.7, 13.9, 14.1, 9.9, 8.1,
        8.9, 13.7, 11.7, 14.9, 14.1, 15.3, 13.1, 12.9, 11.1, 17.1,
      ],
      "sensor.vicare_solar_energy_production_today": [
        24.2, 0, 0, 32.8, 17.8, 0, 16.0, 0.5, 7.2, 0, 13.2, 31.7, 1.4, 5.2, 19.5, 0, 14.2, 0, 0, 20.4, 31.6, 29.3, 0,
        11.1, 0, 0.2, 0, 0, 11.4, 28.1, 3.4,
      ],
      "sensor.vicare_outside_temperature": [
        11.8, 11.8, 11.0, 10.5, 8.8, 9.7, 9.4, 8.6, 9.5, 8.6, 8.6, 10.4, 9.1, 6.6, 7.7, 8.2, 7.9, 6.8, 7.1, 7.0, 5.5,
        3.1, 5.9, 7.5, 6.4, 6.1, 8.4, 10.0, 3.9, 1.6, 2.9,
      ],
    },
    months: {
      "sensor.vicare_burner_hours": [228, 279, 365, 323, 160, 104, 53, 19, 13, 16, 29, 91, 97],
      "sensor.vicare_burner_starts": [1118, 1118, 1128, 1155, 914, 490, 167, 67, 44, 54, 168, 550, 549],
      "sensor.vicare_solar_energy_production_today": [
        184, 179, 188, 109, 740, 1000, 1243, 1339, 1533, 1335, 957, 471, 150,
      ],
      "sensor.vicare_outside_temperature": [5.4, 3.6, 0.6, 5.3, 7.2, 11.4, 17.3, 22.8, 23.0, 22.4, 16.6, 11.2, 6.0],
    },
  },
};

/** Burner and counter history: evenly spread runs per day (deterministic jitter), oldest first. */
export function simulateHistory(house, now = new Date()) {
  const r = RECORDER[house];
  const days = [...r.takt.starts.map((n, i) => [n, r.takt.hours[i]])];
  const t0 = dayStart(now, TZ, 0).getTime();
  const frac = (now.getTime() - t0) / 864e5;
  days.push([Math.round(r.takt.today[0] * frac), r.takt.today[1] * frac]);
  const burner = [];
  const starts = [];
  let total = r.counterEnd - days.reduce((s, [n]) => s + n, 0);
  const begin = dayStart(now, TZ, -(days.length - 1)).getTime();
  burner.push({ s: r.off, lu: (begin - 3600e3) / 1000 });
  starts.push({ s: String(total), lu: (begin - 3600e3) / 1000 });
  days.forEach(([n, h], d) => {
    const start = begin + d * 864e5;
    const len = d === days.length - 1 ? now.getTime() - start : 864e5;
    const run = n ? (h * 3600e3) / n : 0;
    for (let k = 0; k < n; k++) {
      const jitter = Math.sin((d + 1) * (k + 3) * 12.9898) * 0.3;
      const at = start + ((k + 0.5 + jitter) / n) * len - run / 2;
      total += 1;
      burner.push({ s: r.on, lu: at / 1000 }, { s: r.off, lu: (at + run) / 1000 });
      if (r.outages && k % 12 === 5)
        burner.push({ s: "unavailable", lu: (at + run + 20e3) / 1000 }, { s: r.off, lu: (at + run + 3 * 60e3) / 1000 });
      starts.push({ s: String(total), lu: (at + 5e3) / 1000 });
    }
  });
  const out = { [r.burner]: burner, [r.counter]: starts };
  for (const [id, [perDay, minutes]] of Object.entries(r.pumps || {})) {
    const pts = [{ s: r.off, lu: (begin - 3600e3) / 1000 }];
    for (let d = 0; d < days.length; d++) {
      const start = begin + d * 864e5;
      const end = Math.min(start + 864e5, now.getTime());
      for (let k = 0; k < perDay; k++) {
        const at = start + ((k + 0.3) / perDay) * 864e5;
        if (at + minutes * 60e3 > end) break;
        pts.push({ s: r.on, lu: at / 1000 }, { s: r.off, lu: (at + minutes * 60e3) / 1000 });
      }
    }
    out[id] = pts;
  }
  return out;
}

/** Statistics rows for the requested ids and period, aligned so that the last value is today / this month. */
export function simulateStats(house, ids, period, now = new Date()) {
  const r = RECORDER[house];
  const src = period === "month" ? r.months : period === "hour" ? r.hours : r.days;
  const p = parts(now.getTime(), TZ);
  const out = {};
  for (const id of ids) {
    const vals = src[id];
    if (!vals) continue;
    const n = vals.length;
    out[id] = vals
      .map((v, i) => {
        const back = n - 1 - i;
        const start =
          period === "month"
            ? zoned(p.y, p.m - back, 1, 0, TZ)
            : period === "hour"
              ? new Date((Math.floor(now.getTime() / 3600e3) - 1 - back) * 3600e3)
              : dayStart(now, TZ, -back);
        if (v === null) return null;
        return period === "hour" || id.includes("temp") || id.includes("modulation")
          ? { start: start.getTime(), mean: v }
          : { start: start.getTime(), change: v };
      })
      .filter(Boolean);
  }
  return out;
}

/** callWS for the demo: history and statistics of one house. */
export const makeCallWS =
  (house, now = () => new Date()) =>
  async (msg) => {
    if (msg.type === "frontend/get_user_data") return { value: USER_DATA[msg.key] ?? null };
    if (msg.type === "frontend/set_user_data") {
      USER_DATA[msg.key] = msg.value;
      return null;
    }
    if (msg.type === "history/history_during_period") {
      const all = simulateHistory(house, now());
      return Object.fromEntries(msg.entity_ids.filter((id) => all[id]).map((id) => [id, all[id]]));
    }
    if (msg.type === "recorder/statistics_during_period" && msg.types?.includes("state")) {
      const m = RECORDER[house].maintenance || {};
      return Object.fromEntries(
        msg.statistic_ids
          .filter((id) => id in m)
          .map((id) => [id, [{ start: Date.parse(msg.start_time), state: m[id] }]]),
      );
    }
    if (msg.type === "recorder/statistics_during_period")
      return simulateStats(house, msg.statistic_ids, msg.period, now());
    throw new Error(`unknown ${msg.type}`);
  };
