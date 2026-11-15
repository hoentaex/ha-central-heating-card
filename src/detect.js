// Finds the entities of a heating integration (Wolf SmartSet `wolflink`, Viessmann `vicare`) by role.
//
// Entity ids are not fixed: Wolf names them after the German parameter (sensor.flamme, sensor.ladepumpe), ViCare
// after the device and the translation (sensor.vicare_boiler_temperature, sensor.vplusho1_40_ww_speichertemperatur).
// So every role is a pattern matched against the entity id, the translation key and the names (German or English).
// Each entity gets at most one role; roles are tried in the order below, the more specific ones first.

export const PLATFORMS = {
  wolflink: { brand: "Wolf" },
  vicare: { brand: "Viessmann" },
};

const role = (domains, inc, exc = null) => ({ domains, inc, exc });
const NOT_TARGET = /soll|\bset\b|target|max|min|höchst|mindest/;

/** Role → which domains (in order of preference) and which pattern (and anti-pattern) identifies it. */
export const ROLES = {
  burner: role(
    ["binary_sensor", "sensor"],
    /burner_active|flamme|\bflame\b|\bburner\b|brenner/,
    /hour|stunde|start|modul|stufe|stage/,
  ),
  modulation: role(["sensor"], /modulation/),
  burner_hours_2: role(["sensor"], /(brennerbetriebsstunden|burner.?hours).*(stufe|stage)|(stufe|stage).?2/),
  burner_hours: role(["sensor"], /brennerbetriebsstunden|burner.?hours/, /stufe|stage/),
  burner_starts: role(["sensor"], /brennerstarts|burner.?starts/),
  boiler_supply: role(["sensor"], /boiler.?supply|kesselvorlauf/),
  boiler_target: role(["sensor"], /kesselsoll|set boiler|boiler.*(target|set)/),
  boiler_temp: role(
    ["sensor"],
    /kesseltemp|boiler.?temperature|boiler water temperature/,
    /soll|\bset\b|target|supply|vorlauf/,
  ),
  flow_temp: role(
    ["sensor"],
    /vorlauftemperatur|supply.?temperature|flow temperature/,
    /boiler|kessel|vf_|fühler|fuhler/,
  ),
  dhw_target: role(
    ["number", "sensor"],
    /speichersoll|set cylinder|warmwassersoll|warmwassertemperatur|dhw.?temperature|ww-temperatur|dhw.*target/,
    /max|min|höchst|mindest|eingestellte/,
  ),
  dhw_temp: role(
    ["sensor"],
    /speichertemp|cylinder temperature|dhw.?storage|hot.?water.?storage|ww.?speicher/,
    /soll|\bset\b|solar/,
  ),
  outdoor: role(["sensor"], /au(ss|ß)entemp|outside.?temp|outdoor/),
  room_target: role(["sensor"], /raumsoll|set room/),
  room_temp: role(["sensor"], /raumtemperatur|room.?temperature/, NOT_TARGET),
  mode: role(["climate", "sensor"], /^climate\.|betriebsart|operating mode/),
  pump_boiler: role(["sensor", "binary_sensor"], /kesselkreispumpe|boiler circuit pump/),
  pump_mixer: role(["sensor", "binary_sensor"], /mischerkreispumpe|mixer circuit pump/, /\bmkp|mkp_/),
  pump_heating: role(
    ["binary_sensor", "sensor"],
    /circulation.?pump|heizkreis.*pumpe|heating circuit pump/,
    /dhw|\bww\b|ww-|warmwasser/,
  ),
  pump_dhw_charge: role(["binary_sensor", "sensor"], /ladepumpe|charging pump|dhw.?charging|ww-aufladung/),
  pump_dhw_circ: role(["binary_sensor"], /dhw.?circulation|zirkulation/),
  pump_solar: role(["binary_sensor"], /solar.?pump|solarpumpe/),
  curve_slope: role(["number"], /steigung|curve.?slope|slope/),
  curve_shift: role(["number"], /verschiebung|curve.?shift|shift/),
  normal_temp: role(["number"], /normaltemperatur|normal.?temperature/),
  reduced_temp: role(["number"], /reduzierte|reduced.?temperature/),
  comfort_temp: role(["number"], /komfort|comfort.?temperature/),
  solar_collector: role(["sensor"], /kollektor|collector/),
  solar_storage: role(["sensor"], /solarspeicher|solar.?storage/),
  solar_today: role(["sensor"], /solar.*(today|heute)|solarenergie/),
};

/** The pump roles in display order. */
export const PUMPS = ["pump_boiler", "pump_heating", "pump_mixer", "pump_dhw_charge", "pump_dhw_circ", "pump_solar"];

const haystack = (hass, e) => {
  const s = hass.states?.[e.entity_id];
  return [e.entity_id, e.translation_key, e.name, e.original_name, s?.attributes?.friendly_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

/** Entities of one platform (from the entity registry hass.entities), grouped by device. */
function byDevice(hass, platform) {
  const groups = new Map();
  for (const e of Object.values(hass?.entities || {})) {
    if (e.platform !== platform || e.hidden) continue;
    const key = e.device_id || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.values()];
}

/** Role → entity_id for one list of registry entries. */
export function assignRoles(hass, entries) {
  const found = {};
  const used = new Set();
  const items = entries
    .map((e) => ({ id: e.entity_id, domain: e.entity_id.split(".")[0], text: haystack(hass, e) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const [name, r] of Object.entries(ROLES)) {
    let best = null;
    for (const it of items) {
      if (used.has(it.id) || !r.domains.includes(it.domain)) continue;
      if (!r.inc.test(it.text) || r.exc?.test(it.text)) continue;
      if (!best || r.domains.indexOf(it.domain) < r.domains.indexOf(best.domain)) best = it;
    }
    if (best) {
      found[name] = best.id;
      used.add(best.id);
    }
  }
  return found;
}

/**
 * Detects the heating: `preset` "wolflink" / "vicare", or "auto" (the platform and device with the most roles).
 * Returns { platform, brand, entities } or null when nothing is found.
 */
export function detect(hass, preset = "auto") {
  const platforms = preset && preset !== "auto" ? [preset] : Object.keys(PLATFORMS);
  let best = null;
  for (const platform of platforms) {
    for (const entries of byDevice(hass, platform)) {
      const entities = assignRoles(hass, entries);
      const n = Object.keys(entities).length;
      if (n && (!best || n > best.n)) best = { platform, brand: PLATFORMS[platform]?.brand || platform, entities, n };
    }
  }
  if (!best) return null;
  const { n, ...rest } = best;
  return rest;
}

/** Detected entities overlaid with the configured ones (`entities:` map, `outdoor_entity`). */
export function resolveEntities(hass, config) {
  const found = detect(hass, config.preset || "auto");
  const entities = { ...(found?.entities || {}), ...(config.entities || {}) };
  if (config.outdoor_entity) entities.outdoor = config.outdoor_entity;
  if (config.fuel_entity) entities.fuel = config.fuel_entity;
  for (const [k, v] of Object.entries(entities)) if (!v) delete entities[k];
  return {
    platform: found?.platform || config.preset || "",
    brand: config.brand || found?.brand || "",
    entities,
  };
}
