// Illustrated header ("banner") in the style of juju35's cards: the title, the status pill and the subtitle on the sky
// at the left, the boiler drawn at the right (its display with the boiler temperature, the flame in its combustion
// window while the burner runs, flow and return pipes to a radiator with rising heat), and a 10 px ground strip in the
// state colour. Night picture with Home Assistant's dark theme.

/** Night picture: forced by illustration_theme, else Home Assistant's dark theme alone. */
export const isNight = (hass, config) => {
  if (config.illustration_theme === "night") return true;
  if (config.illustration_theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

/**
 * What the scene shows for a status of the card (statusOf in heating.js): the ground strip, whether the flame burns,
 * the water flows in the pipes and heat rises from the radiator, and whether the sky is warm.
 *   running: orange strip, flame, flow, heat · dhw: blue strip, flame while the burner runs, flow, no heat at the
 *   radiator (the hot water tank is charged) · idle: grey, nothing moves · offline: grey, display dashes.
 */
export function sceneState(status, burnerOn) {
  switch (status) {
    case "running":
      return { ground: "heat", flame: true, flow: true, heat: true, warm: true };
    case "dhw":
      return { ground: "water", flame: !!burnerOn, flow: true, heat: false, warm: !!burnerOn };
    case "offline":
      return { ground: "off", flame: false, flow: false, heat: false, warm: false };
    default:
      return { ground: "off", flame: false, flow: false, heat: false, warm: false };
  }
}

/** The boiler's head strip: Wolf red, else a neutral silver with an orange line (Viessmann, others). */
const HEADS = {
  wolflink: '<path class="hb-head wolf" d="M145 6H179A5 5 0 0 1 184 11V12H140V11A5 5 0 0 1 145 6Z"/>',
  default:
    '<path class="hb-head neutral" d="M145 6H179A5 5 0 0 1 184 11V13H140V11A5 5 0 0 1 145 6Z"/><rect class="hb-line" x="140" y="13" width="44" height="1.2"/>',
};

/**
 * The scene, 200 × 80: radiator with heat waves, flow (red) and return (blue) pipes, the boiler with its head, display
 * and combustion window, and the readout (flow temperature) drawn last. `level` (0 … 1) sizes the flame.
 */
export function sceneSVG({ platform, state, level = 0.7, display, readout, readoutLabel, animate }) {
  const anim = animate ? " anim" : "";
  const sc = (0.7 + 0.3 * Math.min(1, Math.max(0, level))).toFixed(2);
  const heat = state.heat
    ? [72, 83, 94]
        .map(
          (x, i) =>
            `<path class="hb-heat${anim}" style="animation-delay:${(i * 0.8).toFixed(1)}s" d="M${x} 46q2 -3 0 -6t0 -6"/>`,
        )
        .join("")
    : "";
  const radiator = [0, 1, 2, 3, 4, 5]
    .map((k) => `<rect class="hb-rad" x="${66 + k * 6}" y="50" width="5" height="26" rx="2"/>`)
    .join("");
  const flow = state.flow
    ? `<path class="hb-flow${anim}" d="M154 62V70H101"/><path class="hb-flow${anim}" d="M101 75H170V62"/>`
    : "";
  const flame = state.flame
    ? `<g class="hb-flame${anim}" transform="translate(162 49) scale(${sc}) translate(-162 -49)">
        <path class="hb-f1" d="M162 37C166 41 168 44 166.5 48A4.8 4.8 0 0 1 157.5 48C156 45 158 42 160 40C160 43 161 44 162 44C162 41 161 39 162 37Z"/>
        <path class="hb-f2" d="M162 43C163.8 45 164.3 46.6 163.4 48.2A1.9 1.9 0 0 1 160.6 48.2C160 47 160.8 45.2 162 43Z"/>
      </g>`
    : '<path class="hb-pilot" d="M159 49h6"/>';
  return `<svg class="scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <g class="hb-stars"><circle cx="80" cy="10" r=".9"/><circle cx="104" cy="22" r=".8"/><circle cx="118" cy="6" r=".9"/></g>
    ${heat}
    ${radiator}
    <line class="hb-leg" x1="70" y1="76" x2="70" y2="80"/><line class="hb-leg" x1="96" y1="76" x2="96" y2="80"/>
    <path class="hb-pipe red" d="M154 62V70H101"/><path class="hb-pipe blue" d="M170 62V75H101"/>
    ${flow}
    <rect class="hb-flue" x="156" y="0" width="12" height="7"/>
    <rect class="hb-body" x="140" y="6" width="44" height="56" rx="5"/>
    ${HEADS[platform] || HEADS.default}
    <rect class="hb-disp" x="148" y="18" width="28" height="11" rx="2"/>
    <text class="hb-disp-t" x="162" y="26.2" text-anchor="middle">${display}</text>
    <circle class="hb-win" cx="162" cy="45" r="9"/>
    ${flame}
    ${readout ? `<text class="hb-rd" x="134" y="24" text-anchor="end">${readout}</text>` : ""}
    ${readout && readoutLabel ? `<text class="hb-rd2" x="134" y="32" text-anchor="end">${readoutLabel}</text>` : ""}
  </svg>`;
}

/**
 * The status pill in the banner: right after the title when the title and the whole pill fit on that row, else on its
 * own line under the subtitle; when even that runs into the ground strip, its dot alone. Measured after each render.
 */
export function fitPill(root) {
  for (const t of root?.querySelectorAll?.(".banner .titles") || []) {
    t.classList.remove("below", "dotonly");
    const name = t.querySelector(".name");
    const pill = t.querySelector(".pill");
    if (!name || !pill || !t.clientWidth) continue;
    if (name.scrollWidth + 8 + pill.scrollWidth <= t.clientWidth + 0.5) continue;
    t.classList.add("below");
    const floor = t.closest(".banner").getBoundingClientRect().bottom - 10 + 0.5;
    if (pill.getBoundingClientRect().bottom > floor) t.classList.add("dotonly");
  }
}

const TICK = (a) => `repeating-linear-gradient(90deg, rgba(255,255,255,${a}) 0 1px, transparent 1px 12px)`;

export const BANNER_STYLE = `
.banner { position: relative; overflow: hidden; height: 90px; --g: 10px; --sw: min(200px, 54cqw); color: #0d2a45; --sky-muted: #3b5b78;
          background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
.banner.warm { background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 40%, #f6e3d2 78%, #fbd7b7 100%); }
.banner.night { color: #fff; --sky-muted: rgba(255,255,255,.78); background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
.banner.night.warm { background: linear-gradient(90deg, #1b2f52 0%, #1a2846 45%, #3a2a2e 82%, #4a2c22 100%); }
.banner .scene { position: absolute; right: 0; bottom: var(--g); height: calc(100% - var(--g)); width: var(--sw); overflow: visible;
                 -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 12%, #000 42%);
                 mask-image: linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 12%, #000 42%); }
.banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g); }
.ground.heat { background-image: ${TICK(0.55)}, linear-gradient(90deg, #ffb36b, #e8572e); box-shadow: inset 0 2px 0 #ffcf9a; }
.night .ground.heat { background-image: ${TICK(0.25)}, linear-gradient(90deg, #7a3a1e, #5a2414); box-shadow: inset 0 2px 0 #8a4a2a; }
.ground.water { background-image: ${TICK(0.55)}, linear-gradient(90deg, #8fd8ea, #2fa3c4); box-shadow: inset 0 2px 0 #c2ecf6; }
.night .ground.water { background-image: ${TICK(0.22)}, linear-gradient(90deg, #1d4a58, #143844); box-shadow: inset 0 2px 0 #275b6b; }
.ground.off { background-image: ${TICK(0.55)}, linear-gradient(90deg, #d3d8de, #aab2bb); box-shadow: inset 0 2px 0 #e6e9ed; }
.night .ground.off { background-image: ${TICK(0.2)}, linear-gradient(90deg, #3a414b, #2b3139); box-shadow: inset 0 2px 0 #4a525d; }
.banner .head { position: absolute; z-index: 1; left: 0; top: 0; bottom: var(--g); right: calc(var(--sw) - 60px); display: flex; align-items: center;
                gap: 10px; padding: 8px 8px 8px 14px; min-width: 0; }
.banner .logo { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 28%, transparent); }
.banner.night .logo { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
.banner .titles { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: center; align-self: stretch; }
.banner .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
.banner .name { flex: 0 1 auto; min-width: 0; }
.banner .sub { font-size: 13px; color: var(--sky-muted); }
.banner .pill { flex: none; max-width: 100%; padding: 1px 8px; font-size: 11px; line-height: 16px; gap: 4px;
                background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
.banner.night .pill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #fff); }
.banner .pill .pl { display: inline; } .banner .pill .ps { display: none; }
.banner .titles.below .trow { display: contents; }
.banner .titles.below .pill { order: 9; align-self: flex-start; margin-top: 3px; }
.banner .titles.dotonly .pill { padding: 4px; } .banner .titles.dotonly .pill > span:last-child { display: none; }
.banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; width: 24px; height: 24px; border-radius: 50%; color: #33506b;
                background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
.banner .zoom .icon { width: 15px; height: 15px; }
.banner .zoom:hover { background: rgba(255,255,255,.75); color: #0d2a45; }
.banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
.banner.night .zoom:hover { background: rgba(255,255,255,.22); }
.banner:has(> .zoom) .scene { right: 34px; }
.banner:has(> .zoom) .head { right: calc(var(--sw) - 24px); }
.banner:has(> .zoom) .hb-rd, .banner:has(> .zoom) .hb-rd2 { display: none; }
.banner + .content { padding-top: 14px; }
@container (max-width: 280px) { .banner .scene { display: none; } .banner .head, .banner:has(> .zoom) .head { right: 30px; } }
@container (max-width: 200px) { .banner .pill { padding: 4px; } .banner .pill > span:last-child { display: none; } }
/* The scene */
.hb-stars { display: none; } .night .hb-stars { display: inline; }
.hb-stars circle { fill: #fff; animation: hb-blink 2.6s ease-in-out infinite; } .hb-stars circle:nth-child(2) { animation-delay: .9s; } .hb-stars circle:nth-child(3) { animation-delay: 1.7s; }
.hb-rad { fill: #fff; stroke: #c9d0d8; } .night .hb-rad { fill: #2e3746; stroke: #4a5568; }
.hb-leg { stroke: #8b96a3; stroke-width: 1.4; }
.hb-heat { fill: none; stroke: #ff8a3d; stroke-width: 1.4; stroke-linecap: round; opacity: .7; }
.hb-heat.anim { opacity: 0; animation: hb-rise 2.4s ease-out infinite; }
@keyframes hb-rise { 0% { transform: translateY(4px); opacity: 0; } 30% { opacity: .9; } 100% { transform: translateY(-10px); opacity: 0; } }
.hb-pipe { fill: none; stroke-width: 2.4; } .hb-pipe.red { stroke: #e8572e; } .hb-pipe.blue { stroke: #3d8bd8; }
.hb-flow { fill: none; stroke: rgba(255,255,255,.8); stroke-width: 1; stroke-dasharray: 2 5; }
.hb-flow.anim { animation: hb-flow 1s linear infinite; }
@keyframes hb-flow { to { stroke-dashoffset: -14; } }
.hb-flue { fill: #b9c1ca; } .night .hb-flue { fill: #4a5568; }
.hb-body { fill: #fff; stroke: #c4cbd3; } .night .hb-body { fill: #2e3746; stroke: #455066; }
.hb-head.wolf { fill: #d1202f; }
.hb-head.neutral { fill: #c9ced5; } .night .hb-head.neutral { fill: #5a6372; }
.hb-line { fill: #ff6a13; }
.hb-disp { fill: #12202e; }
.hb-disp-t { font: 700 8px var(--paper-font-body1_-_font-family, Roboto, sans-serif); fill: #ff9a3c; }
.hb-win { fill: #2a1a12; } .night .hb-win { fill: #170e09; }
.hb-pilot { stroke: #6b5a4e; stroke-width: 1.2; stroke-linecap: round; }
.hb-f1 { fill: #ff8a1f; } .hb-f2 { fill: #ffd34d; }
.hb-flame.anim path { transform-box: fill-box; transform-origin: 50% 100%; animation: hb-flick .5s ease-in-out infinite alternate; }
.hb-flame.anim .hb-f2 { animation-duration: .37s; }
@keyframes hb-flick { from { transform: scale(1, .9); } to { transform: scale(.94, 1.08); } }
@keyframes hb-blink { 50% { opacity: .25; } }
.hb-rd { font: 700 12px var(--paper-font-body1_-_font-family, Roboto, sans-serif); fill: #e07a10; } .night .hb-rd { fill: #ffb062; }
.hb-rd2 { font: 500 6.6px var(--paper-font-body1_-_font-family, Roboto, sans-serif); fill: #3b5b78; } .night .hb-rd2 { fill: rgba(255,255,255,.75); }
@media (prefers-reduced-motion: reduce) { .banner * { animation: none !important; } .hb-heat { opacity: .7 !important; } }
/* The now section without the burner tile, now drawn in the banner */
.now.flat { grid-template-columns: minmax(0, 1fr); }
.now.flat .tiles { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
/* The mini card under its banner */
.mrow { display: flex; align-items: center; gap: 12px; padding: 10px 16px 12px; min-width: 0; }
.mrow .mdetail { flex: 1; min-width: 0; }
`;
