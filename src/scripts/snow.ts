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

function readColor() {
  color = getComputedStyle(canvas).color;
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  for (const f of flakes) {
    ctx.globalAlpha = f.a;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
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
