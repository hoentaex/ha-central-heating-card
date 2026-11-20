// KPI tiles, as in the tiles view of the energy card's consumers card (and the oil card): a round icon, the label
// under it, the value large with a small unit, then a sub line, a small curve and/or a thin bar with a marker.
// Tiles without a value are left out; the grid never shows a gap: a tile that would not fit the rest of a row and
// the last tile of a short row widen until the row is full. Classes are kt* (the card's own .kpi is the efficiency
// section).
import { svgIcon } from "./icons.js";
import { esc } from "./shared.js";

/**
 * Column spans so every row is full. `spans` are the wished spans (1 or 2) in order; a tile that does not fit the
 * rest of its row moves to the next one (as CSS grid does) and the tile before it takes the free columns instead.
 */
export function fillRows(spans, cols) {
  const out = spans.map((s) => Math.max(1, Math.min(cols, s)));
  let used = 0;
  for (let i = 0; i < out.length; i++) {
    if (used + out[i] > cols) {
      out[i - 1] += cols - used;
      used = 0;
    }
    used = (used + out[i]) % cols;
  }
  if (used > 0 && out.length) out[out.length - 1] += cols - used;
  return out;
}

const pct = (v) => Math.max(0, Math.min(100, v));

/** A small area chart of `values` (nulls skipped), scaled to its own range; null with fewer than two points. */
export function sparkPath(values) {
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => Number.isFinite(v));
  if (pts.length < 2) return null;
  const vs = pts.map(([, v]) => v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = hi - lo || 1;
  const n = values.length - 1 || 1;
  const xy = pts.map(([i, v]) => `${((i / n) * 100).toFixed(1)},${(28 - ((v - lo) / span) * 24).toFixed(1)}`);
  const x0 = ((pts[0][0] / n) * 100).toFixed(1);
  const x1 = ((pts.at(-1)[0] / n) * 100).toFixed(1);
  return { line: `M${xy.join(" L")}`, area: `M${x0},30 L${xy.join(" L")} L${x1},30Z` };
}

/**
 * One tile. `k` label, `v` value (HTML-escaped here), `u` unit, `icon`, `c` colour, `p` bar 0–100, `m` marker 0–100,
 * `s` sub line, `sp` values for a small curve, `d` badge HTML, `st` "warn" | "bad", `more` entity for Home Assistant's
 * dialog.
 */
const tile = (x, s2, s3) => {
  const tag = x.more ? "button" : "div";
  const attrs = x.more ? ` type="button" data-more="${esc(x.more)}"` : "";
  const sp = x.sp ? sparkPath(x.sp) : null;
  return `<${tag} class="kt${x.st ? ` ${x.st}` : ""}${x.wide ? " wide" : ""}${sp ? " has-sp" : ""}"${attrs} data-kt="${esc(x.key || "")}" style="--c:${x.c};--s2:${s2};--s3:${s3}">
    <span class="ki">${svgIcon(x.icon)}</span>
    <span class="kk">${esc(x.k)}</span>
    <span class="kv num">${esc(x.v)}${x.u ? `<small>${esc(x.u)}</small>` : ""}${x.d ? ` ${x.d}` : ""}</span>
    ${x.s ? `<span class="ks">${esc(x.s)}</span>` : ""}
    ${sp ? `<svg class="ksp" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${sp.area}"/><path class="l" d="${sp.line}"/></svg>` : ""}
    ${Number.isFinite(x.p) ? `<span class="kb"><i style="width:${pct(x.p).toFixed(1)}%"></i>${Number.isFinite(x.m) ? `<b style="left:${pct(x.m).toFixed(1)}%"></b>` : ""}</span>` : ""}
  </${tag}>`;
};

/**
 * A grid of tiles: three columns (two on a narrow card) or always two (`cols: 2`). Tiles whose value is null,
 * undefined or empty are dropped before the layout, so nothing leaves a hole.
 */
export function kpiGrid(list, { cols = 3 } = {}) {
  const tiles = list.filter((x) => x && x.v !== null && x.v !== undefined && x.v !== "");
  if (!tiles.length) return "";
  const want = tiles.map((x) => (x.wide ? 2 : 1));
  const two = fillRows(want, 2);
  const three = cols === 3 ? fillRows(want, 3) : two;
  return `<div class="kts c${cols}">${tiles.map((x, i) => tile(x, two[i], three[i])).join("")}</div>`;
}

export const KPI_STYLE = `
.kts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.kts.c3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.kts .kt { grid-column: span var(--s2); }
.kts.c3 .kt { grid-column: span var(--s3); }
.kt { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; padding: 11px 12px 12px;
      border: 0; border-radius: 12px; background: var(--chc-tile); color: inherit; font: inherit; text-align: left; }
button.kt { cursor: pointer; }
button.kt:hover { filter: brightness(1.04); }
.kt .ki { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; margin-bottom: 2px;
          color: color-mix(in srgb, var(--c) 82%, var(--chc-text)); background: color-mix(in srgb, var(--c) 18%, var(--chc-card)); }
.kt .ki .icon { width: 18px; height: 18px; }
.kt .kk { font-size: 12.5px; line-height: 1.3; color: var(--chc-sub); }
.kt .kv { font-size: 22px; font-weight: 500; line-height: 1.15; overflow-wrap: anywhere; }
.kt.wide .kv { font-size: 28px; }
.kt .kv small { display: inline-block; white-space: nowrap; font-size: 12px; font-weight: 400; color: var(--chc-sub); margin-left: 4px; }
.kt .kv .badge { vertical-align: middle; font-size: 11px; }
.kt .ks { font-size: 11.5px; line-height: 1.35; color: var(--chc-sub); }
.kt .kb { position: relative; align-self: stretch; height: 4px; margin-top: auto; border-radius: 2px; background: color-mix(in srgb, var(--chc-sub) 25%, transparent); }
.kt .ks + .kb, .kt .kv + .kb { margin-top: 6px; }
.kt .kb i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: var(--c); }
.kt .kb b { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; border-radius: 1px; background: var(--chc-text); opacity: .7; }
.kt .ksp { align-self: stretch; width: calc(100% + 24px); height: 30px; margin: auto -12px -12px; display: block; }
.kt .ksp .a { fill: color-mix(in srgb, var(--c) 18%, transparent); }
.kt .ksp .l { fill: none; stroke: var(--c); stroke-width: 1.5; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.kt.warn, .kt.bad { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent); background: color-mix(in srgb, var(--c) 8%, var(--chc-tile)); }
.kt.warn .kv, .kt.bad .kv { color: color-mix(in srgb, var(--c) 70%, var(--chc-text)); }
@container (max-width: 360px) {
  .kts.c3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kts.c3 .kt { grid-column: span var(--s2); }
  .kt.wide .kv { font-size: 24px; }
}
.kts + .hint { margin-top: 10px; }
.panel .kt { background: var(--chc-card); }
.panel .kt .ki { background: color-mix(in srgb, var(--c) 18%, var(--chc-tile)); }
.panel .kt.warn, .panel .kt.bad { background: color-mix(in srgb, var(--c) 8%, var(--chc-card)); }
`;
