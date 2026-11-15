// Optimisation tips: fixed rules checked against the live state and the recorder data. Each tip carries the numbers
// that trigger it (evidence), why it matters, concrete steps, a rough saving and – where the integration can write
// the value (ViCare number entities) – an action the card offers behind a confirmation.
//
// Savings are rules of thumb and labelled as such. Rules that find nothing add a line to "no findings".
import { curvePoints } from "./data.js";
import { fmtNum } from "./shared.js";

const S = {
  de: {
    takt_t: "Brenner taktet: Ø {m} min je Start",
    takt_s: "{n} Starts am Tag, Ziel unter {goal}",
    takt_g: "−{v} Starts/Jahr",
    takt_e1: "Starts je Tag",
    takt_e2: "Ø Laufzeit",
    takt_e3: "Starts gesamt",
    takt_w:
      "Jeder Start kostet Vorspülung, Zündung und Ruß. Kurze Läufe erreichen nie den besten Wirkungsgrad und verschleißen Zündung und Düse.",
    takt_d1: "Schaltdifferenz (Kessel-Hysterese) am Regler erhöhen, z. B. auf 8–10 K",
    takt_d2: "Stufe 2 nur für Warmwasser freigeben, Heizbetrieb mit Stufe 1",
    takt_d3: "Speicherladungen bündeln (siehe Warmwasser-Hinweis)",
    takt_d4: "Brennerleistung prüfen lassen: für den Bedarf vermutlich zu groß",
    ww_t: "Warmwasser lädt {n}× am Tag",
    ww_s: "jede Ladung ist ein zusätzlicher Brennerstart",
    ww_g: "−{v} Starts/Tag",
    ww_e1: "Ladungen je Tag",
    ww_e2: "Ø Dauer",
    ww_e3: "WW-Soll",
    ww_w: "Ein niedrigeres Soll und feste Ladezeiten senken Starts und Bereitschaftsverluste. Einmal pro Woche 60 °C gegen Legionellen reichen.",
    ww_d1: "WW-Soll um 5 K senken",
    ww_d2: "Zeitprogramm Warmwasser auf morgens und abends begrenzen",
    flat_t: "Vorlauf folgt dem Wetter kaum",
    flat_s: "{f} °C bei 0 °C, nur {b} K mehr je 1 K kälter",
    flat_g: "≈ 3–5 %",
    flat_e1: "Vorlauf bei 0 °C",
    flat_e2: "je 1 K kälter",
    flat_e3: "Außen (48 h)",
    flat_w:
      "Ohne funktionierende Witterungsführung heizt die Anlage an milden Tagen zu warm. Häufige Ursache: Der Außenfühler bekommt Sonne oder Abwärme ab.",
    flat_d1: "Außenfühler prüfen: Nord- oder Nordwestwand, ohne direkte Sonne",
    flat_d2: "danach Heizkurve an milden Tagen 5–8 K tiefer einstellen",
    room_t: "Raum-Soll {v} °C ist hoch",
    room_s: "die meisten Häuser fahren 20–21 °C",
    room_g: "≈ 6 % je 1 K",
    room_e1: "Normaltemperatur",
    room_e2: "Reduziert",
    room_e3: "Brennerstunden 12 Mon.",
    room_w: "Faustregel: 1 K weniger Raumtemperatur spart rund 6 % Heizenergie{h}.",
    room_wh: ", hier rund {v} Brennerstunden im Jahr",
    room_d1: "Normaltemperatur um 1 K senken",
    room_d2: "eine Woche beobachten, ob alle Räume warm genug sind",
    room_a: "Normaltemperatur",
    curve_t: "Heizkurve: Niveau {v} K",
    curve_s: "Soll bei 0 °C: {s} °C",
    curve_g: "mehr Brennwert",
    curve_e1: "Soll bei 0 °C",
    curve_e2: "Ist bei 0 °C",
    curve_e3: "Steigung",
    curve_w:
      "Je kühler das Heizwasser zurückkommt, desto mehr Wärme holt ein Brennwertkessel aus den Abgasen. Eine hohe Kurve verschenkt das und heizt an milden Tagen über.",
    curve_d1: "Niveau in Schritten von 2 K senken, alle 3–4 Tage",
    curve_d2: "aufhören, sobald der kälteste Raum nicht mehr warm wird",
    curve_a: "Niveau der Heizkurve",
    circ_t: "Zirkulation läuft {v} h am Tag",
    circ_s: "{n} Takte am Tag",
    circ_g: "−{v} h Laufzeit/Tag",
    circ_e1: "Laufzeit je Tag",
    circ_e2: "Takte je Tag",
    circ_e3: "Ziel",
    circ_w: "Jede Stunde Zirkulation kühlt den Speicher über die Leitungen aus und kostet Pumpenstrom.",
    circ_d1: "Zirkulations-Zeitprogramm auf 6–8 und 18–22 Uhr begrenzen",
    summer_t: "Heizkreis läuft trotz Sommerwetter",
    summer_s: "Ø {v} °C außen in den letzten 3 Tagen",
    summer_g: "Pumpenstrom, Verluste",
    summer_e1: "Ø außen (3 Tage)",
    summer_e2: "Heizkreispumpe",
    summer_e3: "Brennerstunden (3 Tage)",
    summer_w: "Über etwa 16 °C Tagesmittel braucht das Haus keine Heizung mehr; nur noch Warmwasser.",
    summer_d1: "Betriebsart auf „nur Warmwasser“ bzw. Sommerbetrieb stellen",
    where_wolf: "Am Wolf-Regler bzw. durch den Fachbetrieb; die Integration kann nur lesen.",
    where_vicare: "In der ViCare-App oder am Regler.",
    where_service: "Durch den Fachbetrieb.",
    on: "an",
    goal_circ: "≤ 6 h",
    ok_takt: "Takt ruhig · Ø {m} min",
    ok_ww: "Warmwasser lädt selten",
    ok_solar: "Solar trägt bei",
    ok_avail: "Cloud {v} % erreichbar",
    ok_curve: "Vorlauf folgt dem Wetter",
  },
  en: {
    takt_t: "Burner short-cycles: Ø {m} min per start",
    takt_s: "{n} starts a day, aim below {goal}",
    takt_g: "−{v} starts/year",
    takt_e1: "Starts per day",
    takt_e2: "Ø running time",
    takt_e3: "Starts in total",
    takt_w:
      "Every start costs pre-purge, ignition and soot. Short runs never reach the best efficiency and wear the ignition and nozzle.",
    takt_d1: "Raise the switching differential (boiler hysteresis) at the controller, e.g. to 8–10 K",
    takt_d2: "Allow stage 2 for hot water only, heat with stage 1",
    takt_d3: "Bundle the cylinder charges (see the hot-water tip)",
    takt_d4: "Have the burner output checked: probably too large for the demand",
    ww_t: "Hot water charges {n}× a day",
    ww_s: "every charge is an extra burner start",
    ww_g: "−{v} starts/day",
    ww_e1: "Charges per day",
    ww_e2: "Ø duration",
    ww_e3: "DHW target",
    ww_w: "A lower target and fixed charging times cut starts and standby losses. 60 °C once a week is enough against legionella.",
    ww_d1: "Lower the hot-water target by 5 K",
    ww_d2: "Limit the hot-water time program to mornings and evenings",
    flat_t: "Flow hardly follows the weather",
    flat_s: "{f} °C at 0 °C, only {b} K more per 1 K colder",
    flat_g: "≈ 3–5 %",
    flat_e1: "Flow at 0 °C",
    flat_e2: "per 1 K colder",
    flat_e3: "Outdoor (48 h)",
    flat_w:
      "Without working weather compensation the system overheats on mild days. A common cause: the outdoor sensor gets sun or waste heat.",
    flat_d1: "Check the outdoor sensor: north or north-west wall, no direct sun",
    flat_d2: "then set the heating curve 5–8 K lower on mild days",
    room_t: "Room target {v} °C is high",
    room_s: "most homes run 20–21 °C",
    room_g: "≈ 6 % per 1 K",
    room_e1: "Normal temperature",
    room_e2: "Reduced",
    room_e3: "Burner hours 12 mo.",
    room_w: "Rule of thumb: 1 K less room temperature saves about 6 % heating energy{h}.",
    room_wh: ", here about {v} burner hours a year",
    room_d1: "Lower the normal temperature by 1 K",
    room_d2: "watch for a week whether all rooms stay warm enough",
    room_a: "Normal temperature",
    curve_t: "Heating curve: level {v} K",
    curve_s: "target at 0 °C: {s} °C",
    curve_g: "more condensing",
    curve_e1: "Target at 0 °C",
    curve_e2: "Actual at 0 °C",
    curve_e3: "Slope",
    curve_w:
      "The cooler the water returns, the more heat a condensing boiler gets from the flue gas. A high curve wastes that and overheats on mild days.",
    curve_d1: "Lower the level in steps of 2 K, every 3–4 days",
    curve_d2: "stop as soon as the coldest room no longer gets warm",
    curve_a: "Heating curve level",
    circ_t: "Circulation runs {v} h a day",
    circ_s: "{n} runs a day",
    circ_g: "−{v} h running/day",
    circ_e1: "Running per day",
    circ_e2: "Runs per day",
    circ_e3: "Goal",
    circ_w: "Every hour of circulation cools the cylinder through the pipes and costs pump power.",
    circ_d1: "Limit the circulation time program to 6–8 and 18–22 h",
    summer_t: "Heating circuit runs in summer weather",
    summer_s: "Ø {v} °C outdoors over the last 3 days",
    summer_g: "pump power, losses",
    summer_e1: "Ø outdoor (3 days)",
    summer_e2: "Heating pump",
    summer_e3: "Burner hours (3 days)",
    summer_w: "Above about 16 °C daily mean the house needs no heating any more; hot water only.",
    summer_d1: "Switch to hot water only / summer mode",
    where_wolf: "At the Wolf controller or by the installer; the integration can only read.",
    where_vicare: "In the ViCare app or at the controller.",
    where_service: "By the installer.",
    on: "on",
    goal_circ: "≤ 6 h",
    ok_takt: "Cycling calm · Ø {m} min",
    ok_ww: "Hot water charges rarely",
    ok_solar: "Solar contributes",
    ok_avail: "Cloud {v} % reachable",
    ok_curve: "Flow follows the weather",
  },
};

