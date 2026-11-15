// Optimisation rules against the real data of both houses, and the store for done / hidden tips.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass, simulateHistory, simulateStats } from "../demo/mock.js";
import { availability, hourRows, pumpSummary, statDays, statMonths, taktDays, taktSummary } from "../src/data.js";
import { detect } from "../src/detect.js";
import { num, onOff, readHeating, vicareCurve } from "../src/heating.js";
import { TipStore } from "../src/store.js";
import { buildTips } from "../src/tips.js";

const TZ = "Europe/Berlin";
const NOW = new Date("2026-11-15T20:30:00Z");
const isOn = (s) => onOff({ states: { x: { state: s } } }, "x");

/** What the card has after loading, for one house. */
function input(house, lang = "de") {
  const hass = makeHass({ house, now: NOW });
  const { platform, entities: e } = detect(hass);
  const hist = simulateHistory(house, NOW);
  const ids = Object.values(e);
  const takt = taktDays(hist, e, isOn, TZ, NOW);
  const d = {
    takt,
    summary: taktSummary(takt),
    days: statDays(simulateStats(house, ids, "day", NOW), e, TZ, NOW),
    months: statMonths(simulateStats(house, ids, "month", NOW), e, TZ, NOW),
    hours: hourRows(simulateStats(house, ids, "hour", NOW), e, NOW),
    charge: pumpSummary(hist, e.pump_dhw_charge, isOn, TZ, NOW),
    circ: pumpSummary(hist, e.pump_dhw_circ, isOn, TZ, NOW),
    avail: availability(hist, e.burner, TZ, NOW),
  };
  const n = (id) => num(hass, id);
  const slope = n(e.curve_slope);
  const curves =
    slope === null
      ? null
      : {
          slope,
          shift: n(e.curve_shift),
          normal: (x) => vicareCurve(x, n(e.normal_temp), slope, n(e.curve_shift)),
          reduced: (x) => vicareCurve(x, n(e.reduced_temp), slope, n(e.curve_shift)),
        };
  return { lang, h: readHeating(hass, e), e, d, curves, num: n, platform };
}

test("Wolf: short cycling (red), hot water 6× a day, flat weather compensation; no ViCare-only tips", () => {
  const { tips, ok } = buildTips(input("wolf"));
  assert.deepEqual(
    tips.map((t) => [t.id, t.sev]),
    [
      ["takt", "warn"],
      ["ww", "mid"],
      ["flat", "mid"],
    ],
  );
  const takt = tips[0];
  assert.equal(takt.title, "Brenner taktet: Ø 4,1 min je Start");
  assert.equal(takt.gain, "−21.000 Starts/Jahr");
  assert.ok(takt.todo.some((s) => s.includes("Stufe 2")));
  assert.ok(takt.todo.some((s) => s.includes("Speicherladungen")));
  assert.ok(takt.where.includes("nur lesen"));
  assert.equal(tips[1].action, null); // Wolf: the hot-water target is a sensor, not settable
  assert.ok(ok.some((s) => s.startsWith("Cloud")));
});

test("Viessmann: room target, heating curve level, circulation; actions on the number entities", () => {
  const { tips, ok } = buildTips(input("viessmann"));
  assert.deepEqual(
    tips.map((t) => t.id),
    ["room", "curve", "circ"],
  );
  assert.deepEqual(tips[0].action, {
    entity: "number.vplusho1_40_normaltemperatur",
    label: "Normaltemperatur",
    from: 23,
    to: 22,
    unit: "°C",
  });
  assert.deepEqual(tips[1].action, {
    entity: "number.vplusho1_40_verschiebung_der_heizkurve",
    label: "Niveau der Heizkurve",
    from: 10,
    to: 8,
    unit: "K",
  });
  assert.equal(tips[1].title, "Heizkurve: Niveau +10 K");
  assert.match(tips[0].why, /rund 90 Brennerstunden/);
  assert.equal(tips[2].title, "Zirkulation läuft 9,6 h am Tag");
  assert.ok(ok.includes("Takt ruhig · Ø 10,6 min"));
  assert.ok(ok.includes("Warmwasser lädt selten"));
  assert.ok(ok.includes("Solar trägt bei"));
});

test("English texts", () => {
  const { tips } = buildTips(input("viessmann", "en"));
  assert.equal(tips[0].title, "Room target 23 °C is high");
});

test("summer rule: heating pump on at > 16 °C over three days", () => {
  const x = input("viessmann");
  const warm = x.d.days.map((r, i) => (i >= x.d.days.length - 4 ? { ...r, temp: 19 } : r));
  const { tips } = buildTips({ ...x, d: { ...x.d, days: warm } });
  assert.ok(tips.some((t) => t.id === "summer"));
});

test("TipStore: per-user frontend data, falls back to localStorage-less memory on errors", async () => {
  const data = {};
  const hass = {
    callWS: async (m) => {
      if (m.type === "frontend/get_user_data") return { value: data[m.key] ?? null };
      data[m.key] = m.value;
      return null;
    },
  };
  const s = new TipStore();
  await s.load(hass);
  await s.set(hass, "binary_sensor.burner", "room", { done: "2026-11-15", before: 0.77 });
  assert.deepEqual(s.get("binary_sensor.burner", "room"), { done: "2026-11-15", before: 0.77 });
  assert.deepEqual(data.central_heating_card, {
    "binary_sensor.burner": { room: { done: "2026-11-15", before: 0.77 } },
  });
  await s.set(hass, "binary_sensor.burner", "room", null);
  assert.equal(s.get("binary_sensor.burner", "room"), undefined);

  const broken = new TipStore();
  await broken.load({ callWS: async () => Promise.reject(new Error("unknown command")) });
  await broken.set({ callWS: async () => Promise.reject(new Error("x")) }, "h", "t", { hidden: true });
  assert.deepEqual(broken.get("h", "t"), { hidden: true });
});
