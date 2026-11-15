// Reads the live state of the heating from hass: burner, temperatures, targets, pumps, mode.
// Wolf reports switches as text ("ein" / "aus"), ViCare as binary sensors; both end up as true / false / null.
import { PUMPS } from "./detect.js";

const BAD = new Set(["unavailable", "unknown", "none", "", "null"]);
const ON = new Set(["on", "ein", "an", "true", "1", "running", "heating", "active"]);
const OFF = new Set(["off", "aus", "false", "0", "idle", "inactive", "standby"]);

const stateOf = (hass, id) => (id ? hass?.states?.[id] : undefined);

/** Number of an entity's state (accepts a decimal comma), or null. */
export function num(hass, id) {
  const s = stateOf(hass, id);
  if (!s || BAD.has(String(s.state).toLowerCase())) return null;
  const v = Number.parseFloat(String(s.state).replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

/** true / false for on/off-like states (also numbers: > 0 is on), null when missing or unavailable. */
export function onOff(hass, id) {
  const s = stateOf(hass, id);
  if (!s) return null;
  const v = String(s.state).trim().toLowerCase();
  if (BAD.has(v)) return null;
  if (ON.has(v)) return true;
  if (OFF.has(v)) return false;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n > 0 : null;
}

/**
 * Viessmann heating curve (manufacturer formula): flow temperature for an outdoor temperature `at`, a room
 * set point `rt`, the slope and the shift (level).
 */
export function vicareCurve(at, rt, slope, shift) {
  const d = at - rt;
  return rt + shift - slope * d * (1.4347 + 0.021 * d + 247.9e-6 * d * d);
}

/** Height of the flame, 0 (off) … 1: modulation in % when known (at least a small flame), else 0.7. */
export function flameLevel(on, modulation) {
  if (!on) return 0;
  if (modulation === null || modulation === undefined) return 0.7;
  return Math.min(1, Math.max(0.25, modulation / 100));
}

/** Plausible room temperature (a sensor in the boiler room reads 30–40 °C). */
export const plausibleRoom = (v) => v === null || (v >= 8 && v <= 30);

/** The ViCare program that sets the room target: normal, reduced or comfort (from the climate entity). */
function activeProgram(hass, modeId) {
  const a = stateOf(hass, modeId)?.attributes || {};
  const p = String(a.active_vicare_program || a.vicare_program || "").toLowerCase();
  if (p.includes("reduced") || p.includes("eco")) return "reduced";
  if (p.includes("comfort")) return "comfort";
  return p ? "normal" : null;
}

/** Everything the card shows "now". `e` is the role → entity map from detect.js. */
export function readHeating(hass, e) {
  const burnerState = stateOf(hass, e.burner);
  const burnerOn = onOff(hass, e.burner);
  const modulation = num(hass, e.modulation);
  const outdoor = num(hass, e.outdoor);
  const program = activeProgram(hass, e.mode);

  // Flow target: the heating curve where the integration reports it (ViCare), for the active program.
  let flowTarget = null;
  const slope = num(hass, e.curve_slope);
  const shift = num(hass, e.curve_shift);
  const rt = num(hass, e[`${program === "reduced" ? "reduced" : program === "comfort" ? "comfort" : "normal"}_temp`]);
  if (slope !== null && shift !== null && rt !== null && outdoor !== null)
    flowTarget = Math.round(vicareCurve(outdoor, rt, slope, shift) * 10) / 10;

  const roomV = num(hass, e.room_temp);
  const pumps = PUMPS.filter((k) => e[k]).map((k) => ({ key: k, on: onOff(hass, e[k]) }));
  const dhwCharging = onOff(hass, e.pump_dhw_charge);
  const changed = burnerState?.last_changed ? new Date(burnerState.last_changed) : null;

  return {
    burner: { on: burnerOn, since: changed, modulation, level: flameLevel(burnerOn, modulation) },
    boiler: { v: num(hass, e.boiler_temp), target: num(hass, e.boiler_target), supply: num(hass, e.boiler_supply) },
    flow: { v: num(hass, e.flow_temp), target: flowTarget },
    dhw: { v: num(hass, e.dhw_temp), target: num(hass, e.dhw_target) },
    outdoor,
    room: e.room_temp ? { v: roomV, target: num(hass, e.room_target), plausible: plausibleRoom(roomV) } : null,
    curve: slope !== null && shift !== null ? { slope, shift, rt, program } : null,
    pumps,
    dhwCharging,
    mode: stateOf(hass, e.mode)?.state ?? null,
    program,
    updated: newest(hass, [e.burner, e.boiler_temp, e.flow_temp, e.dhw_temp]),
  };
}

const newest = (hass, ids) => {
  let t = 0;
  for (const id of ids) {
    const s = stateOf(hass, id);
    const v = s?.last_updated ? Date.parse(s.last_updated) : 0;
    if (v > t) t = v;
  }
  return t ? new Date(t) : null;
};

/** Status of the header chip: running, dhw (hot water is being charged), idle or offline. */
export function statusOf(h) {
  if (h.burner.on === null && h.boiler.v === null) return "offline";
  if (h.dhwCharging) return "dhw";
  if (h.burner.on) return "running";
  return "idle";
}
