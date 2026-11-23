// Margin grid: a quiet, boiling noise texture in the left and right margins on wide screens, a
// grayscale take on oddgrid. A square grid where a noise field lights up irregular islands of cells in three
// faint grays (--grid-1..3), some with a small dot (--grid-dot). Imported lazily by effects.ts from 64rem up.
// Design: docs/plans/2026-11-23-margin-grid-design.md.

const CELL = 10; // px, cell pitch
const GAP = 1; // px between cells
const TICK = 100; // ms per frame (~10fps, cells step like the oddgrid recording)
// Motion and sparsity are tuned to the oddgrid recording (measured on its 44x78 grid): ~10% of cells lit,
// ~1.3% flipping per frame, a cell stays lit ~1.1s (90% within ~2.5s), ~11 islands, no drift direction.
const SPEED = 0.045; // noise time per frame
const SCALE = 0.09; // noise lattice per cell
const LIT = 0.66; // noise above this lights a cell (~10%)
const STEP = 0.05; // each shade is this much further above LIT
const DOT_ABOVE = 0.09; // dots only in island cores...
const DOT_SHARE = 1 / 6; // ...on about 1 in 6 of those cells
const CLEAR_PAD = 2; // rem of empty band on each side of the text column
const FADE = 96; // px over which islands thin out toward the band

const wide = matchMedia("(min-width: 64rem)");
const still = matchMedia("(prefers-reduced-motion: reduce)");

// ?seed=<n> pins the pattern (screenshots); otherwise a new one per load.
const seedParam = Number(new URLSearchParams(location.search).get("seed"));
const SEED =
  Number.isFinite(seedParam) && seedParam > 0
    ? seedParam >>> 0
    : (Math.random() * 2 ** 32) >>> 0;

// Integer hash of a lattice point -> [0, 1). Seeded, no tables.
function hash(x: number, y: number, z: number) {
  let h =
    SEED ^
    Math.imul(x, 0x27d4eb2d) ^
    Math.imul(y, 0x165667b1) ^
    Math.imul(z, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 3D value noise in [0, 1]. Inlined corners: this runs for every margin cell, every frame.
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const x1 = xi + 1;
  const y1 = yi + 1;
  const z1 = zi + 1;
  const near = lerp(
    lerp(hash(xi, yi, zi), hash(x1, yi, zi), u),
    lerp(hash(xi, y1, zi), hash(x1, y1, zi), u),
    v,
  );
  const far = lerp(
    lerp(hash(xi, yi, z1), hash(x1, yi, z1), u),
    lerp(hash(xi, y1, z1), hash(x1, y1, z1), u),
    v,
  );
  return lerp(near, far, w);
}

// Two octaves: big islands with ragged edges. Returns -1 early when the cell can't reach `lit` even if the
// second octave were at its maximum, which skips most cells' second octave.
const OCT1 = 0.58;
const OCT2 = 0.42;
function field(cx: number, cy: number, t: number, lit: number) {
  const a = OCT1 * noise(cx * SCALE, cy * SCALE, t);
  if (a + OCT2 < lit) return -1;
  return a + OCT2 * noise(cx * SCALE * 2.5, cy * SCALE * 2.5, t * 1.6 + 17);
}

const canvas = document.createElement("canvas");
canvas.className = "margin-grid";
canvas.setAttribute("aria-hidden", "true");
canvas.dataset.frames = "0";
document.body.prepend(canvas);
const ctx = canvas.getContext("2d");

let t = 0;
let timer = 0;
let width = 0;
let height = 0;
let dpr = 1;
let clearLeft = 0; // the empty zone around the text column, in CSS px
let clearRight = 0;

function measure() {
  const root = document.documentElement;
  const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
  const column =
    parseFloat(getComputedStyle(root).getPropertyValue("--measure")) * rem ||
    544;
  width = root.clientWidth;
  height = innerHeight;
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const half = Math.min(width, column) / 2 + CLEAR_PAD * rem;
  clearLeft = width / 2 - half;
  clearRight = width / 2 + half;
}

function colors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string) => cs.getPropertyValue(name).trim();
  return [get("--grid-1"), get("--grid-2"), get("--grid-3"), get("--grid-dot")];
}

function draw() {
  if (!ctx) return;
  const start = performance.now();
  const [c1, c2, c3, dotColor] = colors();
  const shades: number[][] = [[], [], []]; // cell indices per shade, so each color is set once
  const dots: number[] = [];
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const x = cx * CELL;
      // Distance from the clear zone; skip cells inside it.
      const d =
        x + CELL <= clearLeft
          ? clearLeft - (x + CELL)
          : x >= clearRight
            ? x - clearRight
            : -1;
      if (d < 0) continue;
      const lit = LIT + (d < FADE ? (1 - d / FADE) * 0.15 : 0);
      const v = field(cx, cy, t, lit);
      if (v < lit) continue;
      const shade = v >= lit + 2 * STEP ? 2 : v >= lit + STEP ? 1 : 0;
      shades[shade].push(cx, cy);
      if (v >= lit + DOT_ABOVE && hash(cx, cy, -1) < DOT_SHARE)
        dots.push(cx, cy);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = Math.max(1, Math.round((CELL - GAP) * dpr));
  [c1, c2, c3].forEach((color, i) => {
    ctx.fillStyle = color;
    const list = shades[i];
    for (let k = 0; k < list.length; k += 2) {
      ctx.fillRect(
        Math.round(list[k] * CELL * dpr),
        Math.round(list[k + 1] * CELL * dpr),
        size,
        size,
      );
    }
  });
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  const r = size * 0.2;
  for (let k = 0; k < dots.length; k += 2) {
    const px = Math.round(dots[k] * CELL * dpr) + size / 2;
    const py = Math.round(dots[k + 1] * CELL * dpr) + size / 2;
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, Math.PI * 2);
  }
  ctx.fill();
  canvas.dataset.frames = String(Number(canvas.dataset.frames) + 1);
  canvas.dataset.ms = (performance.now() - start).toFixed(2); // frame cost, for tuning and tests
}

function tick() {
  draw();
  t += SPEED;
  timer = window.setTimeout(tick, TICK);
}

function stop() {
  window.clearTimeout(timer);
  timer = 0;
}

// Run while the window is wide and the tab visible; one still frame with reduced motion.
function update() {
  stop();
  canvas.hidden = !wide.matches;
  if (!wide.matches) return;
  measure();
  if (still.matches || document.visibilityState === "hidden") draw();
  else tick();
}

let resizeTimer = 0;
addEventListener("resize", () => {
  stop();
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(update, 150);
});
wide.addEventListener("change", update);
still.addEventListener("change", update);
document.addEventListener("visibilitychange", update);
// Recolor right away on a theme change (matters when still).
new MutationObserver(() => timer || draw()).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  () => timer || draw(),
);

update();

export {};
