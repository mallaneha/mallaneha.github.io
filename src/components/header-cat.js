/**
 * <header-cat> — a small black cat asleep on a little silver ledge, with its
 * tail hanging straight down off the edge. Original drawing, inspired by
 * Nana from "The Travelling Cat Chronicles".
 *
 *  - Idle: the tail ripples slowly in an S-shaped wave and the cat breathes.
 *  - Hover: the tail moves a little wider and quicker and an ear twitches.
 *    Brushing the cursor across the tail bats it in that direction.
 *  - Starts asleep from 10pm to 6am Pittsburgh time; otherwise it starts
 *    awake, sitting up with the tail still hanging off the ledge.
 *  - Click / Enter / Space while asleep: the tail flicks, an ear twitches,
 *    it opens its eyes for a moment and purrs softly. WAKE_CLICKS clicks in
 *    a row (no pause longer than WAKE_PAUSE_MS) wake it up.
 *  - Purring is silent while the site's sound toggle is off.
 *  - prefers-reduced-motion: no tail motion or breathing. Clicking still
 *    opens the eyes, without motion.
 *
 * Framework-free custom element, no dependencies. Import once anywhere:
 *   <script type="module" src="/header-cat.js"></script>
 *   <h1>Neha Malla <header-cat></header-cat></h1>
 *
 * Attributes:  no-ledge  — hide the little shelf line under the cat
 *              label="…" — accessible name (default: "Sleeping cat" / "Cat, awake")
 *              state="asleep|awake" — force the starting state (default: by Pittsburgh time)
 * CSS custom properties (set on the element or any ancestor):
 *   --cat-size   height of the cat (default 3em)
 *   --cat-fur    coat and tail color
 *   --cat-line   outline color
 *   --cat-eye    eye color
 *   --cat-ledge  shelf line color
 */

