// Role detection against the real entity lists of both houses (demo/mock.js).
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "../demo/mock.js";
import { detect, resolveEntities } from "../src/detect.js";

test("Wolf: German entity ids with English names map to the right roles", () => {
  const found = detect(makeHass({ house: "wolf" }));
  assert.equal(found.platform, "wolflink");
  assert.equal(found.brand, "Wolf");
  assert.deepEqual(
    {
      burner: found.entities.burner,
      burner_hours: found.entities.burner_hours,
      burner_hours_2: found.entities.burner_hours_2,
      burner_starts: found.entities.burner_starts,
      boiler_temp: found.entities.boiler_temp,
      boiler_target: found.entities.boiler_target,
      flow_temp: found.entities.flow_temp,
      dhw_temp: found.entities.dhw_temp,
      dhw_target: found.entities.dhw_target,
      outdoor: found.entities.outdoor,
      mode: found.entities.mode,
      pump_boiler: found.entities.pump_boiler,
      pump_mixer: found.entities.pump_mixer,
      pump_dhw_charge: found.entities.pump_dhw_charge,
    },
    {
      burner: "sensor.flamme",
      burner_hours: "sensor.brennerbetriebsstunden",
      burner_hours_2: "sensor.brennerbetriebsstunden_2_brennerstufe",
      burner_starts: "sensor.brennerstarts",
      boiler_temp: "sensor.kesseltemperatur",
      boiler_target: "sensor.kesselsolltemperatur",
      flow_temp: "sensor.vorlauftemperatur",
      dhw_temp: "sensor.speichertemperatur",
      dhw_target: "sensor.speichersolltemperatur",
      outdoor: "sensor.aussentemperatur",
      mode: "sensor.betriebsart",
      pump_boiler: "sensor.kesselkreispumpe",
      pump_mixer: "sensor.mischerkreispumpe",
      pump_dhw_charge: "sensor.ladepumpe",
    },
  );
  assert.match(found.entities.room_temp, /room_temperature|raumtemperatur/);
  assert.equal(found.entities.modulation, undefined);
  assert.equal(found.entities.curve_slope, undefined);
});

test("Viessmann: binary sensors, numbers for the curve, solar", () => {
  const found = detect(makeHass({ house: "viessmann" }));
  assert.equal(found.platform, "vicare");
  assert.deepEqual(
    {
      burner: found.entities.burner,
      modulation: found.entities.modulation,
      boiler_temp: found.entities.boiler_temp,
      boiler_supply: found.entities.boiler_supply,
      flow_temp: found.entities.flow_temp,
      dhw_temp: found.entities.dhw_temp,
      dhw_target: found.entities.dhw_target,
      outdoor: found.entities.outdoor,
      mode: found.entities.mode,
      pump_heating: found.entities.pump_heating,
      pump_dhw_charge: found.entities.pump_dhw_charge,
      pump_dhw_circ: found.entities.pump_dhw_circ,
      pump_solar: found.entities.pump_solar,
      curve_slope: found.entities.curve_slope,
      curve_shift: found.entities.curve_shift,
      normal_temp: found.entities.normal_temp,
      reduced_temp: found.entities.reduced_temp,
      comfort_temp: found.entities.comfort_temp,
      solar_collector: found.entities.solar_collector,
      solar_storage: found.entities.solar_storage,
      solar_today: found.entities.solar_today,
    },
    {
      burner: "binary_sensor.vicare_burner_active",
      modulation: "sensor.vicare_burner_modulation",
      boiler_temp: "sensor.vicare_boiler_temperature",
      boiler_supply: "sensor.vicare_boiler_supply_temperature",
      flow_temp: "sensor.vicare_supply_temperature",
      dhw_temp: "sensor.vplusho1_40_ww_speichertemperatur",
      dhw_target: "number.vplusho1_40_warmwassertemperatur",
      outdoor: "sensor.vicare_outside_temperature",
      mode: "climate.vicare_heating",
      pump_heating: "binary_sensor.vicare_circulation_pump_active",
      pump_dhw_charge: "binary_sensor.vicare_dhw_charging_active",
      pump_dhw_circ: "binary_sensor.vicare_dhw_circulation_pump_active",
      pump_solar: "binary_sensor.vicare_solar_pump_active",
      curve_slope: "number.vplusho1_40_steigung_der_heizkurve",
      curve_shift: "number.vplusho1_40_verschiebung_der_heizkurve",
      normal_temp: "number.vplusho1_40_normaltemperatur",
      reduced_temp: "number.vplusho1_40_reduzierte_temperatur",
      comfort_temp: "number.vplusho1_40_komforttemperatur",
      solar_collector: "sensor.vicare_solar_collector_temperature",
      solar_storage: "sensor.vicare_solar_storage_temperature",
      solar_today: "sensor.vicare_solar_energy_production_today",
    },
  );
  assert.equal(found.entities.room_temp, undefined);
});

test("preset limits the platform; config overrides win; empty overrides drop a role", () => {
  const hass = makeHass({ house: "wolf" });
  assert.equal(detect(hass, "vicare"), null);
  const r = resolveEntities(hass, {
    preset: "wolflink",
    outdoor_entity: "sensor.wetter_aussen",
    entities: { room_temp: "", boiler_temp: "sensor.my_boiler" },
  });
  assert.equal(r.brand, "Wolf");
  assert.equal(r.entities.outdoor, "sensor.wetter_aussen");
  assert.equal(r.entities.boiler_temp, "sensor.my_boiler");
  assert.equal(r.entities.room_temp, undefined);
});

test("no registry (or nothing found): no entities, configured ones still used", () => {
  assert.equal(detect({ states: {} }), null);
  const r = resolveEntities({ states: {} }, { entities: { burner: "binary_sensor.x" } });
  assert.deepEqual(r.entities, { burner: "binary_sensor.x" });
});
