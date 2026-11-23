// Click feedback modeled on ch.sh: a small spark burst on a canvas, a soft synthesized
// "tick", and an 8ms vibration on phones, on every page, for clicks on links and buttons (never inside a
// drawer). The toggle ([data-effects-toggle]) mutes the sound and vibration;
// the sparks stay. Also: theme toggle, [data-copy] buttons with a toast, and the footer's local time.

const KEY = "effects-muted";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

function readMuted() {
  try {
    const saved = localStorage.getItem(KEY);
    // No saved choice: start quiet for people who asked for reduced motion.
    return saved === null ? reduceMotion.matches : saved === "true";
  } catch {
    return reduceMotion.matches;
  }
}
let muted = readMuted();

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
document.body.append(canvas);
const ctx = canvas.getContext("2d");
let sparks: Spark[] = [];
let raf = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener("resize", resize);

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
let master: GainNode | null = null; // one output gain, reused by every tick

// How long a tick lasts, in seconds (the last layer's offset + attack + decay).
const TICK_LENGTH = Math.max(
  ...TICK.layers.map((l) => l.offset + l.attack + l.decay),
);

function audioContext(): AudioContext | null {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  try {
    audio ??= new AC();
  } catch {
    return null;
  }
  return audio;
}

// Waking a fresh page's audio takes tens of ms (over 100 ms on some machines). Start it on press, which
// comes before the click, so the tick is ready by the time the click lands.
function warmUp(e: Event) {
  if (muted) return;
  if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
  if (!(e.target as Element | null)?.closest?.("a, button, summary, label"))
    return;
  const a = audioContext();
  if (a && a.state === "suspended") a.resume().catch(() => {});
}
addEventListener("pointerdown", warmUp, true);
addEventListener("keydown", warmUp, true);

/** Play a tick. Resolves once it has finished playing (or right away if it can't play). */
function tick(): Promise<void> {
  const a = audioContext();
  if (!a) return Promise.resolve();
  const play = () => {
    if (!master) {
      master = a.createGain();
      master.gain.value = TICK.gain;
      master.connect(a.destination);
    }
    const out = master;
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
      src.connect(filter).connect(env).connect(out);
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        env.disconnect();
      };
      src.start(t);
      src.stop(t + l.attack + l.decay + 0.05);
    }
  };
  const played = () =>
    new Promise<void>((done) => {
      play();
      setTimeout(done, TICK_LENGTH * 1000);
    });
  if (a.state === "running") return played();
  // A fresh page's audio starts suspended; it wakes on this click, a few ms later.
  return a.resume().then(played, () => {});
}

// A same-tab link click unloads the page before a fresh page's audio has even woken up, so the tick is
// cut off (drawer rows on the home page don't navigate, which is why they always ticked). Hold that
// navigation until the tick has played: about 50 ms, never more than NAV_WAIT_MS.
const NAV_WAIT_MS = 150;
let pendingTick: Promise<void> | null = null;

function sameTabNavigation(e: MouseEvent): HTMLAnchorElement | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement)) return null;
  if (a.target && a.target !== "_self") return null;
  if (a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null; // other sites: leave the browser alone
  const samePage =
    url.pathname === location.pathname && url.search === location.search;
  if (samePage && url.hash) return null; // an in-page anchor doesn't unload the page
  return a;
}

{
  addEventListener(
    "click",
    (e) => {
      // Drawers are for reading: no effects inside one (a backdrop click targets the <dialog> too).
      const target = e.target as Element | null;
      if (target?.closest?.("dialog")) return;
      // Only things you can press get feedback, not clicks on text or empty space.
      if (!target?.closest?.("a, button, summary, label, [role='button']"))
        return;
      // Keyboard "clicks" have no pointer position: skip the spark, keep the sound.
      if (e.detail > 0 && !reduceMotion.matches) burst(e.clientX, e.clientY);
      if (muted) return;
      pendingTick = tick();
      navigator.vibrate?.(8);
    },
    true,
  );
  // Bubble phase, after every other handler: only delay a navigation nothing else has taken over.
  addEventListener("click", (e) => {
    const tickDone = pendingTick;
    pendingTick = null;
    if (!tickDone) return;
    const link = sameTabNavigation(e);
    if (!link) return;
    e.preventDefault();
    const href = link.href;
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      location.assign(href);
    };
    tickDone.then(go);
    setTimeout(go, NAV_WAIT_MS);
  });
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
const decodeEmail = (s: string) =>
  s
    .trim()
    .replace(/\s*\[at\]\s*|\s+at\s+/i, "@")
    .replace(/\s*\[dot\]\s*|\s+dot\s+/gi, ".");

document.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-copy]");
  if (!btn) return;
  const { copyLabel = "Copied" } = btn.dataset;
  let { copy = "", copyFallback } = btn.dataset;
  // A spelled-out email ("name[at]gmail[dot]com", kept that way in the HTML so scrapers miss it).
  if ("copyEmail" in btn.dataset) {
    copy = decodeEmail(copy);
    copyFallback = `mailto:${copy}`;
  }
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
      second: "2-digit",
    });
  } catch {
    continue; // unknown time zone: leave it hidden
  }
  const update = () => {
    out.textContent = fmt.format(new Date());
    window.setTimeout(update, 1000 - (Date.now() % 1000) + 20);
  };
  update();
  out.setAttribute("aria-label", "Local time");
  el.hidden = false;
}

// Interactive explainers for the "LLMs by hand" posts and the RAG posts. Loaded only on pages that use one.
if (
  document.querySelector("attention-lab, scale-lab, gpt-shape, serving-budget")
) {
  import("./explainers");
}
if (
  document.querySelector(
    "abstain-lab, code-search, rule-of-two, poison-layers, attack-gap",
  )
) {
  import("./rag-explainers");
}

// Debug panel (e.g. the CMU logo toggle). Visitors never get it: `?debug` turns it on, `?debug=0` off.
if (/[?&]debug\b/.test(location.search) || hasDebugFlag()) {
  import("./debug");
}
function hasDebugFlag() {
  try {
    return localStorage.getItem("debug") === "1";
  } catch {
    return false;
  }
}

export {};
