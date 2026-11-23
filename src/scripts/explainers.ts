// Interactive widgets for the "LLMs by hand" writing series. Each one is a custom element placed in a
// Markdown post as raw HTML, with static fallback content inside it. With JS off, the fallback stays.
// Every number shown is computed here from the formulas in the post; nothing is hard-coded output.

import {
  bar,
  bytes,
  checkbox,
  choice,
  dot,
  fixed,
  h,
  head,
  int,
  motion,
  num,
  numberField,
  params,
  pct,
  s,
  select,
  slider,
  softmax,
  tableHead,
  weightCell,
} from "./explainer-kit";

type V2 = [number, number];

/* ------------------------------------------------------------------ */
/* Part 1: attention                                                   */
/* ------------------------------------------------------------------ */

const TOKENS = ["The", "cat", "sat", "down"];
const KEYS: V2[] = [
  [0.2, -1.0],
  [1.4, 0.6],
  [-0.4, 1.3],
  [-1.2, -0.3],
];
const QUERIES: V2[] = [
  [0.3, -0.5],
  [1.0, 0.3],
  [1.2, 0.8],
  [-0.2, 1.0],
];
const VALUES: V2[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 0.5],
];

const PLOT = 240; // viewBox size of the attention plot
const px = (v: number) => PLOT / 2 + v * 50;
const py = (v: number) => PLOT / 2 - v * 50;
const tenth = (v: number) =>
  Math.max(-2, Math.min(2, Math.round(v * 10) / 10)) + 0; // + 0 turns -0 into 0

class AttentionLab extends HTMLElement {
  private q: V2[] = QUERIES.map((v) => [...v] as V2);
  private row = 2;

  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const tok = choice("Query token", TOKENS, this.row);
    const qx = slider("q₁", -2, 2, 0.1, this.q[this.row]![0], (v) =>
      fixed(v, 1),
    );
    const qy = slider("q₂", -2, 2, 0.1, this.q[this.row]![1], (v) =>
      fixed(v, 1),
    );
    const causal = checkbox(
      "Causal mask: a token can't see later tokens",
      true,
    );
    const scale = checkbox("Divide scores by √d_k (here √2)", true);
    const reset = h("button", { type: "button", class: "xp-ghost" }, "Reset");

    // The plot, with an HTML handle over the arrowhead: a 44px drag target you can grab with a thumb.
    const plot = s("svg", {
      viewBox: `0 0 ${PLOT} ${PLOT}`,
      class: "xp-plot",
      role: "img",
    });
    const plotTitle = s("title");
    const handle = h("span", { class: "xp-handle", "aria-hidden": "true" });
    const plotWrap = h("div", { class: "xp-plot-wrap" }, plot, handle);
    const figure = h(
      "div",
      { class: "xp-figure" },
      plotWrap,
      h("p", { class: "xp-note" }, "Drag the arrowhead, or use the sliders."),
    );

