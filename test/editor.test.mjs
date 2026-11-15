// Editor: config ↔ form data (defaults dropped, entity overrides flat in the form and nested in the YAML).
import assert from "node:assert/strict";
import { test } from "node:test";
import { editorSchema, fromFormData, labelFor, toFormData } from "../src/editor.js";

test("round trip: defaults fill the form and are dropped again; e_* fields become entities", () => {
  const config = {
    name: "Heizung Wolf",
    outdoor_entity: "sensor.wetter",
    entities: { room_temp: "sensor.wohnzimmer", solar_today: "sensor.x" },
  };
  const data = toFormData(config);
  assert.equal(data.preset, "auto");
  assert.equal(data.e_room_temp, "sensor.wohnzimmer");
  assert.equal(data.e_burner, "");
  assert.deepEqual(fromFormData(data, false, config), config);
  const changed = fromFormData(
    { ...data, e_burner: "sensor.flamme", e_room_temp: "", takt_warn_min: 4 },
    false,
    config,
  );
  assert.deepEqual(changed.entities, { solar_today: "sensor.x", burner: "sensor.flamme" });
  assert.equal(changed.takt_warn_min, 4);
});

test("mini: popup defaults to on, sections and default view are not offered", () => {
  assert.deepEqual(fromFormData(toFormData({}, true), true), {});
  assert.deepEqual(fromFormData({ ...toFormData({}, true), popup: false }, true), { popup: false });
  const names = JSON.stringify(editorSchema("de", { mini: true }));
  assert.ok(!names.includes('"sections"'));
  assert.ok(names.includes('"popup"'));
  assert.ok(JSON.stringify(editorSchema("de")).includes('"sections"'));
});

test("labels in both languages", () => {
  assert.equal(labelFor("de", "e_burner"), "Brenner (an/aus)");
  assert.equal(labelFor("en", "maintenance_date"), "Last service");
  assert.equal(labelFor("fr", "preset"), "Integration");
});
