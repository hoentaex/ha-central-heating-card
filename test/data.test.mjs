// Recorder data: cycling from history (to the minute), statistics per day and month.
// Tests run in America/New_York (see package.json) while the "server" is in Europe/Berlin.
import assert from "node:assert/strict";
import { test } from "node:test";
import { simulateHistory, simulateStats } from "../demo/mock.js";
import {
  burnerDays,
  Cache,
  counterDays,
  dayWindows,
  historyPoints,
  statDays,
  statMonths,
  taktClass,
  taktDays,
  taktSummary,
} from "../src/data.js";
import { onOff } from "../src/heating.js";

const TZ = "Europe/Berlin";
const NOW = new Date("2026-11-15T20:30:00Z"); // 21:30 in Berlin
const isOn = (s) => onOff({ states: { x: { state: s } } }, "x");
const H = 3600e3;

test("dayWindows: calendar days in the server's zone, today ends now", () => {
  const w = dayWindows(NOW, TZ, 3);
  assert.deepEqual(
    w.map((x) => x.key),
    ["2026-11-13", "2026-11-14", "2026-11-15"],
  );
  assert.equal(w[0].start.toISOString(), "2026-11-12T23:00:00.000Z");
  assert.equal(w[2].end, NOW);
  assert.equal(w[2].today, true);
});

test("historyPoints: compressed rows (seconds) and full states, sorted", () => {
  const p = historyPoints([
    { s: "on", lu: 1700000100 },
    { state: "off", last_changed: "2023-11-14T22:13:20Z" },
  ]);
  assert.deepEqual(p, [
    { t: 1700000000000, s: "off" },
    { t: 1700000100000, s: "on" },
  ]);
});

test("burnerDays: runs split at midnight, the state at the window start is no start, unknown time not counted", () => {
  const [d1, d2] = dayWindows(NOW, TZ, 2);
  const m = d2.start.getTime();
  const pts = [
    { t: m - 3 * H, s: "on" }, // already on before the window: no start
    { t: m - 2 * H, s: "aus" },
    { t: m - 1 * H, s: "ein" }, // start on day 1, runs over midnight
    { t: m + 0.5 * H, s: "aus" },
    { t: m + 2 * H, s: "unavailable" },
    { t: m + 3 * H, s: "aus" },
    { t: m + 4 * H, s: "ein" }, // after unknown, previous is off → start
    { t: m + 4.25 * H, s: "aus" },
  ];
  const [a, b] = burnerDays(pts, [d1, d2], isOn, NOW.getTime());
  assert.equal(a.starts, 1);
  assert.equal(Math.round(a.onMs / 60e3), 120); // 1 h before the first "aus" + 1 h before midnight
  assert.equal(b.starts, 1);
  assert.equal(Math.round(b.onMs / 60e3), 45);
  assert.equal(Math.round((d2.end - d2.start - b.covered) / H), 1); // the unavailable hour
});

test("counterDays: increase per day, baseline before the window, resets give null", () => {
  const [d1, d2] = dayWindows(NOW, TZ, 2);
  const m = d2.start.getTime();
  const pts = [
    { t: d1.start.getTime() - H, s: "100" },
    { t: m - H, s: "130" },
    { t: m + H, s: "145" },
    { t: m + 2 * H, s: "unavailable" },
    { t: m + 3 * H, s: "150" },
  ];
  assert.deepEqual(counterDays(pts, [d1, d2]), [30, 20]);
  assert.deepEqual(
    counterDays(
      [
        { t: m + H, s: "5" },
        { t: m + 2 * H, s: "2" },
      ],
      [d1, d2],
    ),
    [null, null],
  );
});

test("taktDays + summary: the simulated Wolf week gives ~88 starts a day at ~4.1 min (real values)", () => {
  const e = { burner: "sensor.flamme", burner_starts: "sensor.brennerstarts" };
  const days = taktDays(simulateHistory("wolf", NOW), e, isOn, TZ, NOW);
  assert.equal(days.length, 8);
  assert.deepEqual(
    days.slice(0, 7).map((d) => d.starts),
    [85, 96, 110, 88, 81, 85, 73],
  );
  assert.equal(days[7].today, true);
  const s = taktSummary(days);
  assert.equal(Math.round(s.perDay), 88);
  assert.equal(Math.round(s.min * 10) / 10, 4.1);
  assert.equal(taktClass(s.min), "warn");
  // Without the counter the starts come from the burner's off→on changes.
  const noCounter = taktDays(simulateHistory("wolf", NOW), { burner: "sensor.flamme" }, isOn, TZ, NOW);
  assert.deepEqual(
    noCounter.slice(0, 7).map((d) => d.starts),
    [85, 96, 110, 88, 81, 85, 73],
  );
  assert.equal(taktClass(10.6), "good");
  assert.equal(taktClass(7), "mid");
});

test("taktSummary: no starts at all (summer without hot water) → null", () => {
  assert.equal(taktSummary([{ today: false, starts: 0, hours: 0 }]), null);
  assert.equal(taktSummary([]), null);
});

test("statDays: 30 days aligned to the calendar, starts only where statistics exist", () => {
  const e = {
    burner_hours: "sensor.vicare_burner_hours",
    burner_starts: "sensor.vicare_burner_starts",
    outdoor: "sensor.vicare_outside_temperature",
  };
  const stats = simulateStats("viessmann", Object.values(e), "day", NOW);
  const days = statDays(stats, e, TZ, NOW);
  assert.equal(days.length, 30);
  assert.equal(days.at(-1).key, "2026-11-15");
  assert.deepEqual([days.at(-1).hours, days.at(-1).starts, days.at(-1).temp], [8, 39, 2.9]);
  const w = statDays(
    simulateStats("wolf", ["sensor.brennerbetriebsstunden"], "day", NOW),
    { burner_hours: "sensor.brennerbetriebsstunden" },
    TZ,
    NOW,
  );
  assert.equal(w.at(-1).starts, null);
});

test("statMonths: 13 months, the running one last, previous year where it exists", () => {
  const e = { burner_hours: "sensor.vicare_burner_hours", burner_starts: "sensor.vicare_burner_starts" };
  const m = statMonths(simulateStats("viessmann", Object.values(e), "month", NOW), e, TZ, NOW);
  assert.equal(m.length, 13);
  assert.deepEqual([m[0].key, m.at(-1).key, m.at(-1).current], ["2025-11", "2026-11", true]);
  assert.deepEqual([m.at(-1).hours, m.at(-1).prevHours, m.at(-1).starts, m.at(-1).prevStarts], [97, 228, 549, 1118]);
  assert.equal(m[1].prevHours, null);
});

test("Cache: shares in-flight loads, expires, forgets failures", async () => {
  let now = 0;
  let calls = 0;
  const c = new Cache(() => now);
  const load = async () => ++calls;
  assert.equal(await c.get("k", 10, load), 1);
  assert.equal(await c.get("k", 10, load), 1);
  now = 11;
  assert.equal(await c.get("k", 20, load), 2);
  await assert.rejects(c.get("x", 99, async () => Promise.reject(new Error("boom"))));
  assert.equal(await c.get("x", 99, load), 3);
});
