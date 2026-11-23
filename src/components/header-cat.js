/**
 * <header-cat> — a small black cat asleep on a little silver ledge, with its
 * tail hanging straight down off the edge. Original drawing, inspired by
 * Nana from "The Travelling Cat Chronicles".
 *
 *  - Idle: the tail ripples slowly in an S-shaped wave and the cat breathes.
 *  - Hover: the tail moves a little wider and quicker and an ear twitches.
 *    Brushing the cursor across the tail bats it in that direction.
 *  - Click / Enter / Space: the tail flicks, an ear twitches and the cat
 *    pops open two big round golden eyes for a moment.
 *  - prefers-reduced-motion: no tail motion or breathing. Clicking still
 *    opens the eyes, without motion.
 *
 * Framework-free custom element, no dependencies. Import once anywhere:
 *   <script type="module" src="/header-cat.js"></script>
 *   <h1>Neha Malla <header-cat></header-cat></h1>
 *
 * Attributes:  no-ledge  — hide the little shelf line under the cat
 *              label="…" — accessible name (default "Sleeping cat")
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

  @keyframes breathe { 50% { transform: scale(1.012, 1.035); } }
  @keyframes pop     { from { transform: scale(.4, .1); } }
  @keyframes twitch  { 20% { transform: rotate(-16deg); } 45% { transform: rotate(4deg); } 70% { transform: rotate(-6deg); } }
  @media (prefers-reduced-motion: reduce) {
    .body, :host(.twitch) .ear-r, :host(.peek) .eye-open { animation: none; }
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
</svg>`;

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
    this.setAttribute(
      "aria-label",
      this.getAttribute("label") || "Sleeping cat",
    );

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

  poke() {
    this.twitch();
    this.restart("peek", 1400);
    if (!this.reduce.matches)
      this.kickV += (Math.random() < 0.5 ? -1 : 1) * 260;
    this.dispatchEvent(
      new CustomEvent("cat-poke", { bubbles: true, composed: true }),
    );
  }
}

if (!customElements.get("header-cat"))
  customElements.define("header-cat", HeaderCat);
export default HeaderCat;
