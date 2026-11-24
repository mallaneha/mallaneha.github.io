// Falling snow: small dots drifting down a fixed canvas behind all content.
// Settings (fall speed, wind strength and direction, size, opacity) live in src/data/snow.ts; any of them can be
// overridden with a URL parameter of the same name (?wind=60&direction=180). Color comes from --snow (tokens.css).
// Stops while the tab is hidden; with reduced motion it draws one still frame.
import { snow, type SnowSettings } from "../data/snow";

type Flake = {
  x: number;
  y: number;
  r: number;
  a: number;
  depth: number;
  phase: number;
  freq: number;
};

const settings: SnowSettings = { ...snow };
const params = new URLSearchParams(location.search);
for (const key of Object.keys(settings) as (keyof SnowSettings)[]) {
  const v = params.get(key);
  if (v === null || key === "enabled") continue;
  const n = Number(v);
  if (Number.isFinite(n))
    (settings as Record<string, number | boolean>)[key] = n;
}

const canvas = document.createElement("canvas");
canvas.className = "snow";
canvas.setAttribute("aria-hidden", "true");
document.body.prepend(canvas);
const ctx = canvas.getContext("2d")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// Wind as a velocity vector (px/s). Screen y points down, so 90° blows down.
const rad = (settings.direction * Math.PI) / 180;
const windX = Math.cos(rad) * settings.wind;
const windY = Math.sin(rad) * settings.wind;
canvas.dataset.windX = windX.toFixed(2);

let width = 0;
let height = 0;
let flakes: Flake[] = [];
let color = "";
let frames = 0;
let last = 0;
let raf = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeFlake(x: number, y: number): Flake {
  const depth = Math.random(); // 0 far, 1 near: near flakes are bigger, brighter and faster
  return {
    x,
    y,
    depth,
    r: settings.minSize + depth * (settings.maxSize - settings.minSize),
    a:
      settings.minOpacity + depth * (settings.maxOpacity - settings.minOpacity),
    phase: rand(0, Math.PI * 2),
    freq: rand(0.3, 0.8),
  };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(
    settings.maxFlakes,
    Math.round(((width * height) / 100_000) * settings.density),
  );
  while (flakes.length < count)
    flakes.push(makeFlake(rand(0, width), rand(0, height)));
  flakes.length = count;
  canvas.dataset.flakes = String(count);
}

// Depth of field: flakes at the focus depth are sharp; the farther from it (behind or in front), the softer.
// Each blur level is a pre-rendered soft dot (radial gradient), so frames only copy images.
const LEVELS = 8;
const SPRITE = 32; // px, the sprite's radius
let sprites: HTMLCanvasElement[] = [];

function readColor() {
  color = getComputedStyle(canvas).color;
  sprites = Array.from({ length: LEVELS }, (_, k) => {
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE * 2;
    const g = c.getContext("2d")!;
    const softness = k / (LEVELS - 1); // 0 sharp … 1 fully blurred
    const grad = g.createRadialGradient(
      SPRITE,
      SPRITE,
      0,
      SPRITE,
      SPRITE,
      SPRITE,
    );
    grad.addColorStop(0, color);
    grad.addColorStop(Math.max(0, 0.9 - 0.9 * softness), color);
    grad.addColorStop(1, "transparent");
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE * 2, SPRITE * 2);
    return c;
  });
}

// Blur radius in px for a flake, from how far its depth is from the focus.
const blurOf = (depth: number) =>
  Math.min(
    1,
    Math.abs(depth - settings.focus) /
      Math.max(settings.focus, 1 - settings.focus),
  ) * settings.blur;

function draw() {
  ctx.clearRect(0, 0, width, height);
  for (const f of flakes) {
    const blur = blurOf(f.depth);
    const size = f.r + blur; // a blurred dot spreads out…
    const k = Math.round((blur / (f.r + blur || 1)) * (LEVELS - 1));
    // …and its light thins out over the bigger area.
    ctx.globalAlpha = f.a * Math.min(1, (f.r / size) ** 1.2 + 0.25);
    ctx.drawImage(sprites[k], f.x - size, f.y - size, size * 2, size * 2);
  }
  ctx.globalAlpha = 1;
  canvas.dataset.frames = String(++frames);
}

function step(dt: number, t: number) {
  const pad = settings.maxSize + settings.sway;
  for (const f of flakes) {
    const pace = 0.4 + 0.6 * f.depth; // parallax: far flakes move slower
    const swayV = Math.cos(t * f.freq + f.phase) * settings.sway * f.freq;
    f.x += (windX * pace + swayV) * dt;
    f.y += (settings.speed * pace + windY * pace) * dt;
    // Leave one edge, come back in on the opposite one at a random spot.
    if (f.y > height + pad) Object.assign(f, makeFlake(rand(0, width), -pad));
    else if (f.y < -pad)
      Object.assign(f, makeFlake(rand(0, width), height + pad));
    if (f.x > width + pad) Object.assign(f, makeFlake(-pad, rand(0, height)));
    else if (f.x < -pad)
      Object.assign(f, makeFlake(width + pad, rand(0, height)));
  }
}

function tick(now: number) {
  const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; // clamp after a stall
  last = now;
  step(dt, now / 1000);
  draw();
  raf = requestAnimationFrame(tick);
}

function start() {
  cancelAnimationFrame(raf);
  last = 0;
  if (reduced.matches || document.hidden) draw();
  else raf = requestAnimationFrame(tick);
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resize();
    if (reduced.matches) draw();
  }, 150);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else start();
});
reduced.addEventListener("change", start);
new MutationObserver(() => {
  readColor();
  if (reduced.matches) draw();
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

readColor();
resize();
start();
