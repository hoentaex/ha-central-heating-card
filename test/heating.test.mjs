// Live state: Wolf text states, ViCare binary sensors, heating curve, flame height, status.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "../demo/mock.js";
import { detect } from "../src/detect.js";
import { flameScale, flameSVG } from "../src/flame.js";
import { flameLevel, num, onOff, plausibleRoom, readHeating, statusOf, vicareCurve } from "../src/heating.js";
import { translator } from "../src/shared.js";
import { burnerDetail, targetLine } from "../src/texts.js";

const st = (state) => ({ state: String(state), attributes: {} });

test("onOff: Wolf text, binary sensors, numbers, unavailable", () => {
  const hass = {
    states: {
      a: st("ein"),
      b: st("aus"),
      c: st("on"),
      d: st("off"),
      e: st("1"),
      f: st("0"),
      g: st("unavailable"),
      h: st("Störung"),
    },
  };
  assert.deepEqual(
    ["a", "b", "c", "d", "e", "f", "g", "h", "x"].map((id) => onOff(hass, id)),
    [true, false, true, false, true, false, null, null, null],
  );
});

test("num: decimal comma, unavailable, missing", () => {
  const hass = { states: { a: st("47,6"), b: st("unknown"), c: st("49") } };
  assert.equal(num(hass, "a"), 47.6);
  assert.equal(num(hass, "b"), null);
  assert.equal(num(hass, "c"), 49);
  assert.equal(num(hass, "missing"), null);
});

test("vicareCurve: Viessmann (slope 1.2, shift 10 K, 23 °C) gives 63 °C at 0 °C and 56.9 °C at 5.6 °C", () => {
  assert.equal(Math.round(vicareCurve(0, 23, 1.2, 10)), 63);
  assert.equal(Math.round(vicareCurve(5.6, 23, 1.2, 10) * 10) / 10, 56.9);
  assert.equal(Math.round(vicareCurve(0, 18, 1.2, 10)), 53);
});

test("flame: off 0, unknown modulation 0.7, modulation clamped to 25–100 %; scale 0.62–1", () => {
  assert.equal(flameLevel(false, 80), 0);
  assert.equal(flameLevel(true, null), 0.7);
  assert.equal(flameLevel(true, 0), 0.25);
  assert.equal(flameLevel(true, 48), 0.48);
  assert.equal(flameLevel(true, 140), 1);
  assert.equal(flameScale(0), 0.62);
  assert.equal(flameScale(1), 1);
  assert.match(flameSVG({ on: true, level: 0.5 }), /class="fire on anim"/);
  assert.match(flameSVG({ on: true, level: 0.5 }), /class="em"/);
  assert.doesNotMatch(flameSVG({ on: true, small: true }), /class="em"/);
  assert.doesNotMatch(flameSVG({ on: true, animate: false }), /class="em"/);
  assert.doesNotMatch(flameSVG({ on: false }), /fire on/);
});

test("readHeating Wolf: burner text state, targets, implausible room, pumps", () => {
  const hass = makeHass({ house: "wolf", burner: true });
  const h = readHeating(hass, detect(hass).entities);
  assert.equal(h.burner.on, true);
  assert.equal(h.burner.level, 0.7);
  assert.deepEqual(h.boiler, { v: 58, target: 51, supply: null });
  assert.deepEqual(h.dhw, { v: 52, target: 55 });
  assert.equal(h.flow.target, null);
  assert.equal(h.room.plausible, false);
  assert.equal(plausibleRoom(21.5), true);
  assert.deepEqual(
    h.pumps.map((p) => [p.key, p.on]),
    [
      ["pump_boiler", true],
      ["pump_mixer", true],
      ["pump_dhw_charge", false],
    ],
  );
  assert.equal(statusOf(h), "running");
  assert.equal(h.mode, "heizbetrieb");
});

test("readHeating Viessmann: modulation, flow target from the curve of the active program, status", () => {
  const hass = makeHass({ house: "viessmann", burner: true });
  const h = readHeating(hass, detect(hass).entities);
  assert.equal(h.burner.modulation, 48);
  assert.equal(h.burner.level, 0.48);
  assert.equal(h.flow.target, 56.9);
  assert.equal(h.program, "normal");
  assert.equal(h.room, null);
  assert.equal(statusOf(h), "running");
  assert.equal(statusOf(readHeating(makeHass({ house: "viessmann", dhw: true }), detect(hass).entities)), "dhw");
  assert.equal(
    statusOf(readHeating(makeHass({ house: "viessmann", unavailable: true }), detect(hass).entities)),
    "offline",
  );
  assert.equal(statusOf(readHeating(makeHass({ house: "viessmann" }), detect(hass).entities)), "idle");
});

test("texts: burner detail and target line", () => {
  const t = translator("de");
  const now = new Date(Date.UTC(2026, 10, 15, 20, 0));
  const since = new Date(now.getTime() - 7 * 60e3);
  assert.equal(
    burnerDetail({ on: true, modulation: 48, since }, now, "de", "Europe/Berlin", t),
    "Modulation 48 % · seit 7 min",
  );
  assert.equal(burnerDetail({ on: false, modulation: 0, since }, now, "de", "Europe/Berlin", t), "aus seit 20:53");
  assert.equal(targetLine(49, 51, "target", "de", t), "Soll 51 °C · −2,0 K");
  assert.equal(targetLine(62.6, 58, "target", "de", t), "Soll 58 °C · +4,6 K");
  assert.equal(targetLine(55, 55.1, "curve", "de", t), "Kurve 55,1 °C · erreicht");
  assert.equal(targetLine(49, null, "target", "de", t), "");
});