const TEMPLATE = /* html */ `
<style>
  :host {
    --_fur: var(--cat-fur, #22201f);
    --_line: var(--cat-line, #22201f);
    --_detail: #5a5550;
    --_eye: var(--cat-eye, #e8b630);
    --_eyerim: #9c7414;
    --_pupil: #141210;
    --_shut: #9a948d;
    --_ear: #6e4e4c;
    --_ledge: var(--cat-ledge, #bfc3c8);
    display: inline-block;
    height: var(--cat-size, 3em);
    aspect-ratio: 112 / 84;
    /* puts the ledge on the surrounding text's baseline */
    vertical-align: calc(var(--cat-size, 3em) * -0.38);
    cursor: pointer;
    /* clicking or double-clicking the cat never selects text */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    line-height: 0;
  }
  @media (prefers-color-scheme: dark) {
    /* a soft gray rim keeps the black cat visible on a dark page */
    :host { --_line: var(--cat-line, #8d8880); --_ledge: var(--cat-ledge, #50545a); }
  }
  :host(:focus-visible) { outline: 2px solid var(--_ledge); outline-offset: 4px; border-radius: 6px; }
  :host([no-ledge]) .ledge { display: none; }
  svg { width: 100%; height: 100%; overflow: visible; display: block; }

  .line { stroke: var(--_line); stroke-linecap: round; stroke-linejoin: round; }
  .fur  { fill: var(--_fur); }
  .detail { stroke: var(--_detail); stroke-linecap: round; stroke-linejoin: round; fill: none; }

  .ear-r, .body { transform-box: fill-box; }
  .ear-r { transform-origin: 30% 100%; }
  .body  { transform-origin: 50% 100%; animation: breathe 4.2s ease-in-out infinite; }
  :host(.twitch) .ear-r { animation: twitch .45s ease-out; }
  .eye-open { opacity: 0; transform-box: fill-box; transform-origin: 50% 50%; }
  :host(.peek) .eye-open { opacity: 1; animation: pop .35s cubic-bezier(.3, 1.6, .5, 1); }
  :host(.peek) .eye-shut { opacity: 0; }

  /* Two poses: lying asleep (.sleep) and sitting up awake (.sit). The tail is shared.
     Sitting rises from the ledge; lying sinks into it. */
  .sleep, .sit { transform-box: view-box; transition: opacity .2s ease, transform .45s cubic-bezier(.3, 1.45, .5, 1); }
  .sleep { transform-origin: 64px 52.5px; }
  .sit   { transform-origin: 85px 52.5px; opacity: 0; transform: scaleY(.55); }
  :host(.awake) .sleep { opacity: 0; transform: scaleY(.6); }
  :host(.awake) .sit   { opacity: 1; transform: none; }
  .sit-body { transform-box: fill-box; transform-origin: 50% 100%; animation: breathe 3.4s ease-in-out infinite; }
  .sit-eyes { transform-box: fill-box; transform-origin: 50% 50%; }
  :host(.awake) .sit-eyes { animation: blink 3.6s 1.2s infinite; }

  @keyframes blink   { 0%, 94%, 100% { transform: none; } 97% { transform: scaleY(.1); } }
  @keyframes breathe { 50% { transform: scale(1.012, 1.035); } }
  @keyframes pop     { from { transform: scale(.4, .1); } }
  @keyframes twitch  { 20% { transform: rotate(-16deg); } 45% { transform: rotate(4deg); } 70% { transform: rotate(-6deg); } }
  @media (prefers-reduced-motion: reduce) {
    .body, .sit-body, :host(.twitch) .ear-r, :host(.peek) .eye-open, :host(.awake) .sit-eyes { animation: none; }
    .sleep, .sit { transition: none; }
  }
</style>
<svg viewBox="0 0 112 84" aria-hidden="true">
  <line class="ledge" x1="6" y1="52.5" x2="94" y2="52.5" stroke="var(--_ledge)" stroke-width="1.4" stroke-linecap="round"/>

  <!-- tail: hangs straight down from under the body. Its shape is computed in JS as
       a chain of segments so it can ripple in an S-curve. Drawn first so the
       body hides its root. -->
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path class="tail-edge" stroke="var(--_line)" stroke-width="5.6"/>
    <path class="tail-fill" stroke="var(--_fur)" stroke-width="3.8"/>
  </g>

  <!-- pose 1: lying asleep -->
  <g class="sleep">
  <!-- body, breathing -->
  <g class="body">
    <path class="line fur" d="M28 52 C24 38 38 24 62 23 C86 22 100 32 100 46 C100 50 99 52 97 52 Z" stroke-width="1.6"/>
    <path class="detail" d="M77 52 C74 41 83 34 93 37" stroke-width="1.3"/>
  </g>

  <!-- ears -->
  <path class="line fur" d="M15.5 35 L14 21 L25 29 Z" stroke-width="1.6"/>
  <path d="M17 31.5 L16.4 25 L21.6 29.2 Z" fill="var(--_ear)"/>
  <g class="ear-r">
    <path class="line fur" d="M32 29 L42 21 L41 35 Z" stroke-width="1.6"/>
    <path d="M35.2 28.8 L40.2 25 L39.7 31 Z" fill="var(--_ear)"/>
  </g>

  <!-- head -->
  <ellipse class="line fur" cx="28" cy="40" rx="15" ry="12.5" stroke-width="1.6"/>

  <!-- closed eyes; on click both pop open: big, round and golden -->
  <g class="eye-shut" fill="none" stroke="var(--_shut)" stroke-width="1.3" stroke-linecap="round">
    <path d="M19.5 40 q3.3 2.8 6.6 0"/><path d="M30.3 40 q3.3 2.8 6.6 0"/>
  </g>
  <g class="eye-open">
    <circle cx="22.4" cy="39.6" r="3.6" fill="var(--_eye)" stroke="var(--_eyerim)" stroke-width=".6"/>
    <ellipse cx="22.6" cy="39.9" rx="2.1" ry="2.6" fill="var(--_pupil)"/>
    <circle cx="23.7" cy="38.4" r="1" fill="#fff"/><circle cx="21.5" cy="41.2" r=".45" fill="#fff" opacity=".9"/>
  </g>
  <g class="eye-open">
    <circle cx="33.6" cy="39.6" r="3.6" fill="var(--_eye)" stroke="var(--_eyerim)" stroke-width=".6"/>
    <ellipse cx="33.8" cy="39.9" rx="2.1" ry="2.6" fill="var(--_pupil)"/>
    <circle cx="34.9" cy="38.4" r="1" fill="#fff"/><circle cx="32.7" cy="41.2" r=".45" fill="#fff" opacity=".9"/>
  </g>

  <path d="M26.7 44.2 h2.6 l-1.3 1.5 z" fill="var(--_ear)"/>
  <path class="detail" d="M28 45.7 q-1.2 1.6 -2.6 .8 M28 45.7 q1.2 1.6 2.6 .8" stroke-width=".9"/>
  <g class="detail" stroke-width=".7">
    <path d="M16.5 44.5 L7 43.5"/><path d="M16.5 46.5 L8 48.5"/>
  </g>

  <!-- front paws -->
  <ellipse class="line fur" cx="21" cy="51" rx="5" ry="2.5" stroke-width="1.4"/>
  <ellipse class="line fur" cx="33.5" cy="51.2" rx="5" ry="2.5" stroke-width="1.4"/>
  <path class="detail" d="M21 49.6 v2.4 M33.5 49.8 v2.4" stroke-width=".7"/>
  </g>

  <!-- pose 2: sitting up awake, near the right end of the ledge so the tail still hangs off it -->
  <g class="sit">
    <g class="sit-body">
      <path class="line fur" d="M68 52 C66 41 70 29 79 25 C88 21 97 28 99 39 C100.5 46 100 50 98 52 Z" stroke-width="1.6"/>
      <!-- haunch and front legs -->
      <path class="detail" d="M88 52 C85 43 90 36 97 38" stroke-width="1.3"/>
      <path class="detail" d="M73.5 35 C72.5 41 73 47 73.6 50.5 M80.8 36 C81.2 42 81 47 80.6 50.5" stroke-width=".9"/>
    </g>
    <ellipse class="line fur" cx="73.2" cy="51.3" rx="4.4" ry="2.3" stroke-width="1.4"/>
    <ellipse class="line fur" cx="81.6" cy="51.3" rx="4.4" ry="2.3" stroke-width="1.4"/>
    <path class="detail" d="M73.2 50 v2.3 M81.6 50 v2.3" stroke-width=".7"/>

    <!-- ears -->
    <path class="line fur" d="M67 16 L65.5 2.5 L75 9.5 Z" stroke-width="1.6"/>
    <path d="M68.3 12.8 L67.7 6.6 L72.2 10.1 Z" fill="var(--_ear)"/>
    <g class="ear-r">
      <path class="line fur" d="M83 9.5 L92.5 2.5 L91 16 Z" stroke-width="1.6"/>
      <path d="M85.8 10.1 L90.3 6.6 L89.7 12.8 Z" fill="var(--_ear)"/>
    </g>

    <!-- head -->
    <ellipse class="line fur" cx="79" cy="18.5" rx="13.5" ry="11" stroke-width="1.6"/>
    <g class="sit-eyes">
      <circle cx="74" cy="17.6" r="3.4" fill="var(--_eye)" stroke="var(--_eyerim)" stroke-width=".6"/>
      <ellipse cx="74.2" cy="17.9" rx="1.4" ry="2.6" fill="var(--_pupil)"/>
      <circle cx="75.2" cy="16.5" r=".9" fill="#fff"/>
      <circle cx="84" cy="17.6" r="3.4" fill="var(--_eye)" stroke="var(--_eyerim)" stroke-width=".6"/>
      <ellipse cx="84.2" cy="17.9" rx="1.4" ry="2.6" fill="var(--_pupil)"/>
      <circle cx="85.2" cy="16.5" r=".9" fill="#fff"/>
    </g>
    <path d="M77.7 22 h2.6 l-1.3 1.5 z" fill="var(--_ear)"/>
    <path class="detail" d="M79 23.5 q-1.2 1.6 -2.6 .8 M79 23.5 q1.2 1.6 2.6 .8" stroke-width=".9"/>
    <g class="detail" stroke-width=".7">
      <path d="M68 22 L58.5 21"/><path d="M68 24 L59.5 26"/>
      <path d="M90 22 L99.5 21"/><path d="M90 24 L98.5 26"/>
    </g>
  </g>
</svg>`;

