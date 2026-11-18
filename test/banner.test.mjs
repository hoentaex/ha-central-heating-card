import assert from "node:assert/strict";
import { test } from "node:test";
import { isNight, sceneState, sceneSVG } from "../src/banner.js";

test("night picture follows the dark theme unless forced", () => {
  assert.equal(isNight({ themes: { darkMode: true } }, {}), true);
  assert.equal(isNight({ themes: { darkMode: false } }, {}), false);
  assert.equal(isNight({ themes: { darkMode: true } }, { illustration_theme: "day" }), false);
  assert.equal(isNight({}, { illustration_theme: "night" }), true);
});

test("scene state per card status", () => {
  assert.deepEqual(sceneState("running", true), { ground: "heat", flame: true, flow: true, heat: true, warm: true });
  assert.deepEqual(sceneState("dhw", true), { ground: "water", flame: true, flow: true, heat: false, warm: true });
  assert.deepEqual(sceneState("dhw", false), { ground: "water", flame: false, flow: true, heat: false, warm: false });
  assert.equal(sceneState("idle", false).ground, "off");
  assert.equal(sceneState("offline", null).flame, false);
});

const svg = (state, extra = {}) =>
  sceneSVG({
    platform: "wolflink",
    state,
    display: "58°",
    readout: "47,6°",
    readoutLabel: "Vorlauf",
    animate: true,
    ...extra,
  });

test("the flame burns only while the burner runs; flow and heat follow the state", () => {
  const on = svg(sceneState("running", true));
  assert.match(on, /class="hb-flame anim"/);
  assert.match(on, /class="hb-flow anim"/);
  assert.match(on, /class="hb-heat anim"/);
  const off = svg(sceneState("idle", false));
  assert.doesNotMatch(off, /hb-flame|hb-flow|hb-heat/);
  assert.match(off, /hb-pilot/);
  assert.doesNotMatch(svg(sceneState("running", true), { animate: false }), / anim"/);
});

test("Wolf gets its red head, other brands a neutral one; the readout is drawn last", () => {
  assert.match(svg(sceneState("idle", false)), /hb-head wolf/);
  const vi = svg(sceneState("idle", false), { platform: "vicare" });
  assert.match(vi, /hb-head neutral/);
  assert.doesNotMatch(vi, /hb-head wolf/);
  const s = svg(sceneState("running", true));
  assert.ok(s.lastIndexOf("hb-rd2") > s.lastIndexOf("hb-win"));
});
