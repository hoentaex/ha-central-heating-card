// The burner flame: three layers (outer, middle, a blue-white core), a pulsing glow and a few rising sparks.
// Each layer flickers at its own pace (CSS in styles.js); the height follows the modulation. Off: a grey outline.

let seq = 0;

const SPARKS = [
  [25, 1.3, 1.7, 0, 6],
  [36, 1.1, 2.1, 0.6, -5],
  [31, 1.5, 1.9, 1.2, 3],
  [40, 1, 2.4, 0.3, -8],
  [23, 1, 2.2, 1.6, 8],
];

/** Scale of the flame for a level 0 … 1 (a small flame stays visible). */
export const flameScale = (level) => Math.round((0.62 + 0.38 * Math.min(1, Math.max(0, level))) * 100) / 100;

/** SVG markup. `small` drops the sparks (header logo, mini card). */
export function flameSVG({ on, level = 0.7, small = false, animate = true }) {
  const k = ++seq;
  const sc = on ? flameScale(level) : 0.8;
  const sparks =
    on && !small && animate
      ? SPARKS.map(
          ([x, r, d, dl, dx]) =>
            `<circle class="em" cx="${x}" cy="56" r="${r}" style="--d:${d}s;--dl:${dl}s;--x:${dx}px"></circle>`,
        ).join("")
      : "";
  return `<svg class="fire${on ? " on" : ""}${animate ? " anim" : ""}" viewBox="0 0 64 84" aria-hidden="true">
    <defs>
      <radialGradient id="chc-g${k}" cx="50%" cy="62%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"></stop><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"></stop></radialGradient>
      <linearGradient id="chc-o${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e2341a"></stop><stop offset=".5" stop-color="#ff6f1f"></stop><stop offset="1" stop-color="#ffb347" stop-opacity=".35"></stop></linearGradient>
      <linearGradient id="chc-m${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8a1f"></stop><stop offset=".6" stop-color="#ffc83c"></stop><stop offset="1" stop-color="#ffe28a" stop-opacity=".5"></stop></linearGradient>
      <linearGradient id="chc-c${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4f9dff"></stop><stop offset=".3" stop-color="#bfe0ff"></stop><stop offset=".6" stop-color="#fff6d8"></stop><stop offset="1" stop-color="#fff0b8" stop-opacity=".6"></stop></linearGradient>
    </defs>
    <ellipse class="glow" cx="32" cy="56" rx="31" ry="27" fill="url(#chc-g${k})"></ellipse>
    <g transform="translate(32 76) scale(${sc}) translate(-32 -76)">
      <path class="f outer" fill="url(#chc-o${k})" d="M32 6C35 18 46 24 48 40C50 54 46 70 32 76C18 70 14 56 16 44C17 36 22 31 24 24C27 30 28 34 31 36C29 26 29 16 32 6Z"></path>
      <path class="f mid" fill="url(#chc-m${k})" d="M32 22C35 31 42 37 42 50C42 62 38 71 32 74C26 71 22 63 22 53C22 46 26 42 28 36C29 41 30 44 32 45C31 38 30 30 32 22Z"></path>
      <path class="f core" fill="url(#chc-c${k})" d="M32 44C35 50 37 55 37 62C37 69 35 73 32 74C29 73 27 69 27 63C27 56 30 51 32 44Z"></path>
    </g>
    ${sparks}
    <rect class="nozzle" x="21" y="77" width="22" height="4" rx="2"></rect>
  </svg>`;
}