// Asleep from SLEEP_HOUR to WAKE_HOUR in Pittsburgh (Neha's local time).
const TIME_ZONE = "America/New_York";
const SLEEP_HOUR = 22;
const WAKE_HOUR = 6;
// Clicks in a row it takes to wake the sleeping cat; a longer pause resets the count.
const WAKE_CLICKS = 12;
const WAKE_PAUSE_MS = 3000;
// The site's sound toggle (src/scripts/effects.ts).
const MUTE_KEY = "effects-muted";

function asleepNow() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return hour >= SLEEP_HOUR || hour < WAKE_HOUR;
}

// Tail region in viewBox units, for "batting" the tail with the cursor.
const TAIL_BOX = { x0: 90, x1: 114, y0: 46, y1: 84 };

// Tail rest pose. ROOT and ANCHOR sit under the body; a chain of segments
// hangs from ANCHOR. Angles are SVG degrees (0 = right, 90 = straight down):
// a straight vertical drop.
const ROOT = [[97.2, 43]];
const ANCHOR = [98.4, 50];
const SEG_LEN = [3.9, 3.9, 3.9, 3.9, 3.9, 3.8, 3.7, 3.6];
const SEG_REST = [90, 90, 90, 90, 90, 90, 90, 90];
const N = SEG_LEN.length;