    const pipeCaption = h("caption");
    const pipe = TOKENS.map((t) => {
      const cells = [0, 1, 2, 3].map(() => h("td"));
      cells[0]!.className = "xp-wide-only";
      const weight = weightCell();
      const tr = h("tr", {}, h("th", { scope: "row" }, t), ...cells, weight.td);
      return { tr, cells, weight };
    });
    const pipeTable = h(
      "table",
      { class: "xp-table" },
      pipeCaption,
      tableHead([
        "Key",
        ["k", "xp-wide-only"],
        "q·k",
        "scaled",
        "masked",
        "weight",
      ]),
      h("tbody", {}, ...pipe.map((r) => r.tr)),
    );

    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });

    const mat = TOKENS.map((t) => {
      const cells = TOKENS.map(() => weightCell());
      const tr = h(
        "tr",
        {},
        h("th", { scope: "row" }, t),
        ...cells.map((c) => c.td),
      );
      return { tr, cells };
    });
    const matTable = h(
      "table",
      { class: "xp-table xp-matrix" },
      h(
        "caption",
        {},
        "Every token at once: each row is one query, each column one key. Rows sum to 100%.",
      ),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          h("td"),
          ...TOKENS.map((t) => h("th", { scope: "col" }, t)),
        ),
      ),
      h("tbody", {}, ...mat.map((r) => r.tr)),
    );

    const controls = h(
      "div",
      { class: "xp-controls" },
      tok.wrap,
      qx.wrap,
      qy.wrap,
      causal.wrap,
      scale.wrap,
    );
    const root = h(
      "div",
      { class: "xp" },
      head("Attention lab", reset),
      h("div", { class: "xp-split" }, figure, controls),
      summary,
      h("div", { class: "xp-scroll" }, pipeTable),
      h("div", { class: "xp-scroll" }, matTable),
    );
    this.replaceChildren(root);
    const setMotion = motion(root);

    const weightsFor = (i: number) => {
      const raw = KEYS.map((k) => dot(this.q[i]!, k));
      const scaled = raw.map((x) => (scale.input.checked ? x / Math.SQRT2 : x));
      const masked = scaled.map((x, j) =>
        causal.input.checked && j > i ? -Infinity : x,
      );
      return { raw, scaled, masked, w: softmax(masked) };
    };

    const render = (animate = false) => {
      setMotion(animate);
      const i = this.row;
      const [x, y] = this.q[i]!;
      qx.input.value = String(x);
      qy.input.value = String(y);
      qx.out.textContent = fixed(x, 1);
      qy.out.textContent = fixed(y, 1);

      const { raw, scaled, masked, w } = weightsFor(i);
      pipeCaption.textContent = `How "${TOKENS[i]}" (q = ${fixed(x, 1)}, ${fixed(y, 1)}) scores each key`;
      pipe.forEach(({ tr, cells, weight }, j) => {
        const k = KEYS[j]!;
        const seen = Number.isFinite(masked[j]!);
        tr.className = seen ? "" : "is-masked";
        cells[0]!.textContent = `${fixed(k[0], 1)}, ${fixed(k[1], 1)}`;
        cells[1]!.textContent = fixed(raw[j]!);
        cells[2]!.textContent = fixed(scaled[j]!);
        cells[3]!.textContent = seen ? fixed(masked[j]!) : "−∞";
        weight.set(w[j]!);
      });

      const out = VALUES.reduce<V2>(
        (acc, v, j) => [acc[0] + w[j]! * v[0], acc[1] + w[j]! * v[1]],
        [0, 0],
      );
      const top = w.indexOf(Math.max(...w));
      summary.textContent = `"${TOKENS[i]}" puts ${pct(w[top]!)} of its attention on "${TOKENS[top]}". Its output is the weighted sum of the value vectors: (${fixed(out[0])}, ${fixed(out[1])}).`;

      mat.forEach(({ tr, cells }, r) => {
        const wr = weightsFor(r).w;
        tr.className = r === i ? "is-selected" : "";
        cells.forEach((c, j) => c.set(wr[j]!, "0"));
      });

      // Plot: keys as points, the query as an arrow. Dot product = how far the key lies along the arrow.
      plotTitle.textContent = `Query for "${TOKENS[i]}" drawn as an arrow; keys as points. Larger dot product means the key lies further along the arrow.`;
      const parts: SVGElement[] = [
        s("line", { x1: 10, y1: 120, x2: 230, y2: 120, class: "xp-axis" }),
        s("line", { x1: 120, y1: 10, x2: 120, y2: 230, class: "xp-axis" }),
      ];
      KEYS.forEach((k, j) => {
        const hidden = !Number.isFinite(masked[j]!);
        const r = 4 + 10 * Math.sqrt(w[j]!);
        parts.push(
          s("circle", {
            cx: px(k[0]),
            cy: py(k[1]),
            r,
            class: hidden ? "xp-key is-masked" : "xp-key",
          }),
          s(
            "text",
            {
              x: px(k[0]) + r + 3,
              y: py(k[1]) + 4,
              class: hidden ? "xp-label is-masked" : "xp-label",
            },
            TOKENS[j]!,
          ),
        );
      });
      const len = Math.hypot(x, y) || 1;
      const hx = px(x);
      const hy = py(y);
      const ux = x / len;
      const uy = -y / len;
      parts.push(
        s("line", { x1: 120, y1: 120, x2: hx, y2: hy, class: "xp-query" }),
        s("polygon", {
          points: `${hx},${hy} ${hx - 9 * ux - 4 * uy},${hy - 9 * uy + 4 * ux} ${hx - 9 * ux + 4 * uy},${hy - 9 * uy - 4 * ux}`,
          class: "xp-query-head",
        }),
        s("text", { x: 14, y: 22, class: "xp-label" }, `q for "${TOKENS[i]}"`),
      );
      plot.replaceChildren(plotTitle, ...parts);
      handle.style.left = `${(hx / PLOT) * 100}%`;
      handle.style.top = `${(hy / PLOT) * 100}%`;
    };

    // Dragging: the handle (any pointer) or anywhere on the plot (mouse only, so touch can still scroll).
    let dragging = false;
    const moveTo = (e: PointerEvent) => {
      const r = plotWrap.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * PLOT;
      const vy = ((e.clientY - r.top) / r.height) * PLOT;
      this.q[this.row] = [
        tenth((vx - PLOT / 2) / 50),
        tenth((PLOT / 2 - vy) / 50),
      ];
      render();
    };
    const start = (e: PointerEvent) => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      plotWrap.classList.add("is-dragging");
      e.preventDefault();
    };
    const end = () => {
      dragging = false;
      plotWrap.classList.remove("is-dragging");
    };
    handle.addEventListener("pointerdown", start);
    plot.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      start(e);
      moveTo(e);
    });
    handle.addEventListener("pointermove", (e) => {
      if (dragging) moveTo(e);
    });
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);

    tok.inputs.forEach((r) =>
      r.addEventListener("change", () => {
        this.row = Number(r.value);
        render(true);
      }),
    );
    qx.input.addEventListener("input", () => {
      this.q[this.row]![0] = Number(qx.input.value);
      render();
    });
    qy.input.addEventListener("input", () => {
      this.q[this.row]![1] = Number(qy.input.value);
      render();
    });
    causal.input.addEventListener("change", () => render(true));
    scale.input.addEventListener("change", () => render(true));
    reset.addEventListener("click", () => {
      this.q = QUERIES.map((v) => [...v] as V2);
      causal.input.checked = true;
      scale.input.checked = true;
      render(true);
    });
    render();
  }
}

