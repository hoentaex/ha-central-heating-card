// Heating curve and hot water from hourly statistics and pump history (simulated with the real values).
import assert from "node:assert/strict";
import { test } from "node:test";
import { simulateHistory, simulateStats } from "../demo/mock.js";
import { curvePoints, fitLine, hourRows, pumpSummary } from "../src/data.js";
import { onOff } from "../src/heating.js";

const TZ = "Europe/Berlin";
const NOW = new Date("2026-11-15T20:30:00Z");
const isOn = (s) => onOff({ states: { x: { state: s } } }, "x");

const rowsOf = (house, e) => hourRows(simulateStats(house, Object.values(e), "hour", NOW), e, NOW);

test("fitLine: least squares; too few points or no spread → null", () => {
  const f = fitLine([0, 1, 2, 3, 4].map((x) => ({ x, y: 50 - 2 * x })));
  assert.equal(Math.round(f.a), 50);
  assert.equal(Math.round(f.b * 10) / 10, -2);
  assert.equal(
    fitLine([
      { x: 0, y: 1 },
      { x: 5, y: 2 },
    ]),
    null,
  );
  assert.equal(fitLine([0, 0.5, 1, 1.5].map((x) => ({ x, y: x }))), null);
});

test("hourRows: 47 full hours aligned to the clock, the empty running hour dropped", () => {
  const e = {
    flow_temp: "sensor.vorlauftemperatur",
    outdoor: "sensor.aussentemperatur",
    dhw_temp: "sensor.speichertemperatur",
  };
  const rows = rowsOf("wolf", e);
  assert.equal(rows.length, 47);
  assert.deepEqual([rows.at(-1).flow, rows.at(-1).outdoor, rows.at(-1).dhw], [47.5, 6.4, 53.1]);
  assert.equal(rows.at(-1).start.toISOString(), "2026-11-15T19:00:00.000Z");
});

test("Wolf: setback hours found below the trend; the trend is almost flat (~47 °C at 0 °C)", () => {
  const e = { flow_temp: "sensor.vorlauftemperatur", outdoor: "sensor.aussentemperatur" };
  const { pts, fit } = curvePoints(rowsOf("wolf", e));
  assert.equal(pts.length, 47);
  const low = pts.filter((p) => p.low).length;
  assert.ok(low >= 12 && low <= 18, `low ${low}`);
  assert.equal(Math.round(fit.a), 47);
  assert.ok(fit.b > -0.3 && fit.b < 0.1, `slope ${fit.b}`);
});

test("ViCare (Viessmann): the setback hours are the night (22–7 Uhr), the day runs at ~58 °C at 0 °C", () => {
  const e = { flow_temp: "sensor.vicare_supply_temperature", outdoor: "sensor.vicare_outside_temperature" };
  const { pts, fit } = curvePoints(rowsOf("viessmann", e));
  const night = pts.filter((p) => p.low).map((p) => new Date(p.start).getUTCHours());
  assert.ok(night.length >= 10, `night ${night.length}`);
  for (const h of night) assert.ok(h >= 21 || h <= 6, `hour ${h}`); // 22–7 Uhr Berlin
  assert.ok(fit.a > 55 && fit.a < 62, `a ${fit.a}`);
});

test("pumpSummary: Wolf charges 6× a day for ~10 min; Viessmann circulates ~9.6 h a day", () => {
  const s = pumpSummary(simulateHistory("wolf", NOW), "sensor.ladepumpe", isOn, TZ, NOW);
  assert.equal(s.days, 7);
  assert.equal(s.perDay, 6);
  assert.equal(Math.round(s.minPerRun * 10) / 10, 10.3);
  const z = pumpSummary(
    simulateHistory("viessmann", NOW),
    "binary_sensor.vicare_dhw_circulation_pump_active",
    isOn,
    TZ,
    NOW,
  );
  assert.equal(Math.round(z.hoursPerDay * 10) / 10, 9.6);
  assert.equal(pumpSummary({}, "sensor.x", isOn, TZ, NOW), null);
  assert.equal(pumpSummary({}, undefined, isOn, TZ, NOW), null);
});
