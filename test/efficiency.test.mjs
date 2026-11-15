// Efficiency figures, summer base load, availability, maintenance readings.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeCallWS, simulateHistory, simulateStats } from "../demo/mock.js";
import { availability, Cache, efficiency, fetchMaintenance, statDays, statMonths, summerLoad } from "../src/data.js";

const TZ = "Europe/Berlin";
const NOW = new Date("2026-11-15T20:30:00Z");

test("efficiency Wolf: oil per burner hour ≈ 1,16 L/h, ~0,6 L per heating degree day, stage 2 share", () => {
  const e = {
    burner_hours: "sensor.brennerbetriebsstunden",
    burner_hours_2: "sensor.brennerbetriebsstunden_2_brennerstufe",
    outdoor: "sensor.aussentemperatur",
    fuel: "sensor.oilfox_of0000000000_usagecounterquantity",
  };
  const days = statDays(simulateStats("wolf", Object.values(e), "day", NOW), e, TZ, NOW);
  const f = efficiency(days, 15);
  assert.equal(f.days, 29); // 30 windows, today left out
  assert.equal(f.hours, 116);
  assert.equal(f.fuel, 135);
  assert.equal(Math.round(f.fuelPerHour * 100) / 100, 1.16);
  assert.ok(f.fuelPerHdd > 0.55 && f.fuelPerHdd < 0.7, `per hdd ${f.fuelPerHdd}`);
  assert.ok(f.stage2 > 0.2 && f.stage2 < 0.3, `stage2 ${f.stage2}`);
  assert.equal(f.modulation, null);
  assert.equal(f.startsPerHdd, null);
});

test("efficiency Viessmann: modulation while running ≈ 45 %, starts per degree day, no fuel", () => {
  const e = {
    burner_hours: "sensor.vicare_burner_hours",
    burner_starts: "sensor.vicare_burner_starts",
    modulation: "sensor.vicare_burner_modulation",
    outdoor: "sensor.vicare_outside_temperature",
  };
  const f = efficiency(statDays(simulateStats("viessmann", Object.values(e), "day", NOW), e, TZ, NOW), 15);
  assert.ok(f.modulation > 35 && f.modulation < 55, `mod ${f.modulation}`);
  assert.ok(f.startsPerHdd > 3 && f.startsPerHdd < 5, `spk ${f.startsPerHdd}`);
  assert.equal(f.fuelPerHour, null);
});

test("summerLoad: Jun–Sep mean (Viessmann 19 h), null without two summer months", () => {
  const e = { burner_hours: "sensor.vicare_burner_hours" };
  const m = statMonths(simulateStats("viessmann", Object.values(e), "month", NOW), e, TZ, NOW);
  assert.equal(summerLoad(m), (19 + 13 + 16 + 29) / 4);
  assert.equal(summerLoad(m.slice(-2)), null);
});

test("availability: the simulated Wolf cloud gaps give ~98–99 %, ViCare 100 %, no history → null", () => {
  const a = availability(simulateHistory("wolf", NOW), "sensor.flamme", TZ, NOW);
  assert.ok(a > 0.97 && a < 0.995, `a ${a}`);
  assert.equal(availability(simulateHistory("viessmann", NOW), "binary_sensor.vicare_burner_active", TZ, NOW), 1);
  assert.equal(availability({}, "x", TZ, NOW), null);
});

test("fetchMaintenance: counter readings on the service day from the statistics' state", async () => {
  const hass = { callWS: makeCallWS("viessmann", () => NOW) };
  const e = { burner_hours: "sensor.vicare_burner_hours", burner_starts: "sensor.vicare_burner_starts" };
  assert.deepEqual(await fetchMaintenance(hass, new Cache(), e, "2026-03-20", TZ), { hours: 16033, starts: 76012 });
  assert.equal(await fetchMaintenance(hass, new Cache(), e, "kein Datum", TZ), null);
});