/* Why divide by √d_k: dot products of random vectors grow with dimension and saturate softmax. */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normals(rand: () => number, n: number): number[] {
  const out: number[] = [];
  while (out.length < n) {
    const u = 1 - rand();
    const v = rand();
    out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
  }
  return out;
}

const DIMS = [2, 4, 8, 16, 32, 64, 128, 256, 512];

class ScaleLab extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";
    let seed = 7;

    const dim = slider("d_k", 0, DIMS.length - 1, 1, 6, (i) => String(DIMS[i]));
    const again = h(
      "button",
      { type: "button", class: "xp-button" },
      "New random vectors",
    );
    const rows = Array.from({ length: 8 }, (_, j) => {
      const score = h("td");
      const raw = weightCell();
      const scaled = weightCell();
      const tr = h(
        "tr",
        {},
        h("th", { scope: "row" }, String(j + 1)),
        score,
        raw.td,
        scaled.td,
      );
      return { tr, score, raw, scaled };
    });
    const table = h(
      "table",
      { class: "xp-table" },
      h("caption", {}, "One random query against eight random keys"),
      tableHead(["Key", "q·k", "weight, raw", "weight, ÷√d_k"]),
      h("tbody", {}, ...rows.map((r) => r.tr)),
    );
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });

    const root = h(
      "div",
      { class: "xp" },
      head("Why scale by √d_k"),
      h("div", { class: "xp-controls xp-row" }, dim.wrap, again),
      summary,
      h("div", { class: "xp-scroll" }, table),
    );
    this.replaceChildren(root);
    const setMotion = motion(root);

    const render = (animate = false) => {
      setMotion(animate);
      const d = DIMS[Number(dim.input.value)]!;
      dim.out.textContent = String(d);
      const rand = mulberry32(seed * 1000 + d);
      const q = normals(rand, d);
      const keys = Array.from({ length: 8 }, () => normals(rand, d));
      const scores = keys.map((k) => dot(q, k));
      const raw = softmax(scores);
      const scaled = softmax(scores.map((x) => x / Math.sqrt(d)));
      rows.forEach((r, j) => {
        r.score.textContent = fixed(scores[j]!, 1);
        r.raw.set(raw[j]!);
        r.scaled.set(scaled[j]!);
      });
      const spread = Math.sqrt(
        scores.reduce((acc, x) => acc + x * x, 0) / scores.length,
      );
      summary.textContent = `At d_k = ${d}, the scores spread out to about ±${fixed(spread, 1)} (theory: √${d} ≈ ${fixed(Math.sqrt(d), 1)}). Without scaling, the top key gets ${pct(Math.max(...raw))} of the attention. With it, ${pct(Math.max(...scaled))}.`;
    };

    dim.input.addEventListener("input", () => render());
    again.addEventListener("click", () => {
      seed += 1;
      render(true);
    });
    render();
  }
}

