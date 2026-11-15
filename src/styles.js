// Styles of both cards. Colors come from the HA theme; the accent colors are --chc-* variables with defaults.
// Colored text is mixed with the theme's text color so it stays readable on light and dark themes.

export const STYLE = `
:host {
  display: block;
  --chc-heat: var(--chc-heat-color, #ff7a45);
  --chc-water: var(--chc-water-color, #3fb8d4);
  --chc-good: var(--chc-good-color, #5fd08a);
  --chc-warn: var(--chc-warn-color, #ff8f8f);
  --chc-mid: var(--chc-mid-color, #f0b44b);
  --chc-temp: var(--chc-temp-color, #6ea8ff);
  --chc-solar: var(--chc-solar-color, #e8b52e);
  --chc-text: var(--primary-text-color, #212121);
  --chc-sub: var(--secondary-text-color, #727272);
  --chc-card: var(--ha-card-background, var(--card-background-color, #fff));
  --chc-tile: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
  --chc-line: var(--divider-color, rgba(127, 127, 127, 0.25));
  --chc-accent: var(--primary-color, #03a9f4);
}
ha-card { overflow: hidden; container-type: inline-size; color: var(--chc-text); }
.icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
.num { font-variant-numeric: tabular-nums; }

/* header */
.header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 12px; }
.logo { width: 40px; height: 40px; border-radius: 50%; flex: none; display: grid; place-items: center; color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); overflow: hidden; }
.logo .fire { width: 26px; height: 34px; }
.titles { flex: 1 1 0; min-width: 72px; }
.name { font-size: 16px; font-weight: 500; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub { font-size: 12px; color: var(--chc-sub); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pill { flex: 0 1 auto; min-width: 0; max-width: 55%; overflow: hidden; display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap; background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 62%, var(--chc-text)); }
.pill > span:last-child { overflow: hidden; text-overflow: ellipsis; }
.pill .ps { display: none; }
@container (max-width: 420px) { .pill .pl { display: none; } .pill .ps { display: inline; } }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; display: inline-block; }

.content { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 20px; }
.section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--chc-sub); margin-bottom: 10px; }
.section-title .icon { width: 16px; height: 16px; }
.section-title .note { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 400; font-size: 12px; }
.empty { font-size: 13px; color: var(--chc-sub); padding: 4px 0; display: flex; gap: 8px; align-items: flex-start; }
.empty .icon { color: var(--chc-warn); }
.hint { font-size: 12px; color: var(--chc-sub); line-height: 1.45; }

/* now: burner + temperature tiles */
.now { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 14px; align-items: stretch; }
.burner { border-radius: 14px; background: var(--chc-tile); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px 8px; text-align: center; min-width: 0; }
.burner.on { background: radial-gradient(120% 90% at 50% 100%, color-mix(in srgb, var(--chc-heat) 26%, var(--chc-tile)), var(--chc-tile) 70%); }
.burner .bt { font-size: 14px; font-weight: 500; }
.burner.on .bt { color: color-mix(in srgb, var(--chc-heat) 70%, var(--chc-text)); }
.burner .bs { font-size: 11px; color: var(--chc-sub); line-height: 1.35; }
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tile { background: var(--chc-tile); border-radius: 12px; padding: 9px 11px; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.tile .k { font-size: 12px; color: var(--chc-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile .v { font-size: 20px; font-weight: 500; line-height: 1.15; white-space: nowrap; }
.tile .v small { font-size: 12px; color: var(--chc-sub); font-weight: 400; margin-left: 3px; }
.tile .s { font-size: 11px; color: var(--chc-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 14px; }
.meter { height: 4px; border-radius: 2px; background: var(--chc-line); position: relative; margin-top: 3px; }
.meter i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: var(--c); }
.meter b { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; border-radius: 1px; background: var(--chc-text); }
.pumps { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.pump { --c: var(--chc-sub); display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 12px; background: var(--chc-tile); color: var(--chc-sub); }
.pump.on { --c: var(--chc-water); color: color-mix(in srgb, var(--chc-water) 62%, var(--chc-text)); background: color-mix(in srgb, var(--chc-water) 13%, transparent); }
.pump.unknown { opacity: .55; }
.anim .pump.on .dot { animation: chc-pulse 1.8s ease-in-out infinite; }
@keyframes chc-pulse { 50% { opacity: .35; } }
.room { margin-top: 8px; }
.room s { text-decoration-color: color-mix(in srgb, var(--chc-warn) 70%, transparent); }
@container (max-width: 400px) {
  .now { grid-template-columns: minmax(0, 1fr); }
  .burner { flex-direction: row; justify-content: flex-start; text-align: left; gap: 12px; }
  .burner .fire { width: 40px; height: 52px; }
}

/* burner panel */
.panel { border-radius: 12px; padding: 14px 16px; background: var(--chc-tile); display: flex; flex-direction: column; gap: 10px; }
.seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 14px; background: color-mix(in srgb, var(--chc-text) 5%, transparent); }
.seg button { font: inherit; color: inherit; font-size: 13px; font-weight: 500; border: 0; border-radius: 10px; min-height: 36px; cursor: pointer; padding: 0 6px; background: transparent; }
.seg button:hover:not([aria-pressed="true"]) { background: color-mix(in srgb, var(--chc-text) 8%, transparent); }
.seg button[aria-pressed="true"] { background: var(--chc-heat); color: #1d0e06; }
.seg button:focus-visible { outline: 2px solid var(--chc-accent); outline-offset: 2px; }
/* Always exactly two lines (value, then details) so nothing jumps while scrubbing. */
.readout { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; height: 50px; min-width: 0; }
.readout > span { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.readout .v { font-size: 24px; font-weight: 500; line-height: 1.2; }
.readout .v small { font-size: 13px; color: var(--chc-sub); font-weight: 400; margin-left: 4px; }
.readout .k { font-size: 12px; color: var(--chc-sub); }
.plot { position: relative; height: 150px; touch-action: pan-y; cursor: crosshair; }
.plot svg { display: block; width: 100%; height: 100%; overflow: visible; }
.plot .grid { stroke: var(--chc-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
.plot .bar { fill: color-mix(in srgb, var(--chc-sub) 40%, transparent); }
.plot .bar.heat { fill: color-mix(in srgb, var(--chc-heat) 75%, transparent); }
.plot .bar.warn { fill: color-mix(in srgb, var(--chc-warn) 55%, transparent); }
.plot .bar.mid { fill: color-mix(in srgb, var(--chc-mid) 55%, transparent); }
.plot .bar.good { fill: color-mix(in srgb, var(--chc-good) 55%, transparent); }
.plot .bar.solar { fill: color-mix(in srgb, var(--chc-solar) 80%, transparent); }
.plot .bar.partial { fill-opacity: .5; }
.plot .bar.prev { fill: color-mix(in srgb, var(--chc-sub) 40%, transparent); }
.plot polyline { fill: none; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.plot .run { stroke: var(--chc-text); }
.plot.tall { height: 180px; }
.plot .curve { stroke: var(--chc-heat); }
.plot .curve2 { stroke: var(--chc-heat); stroke-dasharray: 5 4; opacity: .8; }
.plot .fit { stroke: var(--chc-sub); stroke-dasharray: 2 3; }
.plot .water { stroke: var(--chc-water); }
.plot .target { stroke: var(--chc-sub); stroke-width: 1.2; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
.plot .pt { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; box-sizing: border-box; pointer-events: none; background: color-mix(in srgb, var(--chc-heat) 80%, transparent); }
.plot .pt.low { background: var(--chc-card); border: 1.5px solid var(--chc-heat); }
.plot .pt.on { width: 12px; height: 12px; margin: -6px 0 0 -6px; border: 2px solid var(--chc-text); }
.plot .ylab { position: absolute; left: 0; font-size: 10px; color: var(--chc-sub); transform: translateY(-110%); pointer-events: none; }
.plot .hdot { position: absolute; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; box-sizing: border-box; pointer-events: none; background: var(--chc-card); border: 2.5px solid var(--chc-text); }
.sw.fill { width: 10px; height: 10px; border-radius: 50%; background: var(--sw); }
.sw.ring { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--sw); box-sizing: border-box; }
.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.kpi { background: var(--chc-card); border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kpi .k { font-size: 12px; color: var(--chc-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi .v { font-size: 18px; font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-variant-numeric: tabular-nums; }
.kpi .p { font-size: 12px; color: var(--chc-sub); }
.badge { --c: var(--chc-temp); display: inline-block; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; white-space: nowrap;
         background: color-mix(in srgb, var(--c) 16%, transparent); color: color-mix(in srgb, var(--c) 62%, var(--chc-text)); }
.badge.mid { --c: var(--chc-mid); } .badge.good { --c: var(--chc-good); } .badge.warn { --c: var(--chc-warn); }
@container (max-width: 360px) { .kpis { grid-template-columns: minmax(0, 1fr); } }
.kpis.flat .kpi { background: var(--chc-tile); }
.kpi .v small { font-size: 12px; color: var(--chc-sub); font-weight: 400; }
.badge.solar { --c: var(--chc-solar); }

/* footer */
.footer { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 12px 8px; border-top: 1px solid var(--chc-line); padding-top: 14px; }
.footer .k { font-size: 12px; color: var(--chc-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.footer .v { font-size: 15px; font-weight: 500; margin-top: 2px; font-variant-numeric: tabular-nums; }
.footer .d { font-size: 11px; margin-top: 1px; color: var(--chc-sub); }
.footer .d.warn { color: color-mix(in srgb, var(--chc-warn) 62%, var(--chc-text)); }
.plot .temp { stroke: var(--chc-temp); stroke-dasharray: 3 3; }
.plot .mark { position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; box-sizing: border-box; pointer-events: none; background: var(--chc-card); border: 2px solid var(--chc-text); }
.plot .hl { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--chc-sub); pointer-events: none; }
.axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--chc-sub); font-variant-numeric: tabular-nums; min-height: 14px; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--chc-sub); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.sw { display: inline-block; flex: none; }
.sw.bar { width: 12px; height: 12px; border-radius: 3px; background: var(--sw); }
.sw.line { width: 16px; height: 2px; border-radius: 1px; background: var(--sw); }
.sw.dash { width: 16px; height: 0; border-top: 2px dashed var(--sw); }
.scale { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; height: 8px; position: relative; margin-top: 2px; }
.scale i { border-radius: 4px; }
.scale i:nth-child(1) { background: color-mix(in srgb, var(--chc-warn) 55%, transparent); }
.scale i:nth-child(2) { background: color-mix(in srgb, var(--chc-mid) 55%, transparent); }
.scale i:nth-child(3) { background: color-mix(in srgb, var(--chc-good) 55%, transparent); }
.scale b { position: absolute; top: -4px; bottom: -4px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: var(--chc-text); }
.scalelbl { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 11px; color: var(--chc-sub); }
.scalelbl span:nth-child(2) { text-align: center; }
.scalelbl span:nth-child(3) { text-align: right; }
.spark { width: 84px; height: 34px; flex: none; }
.spark rect { fill: color-mix(in srgb, var(--c) 45%, transparent); }
.spark rect.last { fill: var(--c); }
@container (max-width: 380px) { .spark { display: none; } }

/* flame */
.fire { width: 58px; height: 76px; overflow: visible; flex: none; }
.fire .f, .fire .glow, .fire .em { transform-box: fill-box; transform-origin: 50% 100%; }
.fire:not(.on) .outer { fill: color-mix(in srgb, var(--chc-sub) 22%, transparent); stroke: color-mix(in srgb, var(--chc-sub) 55%, transparent); stroke-width: 1.2; }
.fire:not(.on) .mid, .fire:not(.on) .core, .fire:not(.on) .glow { display: none; }
.fire .nozzle { fill: color-mix(in srgb, var(--chc-sub) 55%, transparent); }
.fire.on.anim .outer { animation: chc-fa 1.25s ease-in-out infinite; }
.fire.on.anim .mid { animation: chc-fb .85s ease-in-out infinite alternate; }
.fire.on.anim .core { animation: chc-fc .55s ease-in-out infinite alternate; }
.fire.on.anim .glow { animation: chc-glow 2.2s ease-in-out infinite; transform-origin: 50% 50%; }
.fire .em { fill: #ffc164; opacity: 0; animation: chc-em var(--d) ease-out var(--dl) infinite; transform-origin: 50% 50%; }
@keyframes chc-fa { 0%, 100% { transform: scale(1, 1) skewX(0); } 20% { transform: scale(.95, 1.06) skewX(2.5deg); } 45% { transform: scale(1.04, .94) skewX(-2deg); } 70% { transform: scale(.97, 1.05) skewX(1.5deg); } }
@keyframes chc-fb { 0% { transform: scale(1, .96) skewX(-2deg); } 50% { transform: scale(.94, 1.07) skewX(2deg); } 100% { transform: scale(1.03, 1) skewX(-1deg); } }
@keyframes chc-fc { 0% { transform: scale(1, .93); } 100% { transform: scale(.92, 1.08); } }
@keyframes chc-glow { 0%, 100% { opacity: .65; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes chc-em { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x), -46px) scale(.3); } }
@media (prefers-reduced-motion: reduce) {
  .fire .f, .fire .glow, .anim .pump.on .dot { animation: none !important; }
  .fire .em { display: none; }
}

/* mini card */
.mini { display: flex; align-items: center; gap: 14px; padding: 12px 16px; min-width: 0; }
.mini .logo { width: 44px; height: 44px; border-radius: 12px; }
.mmain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.mtop { display: flex; align-items: center; gap: 8px; min-width: 0; }
.mtop .name { flex: 0 1 auto; min-width: 0; }
.mtop .pill { flex: none; max-width: 70%; }
.mdetail { font-size: 13px; color: var(--chc-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.mdetail b { font-weight: 500; color: var(--chc-text); }
@container (max-width: 300px) { .mini .pill { display: none; } }
`;