// Smooth curve through points (Catmull-Rom as cubic Béziers).
function smoothPath(p) {
  let d = `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i],
      b = p[i],
      c = p[i + 1],
      e = p[i + 2] || c;
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${c[0].toFixed(2)} ${c[1].toFixed(2)}`;
  }
  return d;
}

class HeaderCat extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" }).innerHTML = TEMPLATE;
      this.svg = this.shadowRoot.querySelector("svg");
      this.tails = this.shadowRoot.querySelectorAll(".tail-edge, .tail-fill");
    }
    if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
    this.setAttribute("role", "button");
    const state = this.getAttribute("state");
    this.setAwake(state ? state === "awake" : !asleepNow());
    this.clicks = 0;

    this.reduce = matchMedia("(prefers-reduced-motion: reduce)");
    // motion state (degrees, seconds)
    this.phase = 0;
    this.amp = 5;
    this.ampT = 5;
    this.speed = 1.9;
    this.speedT = 1.9;
    this.kick = 0;
    this.kickV = 0;
    this.last = 0;
    // each segment's flick offset trails the one above it, so a flick ripples down the tail
    this.lag = new Float32Array(N);
    this.lagV = new Float32Array(N);
    this.draw([]);

    this._on = [
      [
        "pointerenter",
        () => {
          this.ampT = 9;
          this.speedT = 3.4;
          this.twitch();
        },
      ],
      [
        "pointerleave",
        () => {
          this.ampT = 5;
          this.speedT = 1.9;
        },
      ],
      ["pointermove", (e) => this.bat(e)],
      // A mousedown here would start a text selection (double-click selects the name beside it).
      ["mousedown", (e) => e.preventDefault()],
      ["click", () => this.poke()],
      [
        "keydown",
        (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.poke();
          }
        },
      ],
    ];
    for (const [t, f] of this._on) this.addEventListener(t, f);

    this._onMotion = () => this.start();
    this.reduce.addEventListener("change", this._onMotion);
    // only animate while on screen
    this.io = new IntersectionObserver(([en]) => {
      this.visible = en.isIntersecting;
      this.start();
    });
    this.io.observe(this);
  }

  disconnectedCallback() {
    for (const [t, f] of this._on) this.removeEventListener(t, f);
    this.reduce.removeEventListener("change", this._onMotion);
    this.io.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  start() {
    if (this.reduce.matches || !this.visible) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      if (this.reduce.matches) this.draw([]);
      return;
    }
    if (!this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame((t) => this.tick(t));
    }
  }

  tick(t) {
    const dt = this.last ? Math.min((t - this.last) / 1000, 0.05) : 0;
    this.last = t;
    const ease = 1 - Math.exp(-dt * 2.5);
    this.amp += (this.ampT - this.amp) * ease;
    this.speed += (this.speedT - this.speed) * ease;
    this.phase += dt * this.speed;
    // damped spring for flicks and bats
    this.kickV += (-38 * this.kick - 4.2 * this.kickV) * dt;
    this.kick += this.kickV * dt;
    // a travelling wave: each segment swings a little later and a little
    // wider than the one above it, which bends the tail into a soft S
    const off = [];
    for (let i = 0; i < N; i++) {
      const target = i ? this.lag[i - 1] : this.kick;
      this.lagV[i] += (60 * (target - this.lag[i]) - 9 * this.lagV[i]) * dt;
      this.lag[i] += this.lagV[i] * dt;
      const wave =
        this.amp * (0.35 + 0.16 * i) * Math.sin(this.phase - 0.62 * i);
      off.push(wave + this.lag[i] * (0.6 + 0.08 * i));
    }
    this.draw(off);
    this.raf = requestAnimationFrame((n) => this.tick(n));
  }

  // Lay the segments out from the anchor and redraw the tail.
  draw(off) {
    const pts = ROOT.map((p) => p.slice());
    let [x, y] = ANCHOR;
    pts.push([x, y]);
    for (let i = 0; i < N; i++) {
      const a = ((SEG_REST[i] + (off[i] || 0)) * Math.PI) / 180;
      x += SEG_LEN[i] * Math.cos(a);
      y += SEG_LEN[i] * Math.sin(a);
      pts.push([x, y]);
    }
    const d = smoothPath(pts);
    this.tails.forEach((el) => el.setAttribute("d", d));
  }

  // Brushing the cursor across the tail pushes it the way the cursor moved.
  bat(e) {
    if (this.reduce.matches) return;
    const r = this.svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 112;
    const y = ((e.clientY - r.top) / r.height) * 84;
    if (
      x < TAIL_BOX.x0 ||
      x > TAIL_BOX.x1 ||
      y < TAIL_BOX.y0 ||
      y > TAIL_BOX.y1
    )
      return;
    // cursor moving right pushes the tail right, i.e. counter-clockwise
    this.kickV = Math.max(-220, Math.min(220, this.kickV - e.movementX * 14));
  }

  restart(cls, ms) {
    this.classList.remove(cls);
    void this.offsetWidth; // restart the CSS animation
    this.classList.add(cls);
    clearTimeout(this["_" + cls]);
    this["_" + cls] = setTimeout(() => this.classList.remove(cls), ms);
  }

  twitch() {
    this.restart("twitch", 500);
  }

  setAwake(awake) {
    this.classList.toggle("awake", awake);
    this.setAttribute(
      "aria-label",
      this.getAttribute("label") || (awake ? "Cat, awake" : "Sleeping cat"),
    );
  }

  poke() {
    this.twitch();
    if (!this.reduce.matches)
      this.kickV += (Math.random() < 0.5 ? -1 : 1) * 260;
    if (!this.classList.contains("awake")) {
      // Asleep: it stirs and purrs. Enough clicks in a row wake it up.
      const now = performance.now();
      this.clicks =
        now - (this.lastClick ?? 0) > WAKE_PAUSE_MS ? 1 : this.clicks + 1;
      this.lastClick = now;
      if (this.clicks >= WAKE_CLICKS) {
        this.clicks = 0;
        clearTimeout(this._peek);
        this.classList.remove("peek");
        this.setAwake(true);
      } else {
        this.restart("peek", 1400);
        purr();
      }
    }
    this.dispatchEvent(
      new CustomEvent("cat-poke", { bubbles: true, composed: true }),
    );
  }
}