/* ------------------------------------------------------------------ */
/* Part 2: GPT-2's parameter count                                     */
/* ------------------------------------------------------------------ */

interface Shape {
  name: string;
  d: number;
  layers: number;
  heads: number;
}

const GPT2: Shape[] = [
  { name: "GPT-2 small", d: 768, layers: 12, heads: 12 },
  { name: "GPT-2 medium", d: 1024, layers: 24, heads: 16 },
  { name: "GPT-2 large", d: 1280, layers: 36, heads: 20 },
  { name: "GPT-2 XL", d: 1600, layers: 48, heads: 25 },
];

/** GPT-2 parameter count by component. Biases included, output head tied to the token embedding. */
export function gpt2Params(
  vocab: number,
  ctx: number,
  d: number,
  layers: number,
) {
  const tokenEmb = vocab * d;
  const posEmb = ctx * d;
  const attention = layers * (4 * d * d + 4 * d); // c_attn (d×3d + 3d) + c_proj (d×d + d)
  const mlp = layers * (8 * d * d + 5 * d); // c_fc (d×4d + 4d) + c_proj (4d×d + d)
  const norms = layers * 4 * d + 2 * d; // ln_1, ln_2 per block (gain + bias), plus ln_f
  return {
    tokenEmb,
    posEmb,
    attention,
    mlp,
    norms,
    total: tokenEmb + posEmb + attention + mlp + norms,
  };
}

class GptShape extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const preset = select("Preset", [...GPT2.map((g) => g.name), "Custom"], 0);
    const d = slider("d_model", 64, 2048, 64, 768);
    const layers = slider("Layers", 1, 64, 1, 12);
    const heads = slider("Heads", 1, 32, 1, 12);
    const vocab = numberField("Vocabulary", 50257, {
      min: 1,
      integer: true,
      allowK: true,
    });
    const ctx = numberField("Context length", 1024, {
      min: 1,
      integer: true,
      allowK: true,
    });

    const parts = [
      { key: "tokenEmb", label: "Token embeddings", cls: "c1" },
      { key: "posEmb", label: "Position embeddings", cls: "c2" },
      { key: "attention", label: "Attention", cls: "c3" },
      { key: "mlp", label: "MLP", cls: "c4" },
      { key: "norms", label: "Layer norms", cls: "c5" },
    ] as const;

    // The answer sits above the controls so it stays in view while you drag on a phone.
    const total = h("p", { class: "xp-big", "aria-live": "polite" });
    const segs = parts.map((part) =>
      h("span", { class: `xp-seg ${part.cls}` }),
    );
    const stack = h(
      "div",
      { class: "xp-stack", "aria-hidden": "true" },
      ...segs,
    );
    const legend = h("ul", { class: "xp-legend" });
    const notes = h("p", { class: "xp-summary" });
    const shapes = h("tbody");
    const shapeTable = h(
      "table",
      { class: "xp-table" },
      h("caption", {}, "The weight matrices in one block"),
      tableHead(["Matrix", "Shape", "Parameters"]),
      shapes,
    );

    const root = h(
      "div",
      { class: "xp" },
      head("Parameter counter"),
      total,
      stack,
      legend,
      h(
        "div",
        { class: "xp-controls xp-grid" },
        preset.wrap,
        d.wrap,
        layers.wrap,
        heads.wrap,
        vocab.wrap,
        ctx.wrap,
      ),
      notes,
      h("div", { class: "xp-scroll" }, shapeTable),
    );
    this.replaceChildren(root);
    const setMotion = motion(root);

    const render = (animate = false) => {
      setMotion(animate);
      const D = num(d.input, 768);
      const L = num(layers.input, 12);
      const H = num(heads.input, 12);
      const V = vocab.value();
      const C = ctx.value();
      d.out.textContent = String(D);
      layers.out.textContent = String(L);
      heads.out.textContent = String(H);
      const match = GPT2.findIndex(
        (g) => g.d === D && g.layers === L && g.heads === H,
      );
      preset.input.value = String(
        match === -1 || V !== 50257 || C !== 1024 ? GPT2.length : match,
      );

      const p = gpt2Params(V, C, D, L);
      total.textContent = `${int(p.total)} parameters (${params(p.total)})`;
      segs.forEach((seg, i) => {
        seg.style.width = `${(p[parts[i]!.key] / p.total) * 100}%`;
      });
      legend.replaceChildren(
        ...parts.map((part) =>
          h(
            "li",
            {},
            h("span", {
              class: `xp-swatch ${part.cls}`,
              "aria-hidden": "true",
            }),
            `${part.label}: ${params(p[part.key])} (${pct(p[part.key] / p.total)})`,
          ),
        ),
      );
      const splits = D % H === 0;
      heads.wrap.classList.toggle("is-invalid", !splits);
      heads.input.setAttribute("aria-invalid", String(!splits));
      const headNote = splits
        ? `${H} heads of ${D / H} dimensions each. Change the head count and the total stays the same: heads split d_model, they don't add weights.`
        : `${D} doesn't divide evenly into ${H} heads, so this shape wouldn't build. Pick a head count that divides d_model.`;
      notes.textContent = `${headNote} In 16-bit floats the weights take ${bytes(2 * p.total)}, and generating one token costs about 2 × ${params(p.total)} = ${params(2 * p.total)} FLOPs.`;
      const row = (name: string, shape: string, n: number) =>
        h(
          "tr",
          {},
          h("th", { scope: "row" }, name),
          h("td", {}, shape),
          h("td", {}, int(n)),
        );
      shapes.replaceChildren(
        row(
          "Query, key, value projection",
          `${D} × ${3 * D}`,
          3 * D * D + 3 * D,
        ),
        row("Attention output projection", `${D} × ${D}`, D * D + D),
        row("MLP up-projection", `${D} × ${4 * D}`, 4 * D * D + 4 * D),
        row("MLP down-projection", `${4 * D} × ${D}`, 4 * D * D + D),
        row("Two layer norms", `2 × 2 × ${D}`, 4 * D),
      );
    };

    preset.input.addEventListener("change", () => {
      const g = GPT2[Number(preset.input.value)];
      if (!g) return;
      d.input.value = String(g.d);
      layers.input.value = String(g.layers);
      heads.input.value = String(g.heads);
      vocab.set(50257);
      ctx.set(1024);
      render(true);
    });
    for (const el of [
      d.input,
      layers.input,
      heads.input,
      vocab.input,
      ctx.input,
    ])
      el.addEventListener("input", () => render());
    render();
  }
}