export const tipText =
  (lang) =>
  (key, vars = {}) =>
    String(S[lang]?.[key] ?? S.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const domainOf = (id) => (id ? id.split(".")[0] : "");

/**
 * Tips and "no findings" for one heating.
 * x: { lang, h (readHeating), e (roles), d (card data), curves (set curves or null), num (id → number),
 *      warn, good (cycling limits), platform }
 * → { tips: [{ id, sev, title, short, gain, ev, why, todo, where, action }], ok: [text] }
 */
export function buildTips(x) {
  const { lang, h, e, d, curves, num, platform } = x;
  const tt = tipText(lang);
  const n = (v, digits = 0) => fmtNum(v, lang, digits);
  const where = platform === "wolflink" ? tt("where_wolf") : tt("where_vicare");
  const tips = [];
  const ok = [];
  const s = d?.summary;
  const warn = x.warn ?? 5;
  const good = x.good ?? 10;

  // 1. Cycling
  if (s && s.min < good) {
    const todo = [tt("takt_d1")];
    if (e.burner_hours_2) todo.push(tt("takt_d2"));
    if (d.charge && d.charge.perDay > 4) todo.push(tt("takt_d3"));
    if (s.min < warn) todo.push(tt("takt_d4"));
    const life = num(e.burner_starts);
    const less = Math.max(0, s.perDay - 30) * 365;
    tips.push({
      id: "takt",
      sev: s.min < warn ? "warn" : "mid",
      title: tt("takt_t", { m: n(s.min, 1) }),
      short: tt("takt_s", { n: n(s.perDay), goal: 30 }),
      gain: less ? tt("takt_g", { v: n(Math.round(less / 1000) * 1000) }) : "",
      ev: [
        [tt("takt_e1"), n(s.perDay)],
        [tt("takt_e2"), `${n(s.min, 1)} min`],
        ...(life !== null ? [[tt("takt_e3"), n(life)]] : []),
      ],
      why: tt("takt_w"),
      todo,
      where: platform === "wolflink" ? where : tt("where_service"),
    });
  } else if (s) ok.push(tt("ok_takt", { m: n(s.min, 1) }));

  // 2. Hot-water charges
  const c = d?.charge;
  if (c && c.perDay > 4) {
    const target = h.dhw.target;
    const settable = domainOf(e.dhw_target) === "number" && target !== null;
    tips.push({
      id: "ww",
      sev: "mid",
      title: tt("ww_t", { n: n(c.perDay, 1) }),
      short: tt("ww_s"),
      gain: tt("ww_g", { v: n(Math.max(1, Math.round(c.perDay - 3))) }),
      ev: [
        [tt("ww_e1"), n(c.perDay, 1)],
        [tt("ww_e2"), `${n(c.minPerRun)} min`],
        ...(target !== null ? [[tt("ww_e3"), `${n(target)} °C`]] : []),
      ],
      why: tt("ww_w"),
      todo: [tt("ww_d1"), tt("ww_d2")],
      where,
      action: settable
        ? { entity: e.dhw_target, label: tt("ww_e3"), from: target, to: Math.max(50, target - 5), unit: "°C" }
        : null,
    });
  } else if (c) ok.push(tt("ok_ww"));

  // 3. Weather compensation (only without a reported curve: there the curve itself is the reference)
  const cp = d?.hours ? curvePoints(d.hours) : null;
  if (cp?.fit && !curves) {
    const xs = cp.pts.map((p) => p.x);
    const spread = Math.max(...xs) - Math.min(...xs);
    if (spread >= 4 && cp.fit.b > -0.3)
      tips.push({
        id: "flat",
        sev: "mid",
        title: tt("flat_t"),
        short: tt("flat_s", { f: n(cp.fit.a), b: n(Math.max(0, -cp.fit.b), 2) }),
        gain: tt("flat_g"),
        ev: [
          [tt("flat_e1"), `≈ ${n(cp.fit.a)} °C`],
          [tt("flat_e2"), `${n(Math.max(0, -cp.fit.b), 2)} K`],
          [tt("flat_e3"), `${n(Math.min(...xs))}…${n(Math.max(...xs))} °C`],
        ],
        why: tt("flat_w"),
        todo: [tt("flat_d1"), tt("flat_d2")],
        where,
      });
    else if (spread >= 4) ok.push(tt("ok_curve"));
  }

  // 4. Room target (ViCare normal temperature)
  const rt = num(e.normal_temp);
  if (rt !== null && rt > 21) {
    const year = (d?.months || []).slice(1).reduce((a, m) => a + (m.hours ?? 0), 0);
    const reduced = num(e.reduced_temp);
    tips.push({
      id: "room",
      sev: "mid",
      title: tt("room_t", { v: n(rt) }),
      short: tt("room_s"),
      gain: tt("room_g"),
      ev: [
        [tt("room_e1"), `${n(rt)} °C`],
        ...(reduced !== null ? [[tt("room_e2"), `${n(reduced)} °C`]] : []),
        ...(year ? [[tt("room_e3"), `≈ ${n(year)} h`]] : []),
      ],
      why: tt("room_w", { h: year ? tt("room_wh", { v: n(Math.round((year * 0.06) / 10) * 10) }) : "" }),
      todo: [tt("room_d1"), tt("room_d2")],
      action:
        domainOf(e.normal_temp) === "number"
          ? { entity: e.normal_temp, label: tt("room_a"), from: rt, to: rt - 1, unit: "°C" }
          : null,
    });
  }

  // 5. Heating curve level (ViCare)
  if (curves && (curves.shift > 5 || curves.normal(0) > 55)) {
    const actual = cp?.fit ? cp.fit.a : null;
    tips.push({
      id: "curve",
      sev: "mid",
      title: tt("curve_t", { v: `${curves.shift > 0 ? "+" : ""}${n(curves.shift)}` }),
      short: tt("curve_s", { s: n(curves.normal(0)) }),
      gain: tt("curve_g"),
      ev: [
        [tt("curve_e1"), `${n(curves.normal(0))} °C`],
        ...(actual !== null ? [[tt("curve_e2"), `≈ ${n(actual)} °C`]] : []),
        [tt("curve_e3"), n(curves.slope, 1)],
      ],
      why: tt("curve_w"),
      todo: [tt("curve_d1"), tt("curve_d2")],
      action:
        domainOf(e.curve_shift) === "number"
          ? { entity: e.curve_shift, label: tt("curve_a"), from: curves.shift, to: curves.shift - 2, unit: "K" }
          : null,
    });
  }

  // 6. Circulation
  const ci = d?.circ;
  if (ci && ci.hoursPerDay > 6)
    tips.push({
      id: "circ",
      sev: "mid",
      title: tt("circ_t", { v: n(ci.hoursPerDay, 1) }),
      short: tt("circ_s", { n: n(ci.perDay) }),
      gain: tt("circ_g", { v: n(Math.max(1, ci.hoursPerDay - 4)) }),
      ev: [
        [tt("circ_e1"), `${n(ci.hoursPerDay, 1)} h`],
        [tt("circ_e2"), n(ci.perDay)],
        [tt("circ_e3"), tt("goal_circ")],
      ],
      why: tt("circ_w"),
      todo: [tt("circ_d1")],
      where,
    });

  // 7. Summer weather, heating circuit still on
  const last3 = (d?.days || []).filter((r) => !r.today).slice(-3);
  const t3 =
    last3.length === 3 && last3.every((r) => r.temp !== null) ? last3.reduce((a, r) => a + r.temp, 0) / 3 : null;
  const heatingPump = h.pumps.find((p) => p.key === "pump_heating" || p.key === "pump_mixer");
  if (t3 !== null && t3 > 16 && heatingPump?.on)
    tips.push({
      id: "summer",
      sev: "mid",
      title: tt("summer_t"),
      short: tt("summer_s", { v: n(t3, 1) }),
      gain: tt("summer_g"),
      ev: [
        [tt("summer_e1"), `${n(t3, 1)} °C`],
        [tt("summer_e2"), tt("on")],
        [tt("summer_e3"), `${n(last3.reduce((a, r) => a + (r.hours ?? 0), 0))} h`],
      ],
      why: tt("summer_w"),
      todo: [tt("summer_d1")],
      where,
    });

  // No findings that are worth a line
  if (d?.days?.some((r) => (r.solar ?? 0) > 1)) ok.push(tt("ok_solar"));
  if (d?.avail !== null && d?.avail !== undefined && d.avail >= 0.97)
    ok.push(tt("ok_avail", { v: n(d.avail * 100, 1) }));
  return { tips, ok };
}
