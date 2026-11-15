// Short texts of the "now" section, kept apart from the custom elements so they can be tested in Node.
import { fmtNum, fmtTemp, fmtTime } from "./shared.js";

/** Text below the burner: modulation and running time, or since when it is off. */
export function burnerDetail(b, now, lang, tz, t) {
  if (b.on === null) return "";
  const parts = [];
  if (b.on) {
    if (b.modulation !== null) parts.push(t("modulation", { v: fmtNum(b.modulation, lang) }));
    if (b.since) {
      const min = Math.max(0, Math.round((now - b.since) / 60e3));
      parts.push(min < 120 ? t("since_min", { n: min }) : t("since", { time: fmtTime(b.since, lang, tz) }));
    }
  } else if (b.since) parts.push(t("off_since", { time: fmtTime(b.since, lang, tz) }));
  return parts.join(" · ");
}

/** "Soll 51 °C · 2,0 K darunter" for a tile with a target. */
export function targetLine(v, target, label, lang, t) {
  if (target === null) return "";
  const head = t(label, { v: `${fmtTemp(target, lang)} °C` });
  if (v === null) return head;
  const d = Math.round((v - target) * 10) / 10;
  if (Math.abs(d) < 0.5) return `${head} · ${t("reached")}`;
  return `${head} · ${t(d < 0 ? "below" : "above", { v: fmtNum(Math.abs(d), lang, 1) })}`;
}