/* ------------------------------------------------------------------ */
/* Part 3: a serving budget                                            */
/* ------------------------------------------------------------------ */

interface Setup {
  name: string;
  paramsB: number;
  layers: number;
  kvHeads: number;
  headDim: number;
  context: number;
  chips: number;
  memGB: number;
  bwGBs: number;
  tflops: number;
  wBytes: number;
  kvBytes: number;
}

const SETUPS: Setup[] = [
  {
    name: "LLaMA 2-13B, 8× TPU v5e, full multi-head attention",
    paramsB: 13,
    layers: 40,
    kvHeads: 40,
    headDim: 128,
    context: 8192,
    chips: 8,
    memGB: 17.18, // 16 GiB per chip
    bwGBs: 820,
    tflops: 197,
    wBytes: 2,
    kvBytes: 2,
  },
  {
    name: "LLaMA 2-13B, 8× TPU v5e, GQA with 8 KV heads",
    paramsB: 13,
    layers: 40,
    kvHeads: 8,
    headDim: 128,
    context: 8192,
    chips: 8,
    memGB: 17.18,
    bwGBs: 820,
    tflops: 197,
    wBytes: 2,
    kvBytes: 2,
  },
  {
    name: "52B model, 4× A100 40 GB (kipply's example)",
    paramsB: 52,
    layers: 64,
    kvHeads: 64,
    headDim: 128,
    context: 2048,
    chips: 4,
    memGB: 40,
    bwGBs: 1500,
    tflops: 312,
    wBytes: 2,
    kvBytes: 2,
  },
];