// ---------- purr ----------
// Synthesized (no audio file): low-passed noise pulsing about 25 times a second,
// quiet, with a slow swell. One purr at a time: clicks during a purr don't stack.

let audioCtx = null;
let purrEnds = 0;
const rand = (a, b) => a + Math.random() * (b - a);

function soundOff() {
  try {
    const saved = localStorage.getItem(MUTE_KEY);
    if (saved !== null) return saved === "true";
  } catch {
    /* storage blocked: fall through */
  }
  // same default as the site: quiet for people who asked for reduced motion
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function purr() {
  if (soundOff()) return;
  const AC =
    window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AC) return;
  audioCtx ??= new AC();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const ctx = audioCtx;
  const t = ctx.currentTime + 0.02;
  if (t < purrEnds) return;
  const dur = rand(1.1, 1.6);
  purrEnds = t + dur;

  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 320;
  lowpass.Q.value = 0.8;

  // the purr's flutter: gain pulsing between ~0 and 1 at 22-28 Hz
  const flutter = ctx.createGain();
  flutter.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rand(22, 28);
  const depth = ctx.createGain();
  depth.gain.value = 0.5;
  lfo.connect(depth).connect(flutter.gain);

  // soft volume, swelling in and fading out
  const out = ctx.createGain();
  const peak = 0.09;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(peak, t + dur * 0.3);
  out.gain.setValueAtTime(peak, t + dur * 0.6);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  noise.connect(lowpass).connect(flutter).connect(out).connect(ctx.destination);
  noise.start(t);
  lfo.start(t);
  noise.stop(t + dur);
  lfo.stop(t + dur);
}

if (!customElements.get("header-cat"))
  customElements.define("header-cat", HeaderCat);
export default HeaderCat;
