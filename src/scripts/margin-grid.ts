// Margin grid: a boiling noise texture in the left and right margins on wide screens, after oddgrid. A square
// grid where a noise field lights up irregular islands of cells. At rest it's a barely-there grayscale version
// (--grid-1..3 by how deep in an island a cell is, dots --grid-dot). Cells near the mouse take oddgrid's own
// palette (--grid-hue-1..5 in patches, dots --grid-hue-dot), fading out with distance. Imported lazily by effects.ts
// from 64rem.
// Design: docs/plans/2026-11-23-margin-grid-design.md.

const CELL = 10; // px, cell pitch
const TICK = 100; // ms per frame (~10fps, cells step like the oddgrid recording)
// Motion: boils in place like the oddgrid recording (no drift direction), but ~4.5x slower so it stays calm: a
// cell stays lit ~5s, the field re-forms over ~10s. Much sparser than oddgrid on purpose: ~2% of cells lit, a few small islands.
const SPEED = 0.01; // noise time per frame: slow and calm (oddgrid itself is ~0.045)
const SCALE = 0.16; // noise lattice per cell: small islands
// Noise above the threshold lights a cell. The threshold is LIT at the screen edge and rises by EDGE_BIAS toward
// the text column, so islands sit out by the edges and almost never next to the text (oddgrid is 0.66 everywhere).
// It also rises by TOP_BIAS toward the top of the window, so islands gather lower down.
const LIT = 0.72;
const EDGE_BIAS = 0.14;
const TOP_BIAS = 0.08;
// Never spawn in the inner share of each margin, next to the text column (0 = the column's band, 1 = screen edge).
const KEEP_OUT = 0.4;
// Clusters stay small: one that grows past this keeps only its strongest cells.
const MAX_CLUSTER = 12;
const STEP = 0.05; // each shade is this much further above LIT
const DOT_SHARE = 0.55; // share of lit cells with a marker (oddgrid: 56%)
const DOT_SIZE = 0.55; // marker size / cell (oddgrid's dots: ~24 of 44px)
// Marker shapes, picked per cell: dot, ring, plus, cross, small square, dash.
const MARKERS = 6;
// Which hue a cell takes: a second noise field cut at its quantiles so the shares match oddgrid's
// (pink 32%, navy 27%, olive 21%, blue 10%, orange 10%).
const HUE_CUTS = [0.407, 0.545, 0.667, 0.747];
// Hover reveal patterns around the pointer's cell, as [dx, dy] pairs (see draw()).
const PATTERNS = [
  [-1, -1, 0, -1, 1, -1, -1, 0, 0, 0, 1, 0, -1, 1, 0, 1, 1, 1], // all 8 around
  [0, -1, -1, 0, 0, 0, 1, 0, 0, 1], // +
  [-1, -1, 1, -1, 0, 0, -1, 1, 1, 1], // x
  [-1, 0, 0, 0, 1, 0], // -
];
// The reveal eases toward the pointer (SPOT_EASE of the way per animation frame), so it drifts after the mouse.
const SPOT_EASE = 0.06;
const LEVELS = 2; // gray, full color
const CLEAR_PAD = 2; // rem of empty band on each side of the text column

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

let pointerX = -1e9; // CSS px, where the mouse is; far away = no spotlight
let pointerY = -1e9;
let spotX = -1e9; // CSS px, the spotlight's center, trailing the pointer
let spotY = -1e9;