export function servingBudget(c: Setup, batch: number) {
  const P = c.paramsB * 1e9;
  const weights = P * c.wBytes;
  const kvPerToken = 2 * c.kvBytes * c.headDim * c.kvHeads * c.layers;
  const kvPerSeq = kvPerToken * c.context;
  const memory = c.chips * c.memGB * 1e9;
  const bw = c.chips * c.bwGBs * 1e9;
  const flops = c.chips * c.tflops * 1e12;
  const free = memory - weights;
  const maxBatch = free > 0 ? Math.floor(free / kvPerSeq) : 0;
  const kvTime = (batch * kvPerSeq) / bw;
  const matmulTime = (2 * batch * P) / flops;
  const weightTime = weights / bw;
  const step = kvTime + Math.max(matmulTime, weightTime);
  const critical = (c.tflops * 1e12 * c.wBytes) / (2 * c.bwGBs * 1e9);
  return {
    weights,
    kvPerToken,
    kvPerSeq,
    memory,
    free,
    maxBatch,
    kvTime,
    matmulTime,
    weightTime,
    step,
    tokensPerSec: batch / step,
    critical,
    fits: batch <= maxBatch,
  };
}

// Throughput chart geometry (viewBox 320 × 190).
const CH = { L: 44, R: 310, T: 14, B: 160 };

