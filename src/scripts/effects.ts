// Click feedback modeled on ch.sh: a small spark burst on a canvas, a soft synthesized
// "tick", and an 8ms vibration on phones. Only on pages whose <body> has data-effects (the home page),
// and never for clicks inside a drawer. The toggle ([data-effects-toggle]) mutes the sound and vibration;
// the sparks stay. Also: theme toggle, [data-copy] buttons with a toast, and the footer's local time.

const KEY = "effects-muted";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

function readMuted() {
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}
let muted = readMuted();
const effectsOn = document.body.hasAttribute("data-effects");

// ---------- sparks (same parameters as ch.sh's ClickSpark defaults) ----------
const SPARK = {
  count: 6,
  size: 6,
  radius: 12,
  duration: 300,
  opacity: 0.3,
  width: 1.5,
};
type Spark = { x: number; y: number; angle: number; start: number };

const canvas = document.createElement("canvas");
canvas.className = "spark-canvas";
canvas.setAttribute("aria-hidden", "true");
if (effectsOn) document.body.append(canvas);
const ctx = effectsOn ? canvas.getContext("2d") : null;
let sparks: Spark[] = [];
let raf = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
if (effectsOn) {
  resize();
  addEventListener("resize", resize);
}

const easeOut = (t: number) => t * (2 - t);

function draw(now: number) {
  if (!ctx) return;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalAlpha = SPARK.opacity;
  ctx.strokeStyle = getComputedStyle(canvas).color;
  ctx.lineWidth = SPARK.width;
  ctx.lineCap = "round";
  sparks = sparks.filter((s) => {
    const elapsed = now - s.start;
    if (elapsed >= SPARK.duration) return false;
    const p = easeOut(elapsed / SPARK.duration);
    const dist = p * SPARK.radius;
    const len = SPARK.size * (1 - p);
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);
    ctx.beginPath();
    ctx.moveTo(s.x + dist * cos, s.y + dist * sin);
    ctx.lineTo(s.x + (dist + len) * cos, s.y + (dist + len) * sin);
    ctx.stroke();
    return true;
  });
  raf = sparks.length ? requestAnimationFrame(draw) : 0;
}

function burst(x: number, y: number) {
  const start = performance.now();
  for (let i = 0; i < SPARK.count; i++) {
    sparks.push({ x, y, angle: (2 * Math.PI * i) / SPARK.count, start });
  }
  if (!raf) raf = requestAnimationFrame(draw);
}

// ---------- sound: two short filtered-noise ticks (ch.sh's "toggle" recipe) ----------
type Layer = {
  freq: number;
  q: number;
  offset: number;
  attack: number;
  decay: number;
  peak: number;
};
const TICK: { gain: number; layers: Layer[] } = {
  gain: 0.4,
  layers: [
    { freq: 2200, q: 1.6, offset: 0, attack: 0.001, decay: 0.016, peak: 0.12 },
    {
      freq: 3800,
      q: 1.6,
      offset: 0.024,
      attack: 0.001,
      decay: 0.02,
      peak: 0.1,
    },
  ],
};
let audio: AudioContext | null = null;

function tick() {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return;
  try {
    audio ??= new AC();
  } catch {
    return;
  }
  const a = audio;
  const play = () => {
    const master = a.createGain();
    master.gain.value = TICK.gain;
    master.connect(a.destination);
    for (const l of TICK.layers) {
      const t = a.currentTime + l.offset;
      const len = Math.max(
        1,
        Math.floor((l.attack + l.decay + 0.05) * a.sampleRate),
      );
      const buf = a.createBuffer(1, len, a.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const filter = a.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = l.freq;
      filter.Q.value = l.q;
      const env = a.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(l.peak, t + l.attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t + l.attack + l.decay);
      src.connect(filter).connect(env).connect(master);
      src.start(t);
      src.stop(t + l.attack + l.decay + 0.05);
    }
  };
  if (a.state === "running") play();
  else a.resume().then(play, () => {});
}

if (effectsOn) {
  addEventListener(
    "click",
    (e) => {
      // Drawers are for reading: no effects inside one (a backdrop click targets the <dialog> too).
      if ((e.target as Element | null)?.closest?.("dialog")) return;
      // Keyboard "clicks" have no pointer position: skip the spark, keep the sound.
      if (e.detail > 0 && !reduceMotion.matches) burst(e.clientX, e.clientY);
      if (muted) return;
      tick();
      navigator.vibrate?.(8);
    },
    true,
  );
}

// ---------- mute toggle ----------
function syncToggles() {
  for (const b of document.querySelectorAll<HTMLButtonElement>(
    "[data-effects-toggle]",
  )) {
    b.setAttribute("aria-pressed", String(!muted));
    b.dataset.state = muted ? "off" : "on";
    b.title = muted ? "Click sounds off" : "Click sounds on";
    b.setAttribute("aria-label", "Click sounds");
  }
}
syncToggles();
document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest("[data-effects-toggle]")) return;
  muted = !muted;
  try {
    localStorage.setItem(KEY, String(muted));
  } catch {
    /* private mode: the setting lasts for this page only */
  }
  syncToggles();
});

// ---------- theme toggle ----------
// Base.astro's inline head script applies a saved choice before paint. With no saved choice the page follows
// the system setting (CSS media query), and the button flips relative to whatever is showing now.
const THEME_KEY = "theme";
const systemDark = matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;
const currentTheme = () =>
  root.dataset.theme === "dark" || root.dataset.theme === "light"
    ? root.dataset.theme
    : systemDark.matches
      ? "dark"
      : "light";

function syncThemeToggles() {
  const dark = currentTheme() === "dark";
  for (const b of document.querySelectorAll<HTMLButtonElement>(
    "[data-theme-toggle]",
  )) {
    b.setAttribute("aria-pressed", String(dark));
    b.dataset.state = dark ? "dark" : "light";
    b.title = dark ? "Switch to light theme" : "Switch to dark theme";
  }
}
syncThemeToggles();
systemDark.addEventListener("change", syncThemeToggles);
document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest("[data-theme-toggle]")) return;
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
  syncThemeToggles();
});

// ---------- copy to clipboard + toast ----------
const toast = document.getElementById("toast");
let toastTimer = 0;
function showToast(text: string) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => toast.classList.remove("is-visible"),
    2000,
  );
}
document.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-copy]");
  if (!btn) return;
  const { copy = "", copyLabel = "Copied", copyFallback } = btn.dataset;
  try {
    await navigator.clipboard.writeText(copy);
    showToast(copyLabel);
  } catch {
    if (copyFallback) location.href = copyFallback;
  }
});

// ---------- local time in the footer ----------
// <span data-local-time="America/New_York" hidden> · <time></time></span>, shown once filled.
for (const el of document.querySelectorAll<HTMLElement>("[data-local-time]")) {
  const out = el.querySelector("time");
  if (!out) continue;
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: el.dataset.localTime,
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    continue; // unknown time zone: leave it hidden
  }
  const update = () => {
    out.textContent = fmt.format(new Date());
    window.setTimeout(update, 60_000 - (Date.now() % 60_000) + 50);
  };
  update();
  out.setAttribute("aria-label", "Local time");
  el.hidden = false;
}

// Interactive explainers for the "LLMs by hand" posts. Loaded only on pages that use one.
if (
  document.querySelector("attention-lab, scale-lab, gpt-shape, serving-budget")
) {
  import("./explainers");
}

export {};