type RGB = [number, number, number];
const rgb = (hex: string): RGB => {
  const n = parseInt(hex.trim().replace("#", ""), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const blend = (a: RGB, b: RGB, m: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * m)).join(" ")})`;

// Fill styles for this frame: fills[level * 15 + shade * 5 + hue], dots[level]; level 0 = gray, LEVELS-1 = color.
function palette() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string) => rgb(cs.getPropertyValue(name));
  const grays = [1, 2, 3].map((i) => get(`--grid-${i}`));
  const hues = [1, 2, 3, 4, 5].map((i) => get(`--grid-hue-${i}`));
  const grayDot = get("--grid-dot");
  const hueDot = get("--grid-hue-dot");
  const levels = Array.from({ length: LEVELS }, (_, l) => l / (LEVELS - 1));
  return {
    fills: levels.flatMap((m) =>
      grays.flatMap((g) => hues.map((h) => blend(g, h, m))),
    ),
    dots: levels.map((m) => blend(grayDot, hueDot, m)),
  };
}

// Hover reveals color: when the (eased) pointer is on a lit cell, the lit cells of one small pattern around it
// (PATTERNS) show their own hue instead of gray. The pattern is picked at random when the pointer reaches a cluster
// (4-connected lit cells) and kept while it stays on that cluster, which is tracked frame to frame as it boils. A
// new pattern only when that cluster disappears or the pointer lands on a different one.
let cluster: Set<number> | null = null; // the hovered cluster's cell indices (cy * cols + cx)
let clusterCols = 0;
let pattern = PATTERNS[0];

function component(lit: Map<number, number>, start: number, cols: number) {
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length && seen.size < 4000) {
    const i = stack.pop()!;
    const cx = i % cols;
    for (const n of [
      cx > 0 ? i - 1 : -1,
      cx < cols - 1 ? i + 1 : -1,
      i - cols,
      i + cols,
    ]) {
      if (n >= 0 && lit.has(n) && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen;
}

function draw() {
  if (!ctx) return;
  const start = performance.now();
  const { fills, dots: dotFills } = palette();
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const leftWidth = Math.max(1, clearLeft);
  const rightWidth = Math.max(1, width - clearRight);

  // 1. Which cells are lit, and their shade and hue (packed as shade * 5 + hue).
  const lit = new Map<number, number>();
  const strength = new Map<number, number>(); // noise value per lit cell, for trimming clusters
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const x = cx * CELL;
      // Distance from the clear zone, as a share of that margin (0 at the band, 1 at the screen edge).
      const p =
        x + CELL <= clearLeft
          ? (clearLeft - (x + CELL)) / leftWidth
          : x >= clearRight
            ? (x - clearRight) / rightWidth
            : -1;
      if (p < KEEP_OUT) continue;
      const threshold =
        LIT + (1 - p) * EDGE_BIAS + (1 - (cy * CELL) / height) * TOP_BIAS;
      const v = field(cx, cy, t, threshold);
      if (v < threshold) continue;
      const shade =
        v >= threshold + 2 * STEP ? 2 : v >= threshold + STEP ? 1 : 0;
      const h = noise(cx * SCALE * 1.6 + 40, cy * SCALE * 1.6, t + 9);
      let hue = 0;
      while (hue < HUE_CUTS.length && h >= HUE_CUTS[hue]) hue++;
      lit.set(cy * cols + cx, shade * 5 + hue);
      strength.set(cy * cols + cx, v);
    }
  }

  // 2. Trim big clusters to their MAX_CLUSTER strongest cells.
  const sorted = new Set<number>();
  let biggest = 0;
  for (const i of [...lit.keys()]) {
    if (sorted.has(i) || !lit.has(i)) continue;
    const cells = component(lit, i, cols);
    cells.forEach((c) => sorted.add(c));
    if (cells.size > MAX_CLUSTER) {
      [...cells]
        .sort((a, b) => strength.get(b)! - strength.get(a)!)
        .slice(MAX_CLUSTER)
        .forEach((c) => lit.delete(c));
    }
    biggest = Math.max(biggest, Math.min(cells.size, MAX_CLUSTER));
  }

  // 3. Follow the hovered cluster as it boils; forget it once it's gone.
  if (cluster && clusterCols !== cols) cluster = null;
  if (cluster) {
    let seed = -1;
    for (const i of cluster)
      if (lit.has(i)) {
        seed = i;
        break;
      }
    cluster = seed < 0 ? null : component(lit, seed, cols);
  }
  const pcx = Math.floor(spotX / CELL);
  const pcy = Math.floor(spotY / CELL);
  const here = pcy * cols + pcx;
  const reveal = new Set<number>();
  if (pcx >= 0 && pcx < cols && pcy >= 0 && pcy < rows && lit.has(here)) {
    if (!cluster || !cluster.has(here)) {
      cluster = component(lit, here, cols);
      clusterCols = cols;
      pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    }
    for (let k = 0; k < pattern.length; k += 2) {
      const nx = pcx + pattern[k];
      const i = (pcy + pattern[k + 1]) * cols + nx;
      if (nx >= 0 && nx < cols && lit.has(i)) reveal.add(i);
    }
  }

  // 4. Group cells by fill style, so each style is set once.
  const groups: number[][] = fills.map(() => []);
  const dots: number[][] = dotFills.map(() => []);
  for (const [i, code] of lit) {
    const cx = i % cols;
    const cy = (i - cx) / cols;
    const l = reveal.has(i) ? LEVELS - 1 : 0;
    groups[l * 15 + code].push(cx, cy);
    if (hash(cx, cy, -1) < DOT_SHARE)
      dots[l].push(cx, cy, Math.floor(hash(cx, cy, -2) * MARKERS));
  }
  const colored = reveal.size;
  canvas.dataset.biggest = String(biggest); // largest cluster before trimming, capped (for tests)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Cells touch (no gap, like oddgrid); edges come from rounding each side, so there are no seams.
  const edge = (n: number) => Math.round(n * CELL * dpr);
  groups.forEach((list, i) => {
    if (!list.length) return;
    ctx.fillStyle = fills[i];
    for (let k = 0; k < list.length; k += 2) {
      const x0 = edge(list[k]);
      const y0 = edge(list[k + 1]);
      ctx.fillRect(x0, y0, edge(list[k] + 1) - x0, edge(list[k + 1] + 1) - y0);
    }
  });
  // Markers: filled shapes (dot, square) in one path, stroked ones (ring, plus, cross, dash) in another.
  const r = (CELL * dpr * DOT_SIZE) / 2;
  ctx.lineWidth = Math.max(1, Math.round(CELL * dpr * 0.14));
  ctx.lineCap = "butt";
  dots.forEach((list, l) => {
    if (!list.length) return;
    const filled = new Path2D();
    const stroked = new Path2D();
    for (let k = 0; k < list.length; k += 3) {
      const px = (edge(list[k]) + edge(list[k] + 1)) / 2;
      const py = (edge(list[k + 1]) + edge(list[k + 1] + 1)) / 2;
      switch (list[k + 2]) {
        case 0: // dot
          filled.moveTo(px + r, py);
          filled.arc(px, py, r, 0, Math.PI * 2);
          break;
        case 1: // ring
          stroked.moveTo(px + r * 0.8, py);
          stroked.arc(px, py, r * 0.8, 0, Math.PI * 2);
          break;
        case 2: // plus
          stroked.moveTo(px - r, py);
          stroked.lineTo(px + r, py);
          stroked.moveTo(px, py - r);
          stroked.lineTo(px, py + r);
          break;
        case 3: // cross
          stroked.moveTo(px - r * 0.75, py - r * 0.75);
          stroked.lineTo(px + r * 0.75, py + r * 0.75);
          stroked.moveTo(px + r * 0.75, py - r * 0.75);
          stroked.lineTo(px - r * 0.75, py + r * 0.75);
          break;
        case 4: // small square
          filled.rect(px - r * 0.7, py - r * 0.7, r * 1.4, r * 1.4);
          break;
        default: // dash
          stroked.moveTo(px - r, py);
          stroked.lineTo(px + r, py);
      }
    }
    ctx.fillStyle = dotFills[l];
    ctx.strokeStyle = dotFills[l];
    ctx.fill(filled);
    ctx.stroke(stroked);
  });
  canvas.dataset.frames = String(Number(canvas.dataset.frames) + 1);
  canvas.dataset.colored = String(colored); // cells in the spotlight, for tests
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
// The color spotlight follows a mouse or pen (touch has no hover, so it stays gray). Its center eases toward the
// pointer on animation frames, redrawing without advancing the noise, and stops once it has arrived. It appears
// where the pointer enters and disappears when the pointer leaves the window.
let spotFrame = 0;
function followPointer() {
  spotFrame = 0;
  if (canvas.hidden) return;
  const dx = pointerX - spotX;
  const dy = pointerY - spotY;
  const arrived = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
  if (arrived || still.matches) {
    spotX = pointerX;
    spotY = pointerY;
  } else {
    spotX += dx * SPOT_EASE;
    spotY += dy * SPOT_EASE;
  }
  draw();
  if (!arrived && !still.matches)
    spotFrame = requestAnimationFrame(followPointer);
}
function movePointer(x: number, y: number, jump: boolean) {
  pointerX = x;
  pointerY = y;
  if (jump) {
    spotX = x;
    spotY = y;
  }
  if (!spotFrame) spotFrame = requestAnimationFrame(followPointer);
}
document.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "touch")
    movePointer(e.clientX, e.clientY, pointerX < -1e8);
});
document.documentElement.addEventListener("pointerleave", () =>
  movePointer(-1e9, -1e9, true),
);
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  () => timer || draw(),
);

update();

export {};