class ServingBudget extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const preset = select("Setup", [...SETUPS.map((x) => x.name), "Custom"], 0);
    const f = {
      paramsB: numberField("Parameters (billions)", 13, { min: 0.1 }),
      layers: numberField("Layers", 40, { min: 1, integer: true }),
      kvHeads: numberField("KV heads", 40, { min: 1, integer: true }),
      headDim: numberField("Head dimension", 128, { min: 1, integer: true }),
      context: numberField("Tokens per sequence", 8192, {
        min: 1,
        integer: true,
        allowK: true,
      }),
      chips: numberField("Chips", 8, { min: 1, integer: true }),
      memGB: numberField("Memory per chip (GB)", 17.18, { min: 1 }),
      bwGBs: numberField("Memory bandwidth per chip (GB/s)", 820, { min: 1 }),
      tflops: numberField("Compute per chip (TFLOP/s)", 197, { min: 1 }),
    };
    const wBytes = select("Weights", ["bf16 (2 bytes)", "int8 (1 byte)"], 0);
    const kvBytes = select("KV cache", ["bf16 (2 bytes)", "int8 (1 byte)"], 0);
    // Log-scale batch slider: 0..100 → 1..1024.
    const toBatch = (v: number) => Math.max(1, Math.round(2 ** (v / 10)));
    const batch = slider("Batch size", 0, 100, 1, 0, (v) => String(toBatch(v)));

    const memSegs = ["c1", "c3", "c0"].map((cls) =>
      h("span", { class: `xp-seg ${cls}` }),
    );
    const memBar = h(
      "div",
      { class: "xp-stack", "aria-hidden": "true" },
      ...memSegs,
    );
    const memLegend = h("ul", { class: "xp-legend" });
    const facts = h("dl", { class: "xp-facts" });
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });
    const chart = s("svg", {
      viewBox: "0 0 320 190",
      class: "xp-chart",
      role: "img",
    });

    // Hick's law: the three choices that drive the post come first; the nine raw numbers wait behind a
    // disclosure for readers who want a custom setup.
    const more = h(
      "details",
      { class: "xp-more" },
      h("summary", {}, "Model and hardware numbers"),
      h(
        "div",
        { class: "xp-controls xp-grid" },
        ...Object.values(f).map((x) => x.wrap),
      ),
    );

    const root = h(
      "div",
      { class: "xp" },
      head("Serving budget"),
      h(
        "div",
        { class: "xp-controls" },
        preset.wrap,
        h("div", { class: "xp-grid xp-pair" }, wBytes.wrap, kvBytes.wrap),
        batch.wrap,
      ),
      memBar,
      memLegend,
      summary,
      h(
        "div",
        { class: "xp-figure" },
        chart,
        h(
          "p",
          { class: "xp-note" },
          "Drag across the chart to change the batch size.",
        ),
      ),
      facts,
      more,
    );
    this.replaceChildren(root);
    const setMotion = motion(root);

    const read = (): Setup => ({
      name: "",
      paramsB: f.paramsB.value(),
      layers: f.layers.value(),
      kvHeads: f.kvHeads.value(),
      headDim: f.headDim.value(),
      context: f.context.value(),
      chips: f.chips.value(),
      memGB: f.memGB.value(),
      bwGBs: f.bwGBs.value(),
      tflops: f.tflops.value(),
      wBytes: wBytes.input.value === "1" ? 1 : 2,
      kvBytes: kvBytes.input.value === "1" ? 1 : 2,
    });

    const load = (c: Setup) => {
      for (const [k, field] of Object.entries(f))
        field.set(c[k as keyof typeof f]);
      wBytes.input.value = c.wBytes === 1 ? "1" : "0";
      kvBytes.input.value = c.kvBytes === 1 ? "1" : "0";
    };

    const fact = (dt: string, dd: string) => [h("dt", {}, dt), h("dd", {}, dd)];
    let xMax = 16; // the chart's x range, kept for scrubbing

    const render = (animate = false, custom = false) => {
      setMotion(animate);
      const c = read();
      if (custom) preset.input.value = String(SETUPS.length);
      const B = toBatch(Number(batch.input.value));
      batch.out.textContent = String(B);
      const r = servingBudget(c, B);

      // Memory bar: weights, KV for this batch, what's left.
      const used = Math.min(r.memory, r.weights + B * r.kvPerSeq);
      const segs: [number, string][] = [
        [Math.min(r.weights, r.memory), `Weights ${bytes(r.weights)}`],
        [
          Math.max(0, used - Math.min(r.weights, r.memory)),
          `KV cache for ${B} × ${int(c.context)} tokens: ${bytes(B * r.kvPerSeq)}`,
        ],
        [
          Math.max(0, r.memory - used),
          `Free ${bytes(Math.max(0, r.memory - r.weights - B * r.kvPerSeq))}`,
        ],
      ];
      memBar.classList.toggle("is-over", !r.fits);
      memSegs.forEach((seg, i) => {
        seg.style.width = `${(segs[i]![0] / r.memory) * 100}%`;
      });
      memLegend.replaceChildren(
        ...segs.map(([, label], i) =>
          h(
            "li",
            {},
            h("span", {
              class: `xp-swatch ${memSegs[i]!.classList[1]}`,
              "aria-hidden": "true",
            }),
            label,
          ),
        ),
      );

      facts.replaceChildren(
        ...fact(
          "Total memory",
          `${bytes(r.memory)} on ${c.chips} chip${c.chips === 1 ? "" : "s"}`,
        ),
        ...fact(
          "KV cache per token",
          `${bytes(r.kvPerToken)} = 2 × ${c.kvBytes} × ${c.headDim} × ${c.kvHeads} × ${c.layers}`,
        ),
        ...fact("KV cache per sequence", bytes(r.kvPerSeq)),
        ...fact(
          "Largest batch that fits",
          r.weights > r.memory
            ? "none: the weights alone don't fit"
            : int(r.maxBatch),
        ),
        ...fact(
          "Critical batch",
          `${int(r.critical)} (below this, decoding waits on memory)`,
        ),
        ...fact(
          "Step time at this batch",
          `${fixed(r.step * 1e3, 2)} ms = ${fixed(r.kvTime * 1e3, 2)} ms reading the KV cache + ${fixed(Math.max(r.weightTime, r.matmulTime) * 1e3, 2)} ms for the weights`,
        ),
        ...fact("Throughput", `${int(r.tokensPerSec)} tokens/s`),
      );

      const bound =
        r.matmulTime > r.weightTime ? "compute" : "memory bandwidth";
      summary.textContent = r.fits
        ? `At batch ${B}, each step takes ${fixed(r.step * 1e3, 1)} ms and the weight matmuls are limited by ${bound}. ${pct(r.kvTime / r.step)} of the step is spent reading the KV cache.`
        : `Batch ${B} doesn't fit: it needs ${bytes(r.weights + B * r.kvPerSeq)} and the chips have ${bytes(r.memory)}. The most that fits is ${int(r.maxBatch)}.`;

      drawChart(c, r.maxBatch, r.critical, B);
    };

    const drawChart = (
      c: Setup,
      maxBatch: number,
      critical: number,
      current: number,
    ) => {
      const { L, R, T, B: Bm } = CH;
      xMax = Math.min(
        1024,
        Math.max(16, Math.ceil(Math.max(maxBatch * 1.3, critical * 1.3))),
      );
      const pts: [number, number, boolean][] = [];
      for (let b = 1; b <= xMax; b += Math.max(1, Math.floor(xMax / 120))) {
        const r = servingBudget(c, b);
        pts.push([b, r.tokensPerSec, r.fits]);
      }
      const yMax = Math.max(...pts.map((p) => p[1])) * 1.1 || 1;
      const x = (b: number) => L + ((b - 1) / Math.max(1, xMax - 1)) * (R - L);
      const y = (v: number) => Bm - (v / yMax) * (Bm - T);
      const path = (sel: (p: [number, number, boolean]) => boolean) =>
        pts
          .filter(sel)
          .map(
            (p, i) =>
              `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`,
          )
          .join(" ");
      // A guide's label sits on whichever side of its line has room.
      const guideLabel = (gx: number, gy: number, text: string) =>
        gx > (L + R) / 2
          ? s("text", { x: gx - 4, y: gy, class: "xp-label xp-end" }, text)
          : s("text", { x: gx + 4, y: gy, class: "xp-label" }, text);
      const cur = servingBudget(c, current);
      const els: SVGElement[] = [
        s(
          "title",
          {},
          `Throughput against batch size, up to batch ${xMax}. Memory runs out at batch ${maxBatch}.`,
        ),
        s("line", { x1: L, y1: Bm, x2: R, y2: Bm, class: "xp-axis" }),
        s("line", { x1: L, y1: T, x2: L, y2: Bm, class: "xp-axis" }),
        s("text", { x: L - 4, y: T + 4, class: "xp-label xp-end" }, int(yMax)),
        s("text", { x: L - 4, y: Bm, class: "xp-label xp-end" }, "0"),
        s("text", { x: L, y: Bm + 14, class: "xp-label" }, "1"),
        s("text", { x: R, y: Bm + 14, class: "xp-label xp-end" }, int(xMax)),
        s(
          "text",
          { x: (L + R) / 2, y: Bm + 26, class: "xp-label xp-middle" },
          "batch size",
        ),
        s("text", { x: R, y: T + 4, class: "xp-label xp-end" }, "tokens/s"),
        s("path", { d: path((p) => p[2]), class: "xp-line" }),
        s("path", { d: path((p) => !p[2]), class: "xp-line is-over" }),
      ];
      if (critical <= xMax) {
        els.push(
          s("line", {
            x1: x(critical),
            y1: T,
            x2: x(critical),
            y2: Bm,
            class: "xp-guide",
          }),
          guideLabel(x(critical), Bm - 6, "critical"),
        );
      }
      if (maxBatch >= 1 && maxBatch <= xMax) {
        els.push(
          s("line", {
            x1: x(maxBatch),
            y1: T,
            x2: x(maxBatch),
            y2: Bm,
            class: "xp-guide is-limit",
          }),
          guideLabel(x(maxBatch), Bm - 22, "memory full"),
        );
      }
      if (current <= xMax) {
        els.push(
          s("line", {
            x1: x(current),
            y1: y(cur.tokensPerSec),
            x2: x(current),
            y2: Bm,
            class: "xp-cursor",
          }),
          s("circle", {
            cx: x(current),
            cy: y(cur.tokensPerSec),
            r: 4,
            class: cur.fits ? "xp-dot" : "xp-dot is-over",
          }),
        );
      }
      chart.replaceChildren(...els);
    };

    // Scrubbing the chart sets the batch. A mouse acts on press; touch waits for a sideways move or a tap,
    // so a vertical swipe still scrolls the page (touch-action: pan-y) without changing anything.
    let scrubbing = false;
    const scrubTo = (e: PointerEvent) => {
      const r = chart.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * 320;
      const b = 1 + ((vx - CH.L) / (CH.R - CH.L)) * (xMax - 1);
      const clamped = Math.max(1, Math.min(xMax, b));
      batch.input.value = String(Math.round(10 * Math.log2(clamped)));
      render();
    };
    chart.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      scrubbing = true;
      chart.setPointerCapture(e.pointerId);
      if (e.pointerType === "mouse") scrubTo(e);
    });
    chart.addEventListener("pointermove", (e) => {
      if (scrubbing) scrubTo(e);
    });
    chart.addEventListener("pointerup", (e) => {
      if (scrubbing) scrubTo(e);
      scrubbing = false;
    });
    chart.addEventListener("pointercancel", () => (scrubbing = false));

    preset.input.addEventListener("change", () => {
      const c = SETUPS[Number(preset.input.value)];
      if (c) load(c);
      render(true);
    });
    for (const field of Object.values(f))
      field.input.addEventListener("input", () => render(false, true));
    wBytes.input.addEventListener("change", () => render(true, true));
    kvBytes.input.addEventListener("change", () => render(true, true));
    batch.input.addEventListener("input", () => render());
    load(SETUPS[0]!);
    render();
  }
}

const define = (name: string, ctor: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, ctor);
};
define("attention-lab", AttentionLab);
define("scale-lab", ScaleLab);
define("gpt-shape", GptShape);
define("serving-budget", ServingBudget);
