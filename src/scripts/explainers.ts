// Interactive widgets for the "LLMs by hand" writing series. Each one is a custom element placed in a
// Markdown post as raw HTML, with static fallback content inside it. With JS off, the fallback stays.
// Every number shown is computed here from the formulas in the post; nothing is hard-coded output.

type Kid = Node | string;
type V2 = [number, number];

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean> = {},
  ...kids: Kid[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false) continue;
    e.setAttribute(k, v === true ? "" : v);
  }
  e.append(...kids);
  return e;
}

const SVG_NS = "http://www.w3.org/2000/svg";
function s(
  tag: string,
  attrs: Record<string, string | number> = {},
  ...kids: Kid[]
): SVGElement {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
}

let uid = 0;
const nextId = (p: string) => `${p}-${++uid}`;

const fixed = (n: number, d = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const int = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 && n > 0 ? 1 : 0)}%`;

function bytes(b: number): string {
  if (b >= 1e9) return `${fixed(b / 1e9, 1)} GB`;
  if (b >= 1e6) return `${fixed(b / 1e6, 2)} MB`;
  if (b >= 1e3) return `${fixed(b / 1e3, 0)} kB`;
  return `${int(b)} B`;
}

function params(n: number): string {
  if (n >= 1e9) return `${fixed(n / 1e9, 2)}B`;
  if (n >= 1e6) return `${fixed(n / 1e6, 1)}M`;
  return int(n);
}

function softmax(xs: number[]): number[] {
  const finite = xs.filter(Number.isFinite);
  const m = Math.max(...finite);
  const ex = xs.map((x) => (Number.isFinite(x) ? Math.exp(x - m) : 0));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

const dot = (a: number[], b: number[]) =>
  a.reduce((acc, x, i) => acc + x * b[i]!, 0);

function slider(
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  fmt = (v: number) => String(v),
) {
  const id = nextId("xp");
  const input = h("input", {
    type: "range",
    id,
    min: String(min),
    max: String(max),
    step: String(step),
    value: String(value),
  });
  const out = h("output", { for: id }, fmt(value));
  const wrap = h(
    "div",
    { class: "xp-field" },
    h("label", { for: id }, label),
    input,
    out,
  );
  return { wrap, input, out, fmt };
}

function numberField(
  label: string,
  value: number,
  attrs: Record<string, string> = {},
) {
  const id = nextId("xp");
  const input = h("input", {
    type: "number",
    id,
    value: String(value),
    inputmode: "decimal",
    ...attrs,
  });
  const wrap = h(
    "div",
    { class: "xp-field xp-field-number" },
    h("label", { for: id }, label),
    input,
  );
  return { wrap, input };
}

function checkbox(label: string, checked: boolean) {
  const input = h("input", { type: "checkbox", checked });
  const wrap = h("label", { class: "xp-check" }, input, label);
  return { wrap, input };
}

function select(label: string, options: string[], value = 0) {
  const id = nextId("xp");
  const input = h(
    "select",
    { id },
    ...options.map((o, i) =>
      h("option", { value: String(i), selected: i === value }, o),
    ),
  );
  const wrap = h(
    "div",
    { class: "xp-field xp-field-select" },
    h("label", { for: id }, label),
    input,
  );
  return { wrap, input };
}

function bar(): { el: HTMLSpanElement; set: (f: number) => void } {
  const fill = h("span", { class: "xp-bar-fill" });
  const el = h("span", { class: "xp-bar", "aria-hidden": "true" }, fill);
  return {
    el,
    set: (f) => (fill.style.width = `${Math.max(0, Math.min(1, f)) * 100}%`),
  };
}

const num = (input: HTMLInputElement | HTMLSelectElement, fallback: number) => {
  const v = Number(input.value);
  return Number.isFinite(v) ? v : fallback;
};

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

class AttentionLab extends HTMLElement {
  private q: V2[] = QUERIES.map((v) => [...v] as V2);
  private row = 2;

  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const radios = h(
      "fieldset",
      { class: "xp-radios" },
      h("legend", {}, "Query token"),
    );
    const name = nextId("tok");
    const radioInputs = TOKENS.map((t, i) => {
      const input = h("input", {
        type: "radio",
        name,
        value: String(i),
        checked: i === this.row,
      });
      radios.append(h("label", {}, input, t));
      return input;
    });
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
    const reset = h("button", { type: "button", class: "xp-button" }, "Reset");

    const plot = s("svg", {
      viewBox: "0 0 240 240",
      class: "xp-plot",
      role: "img",
    });
    const plotTitle = s("title");
    plot.append(plotTitle);

    const pipeHead = h(
      "tr",
      {},
      ...["Key", "k", "q·k", "scaled", "masked", "weight"].map((c) =>
        h("th", { scope: "col" }, c),
      ),
    );
    const pipeRows = TOKENS.map(() => h("tr"));
    const pipeCaption = h("caption");
    const pipe = h(
      "table",
      { class: "xp-table" },
      pipeCaption,
      h("thead", {}, pipeHead),
      h("tbody", {}, ...pipeRows),
    );

    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });

    const matHead = h(
      "tr",
      {},
      h("td"),
      ...TOKENS.map((t) => h("th", { scope: "col" }, t)),
    );
    const matRows = TOKENS.map(() => h("tr"));
    const mat = h(
      "table",
      { class: "xp-table xp-matrix" },
      h(
        "caption",
        {},
        "Every token at once: each row is one query, each column one key. Rows sum to 100%.",
      ),
      h("thead", {}, matHead),
      h("tbody", {}, ...matRows),
    );

    const controls = h(
      "div",
      { class: "xp-controls" },
      radios,
      qx.wrap,
      qy.wrap,
      causal.wrap,
      scale.wrap,
      reset,
    );
    this.replaceChildren(
      h(
        "div",
        { class: "xp" },
        h("p", { class: "xp-title" }, "Attention lab"),
        h("div", { class: "xp-split" }, controls, plot),
        h("div", { class: "xp-scroll" }, pipe),
        summary,
        h("div", { class: "xp-scroll" }, mat),
      ),
    );

    const weightsFor = (i: number) => {
      const raw = KEYS.map((k) => dot(this.q[i]!, k));
      const scaled = raw.map((x) => (scale.input.checked ? x / Math.SQRT2 : x));
      const masked = scaled.map((x, j) =>
        causal.input.checked && j > i ? -Infinity : x,
      );
      return { raw, scaled, masked, w: softmax(masked) };
    };

    const render = () => {
      const i = this.row;
      const [x, y] = this.q[i]!;
      qx.input.value = String(x);
      qy.input.value = String(y);
      qx.out.textContent = fixed(x, 1);
      qy.out.textContent = fixed(y, 1);

      const { raw, scaled, masked, w } = weightsFor(i);
      pipeCaption.textContent = `How "${TOKENS[i]}" (q = ${fixed(x, 1)}, ${fixed(y, 1)}) scores each key`;
      pipeRows.forEach((tr, j) => {
        const b = bar();
        b.set(w[j]!);
        const k = KEYS[j]!;
        tr.className = Number.isFinite(masked[j]!) ? "" : "is-masked";
        tr.replaceChildren(
          h("th", { scope: "row" }, TOKENS[j]!),
          h("td", {}, `${fixed(k[0], 1)}, ${fixed(k[1], 1)}`),
          h("td", {}, fixed(raw[j]!)),
          h("td", {}, fixed(scaled[j]!)),
          h("td", {}, Number.isFinite(masked[j]!) ? fixed(masked[j]!) : "−∞"),
          h("td", { class: "xp-weight" }, h("span", {}, pct(w[j]!)), b.el),
        );
      });

      const out = VALUES.reduce<V2>(
        (acc, v, j) => [acc[0] + w[j]! * v[0], acc[1] + w[j]! * v[1]],
        [0, 0],
      );
      const top = w.indexOf(Math.max(...w));
      summary.textContent = `"${TOKENS[i]}" puts ${pct(w[top]!)} of its attention on "${TOKENS[top]}". Its output is the weighted sum of the value vectors: (${fixed(out[0])}, ${fixed(out[1])}).`;

      matRows.forEach((tr, r) => {
        const wr = weightsFor(r).w;
        tr.className = r === i ? "is-selected" : "";
        tr.replaceChildren(
          h("th", { scope: "row" }, TOKENS[r]!),
          ...wr.map((v) => {
            const b = bar();
            b.set(v);
            return h(
              "td",
              { class: "xp-weight" },
              h("span", {}, v === 0 ? "0" : pct(v)),
              b.el,
            );
          }),
        );
      });

      // Plot: keys as points, the query as an arrow. Dot product = how far the key lies along the arrow.
      const px = (v: number) => 120 + v * 50;
      const py = (v: number) => 120 - v * 50;
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
    };

    radioInputs.forEach((r) =>
      r.addEventListener("change", () => {
        this.row = Number(r.value);
        render();
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
    causal.input.addEventListener("change", render);
    scale.input.addEventListener("change", render);
    reset.addEventListener("click", () => {
      this.q = QUERIES.map((v) => [...v] as V2);
      causal.input.checked = true;
      scale.input.checked = true;
      render();
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
    const rows = Array.from({ length: 8 }, () => h("tr"));
    const table = h(
      "table",
      { class: "xp-table" },
      h("caption", {}, "One random query against eight random keys"),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          ...["Key", "q·k", "weight, raw", "weight, ÷√d_k"].map((c) =>
            h("th", { scope: "col" }, c),
          ),
        ),
      ),
      h("tbody", {}, ...rows),
    );
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });

    this.replaceChildren(
      h(
        "div",
        { class: "xp" },
        h("p", { class: "xp-title" }, "Why scale by √d_k"),
        h("div", { class: "xp-controls xp-row" }, dim.wrap, again),
        h("div", { class: "xp-scroll" }, table),
        summary,
      ),
    );

    const render = () => {
      const d = DIMS[Number(dim.input.value)]!;
      dim.out.textContent = String(d);
      const rand = mulberry32(seed * 1000 + d);
      const q = normals(rand, d);
      const keys = Array.from({ length: 8 }, () => normals(rand, d));
      const scores = keys.map((k) => dot(q, k));
      const raw = softmax(scores);
      const scaled = softmax(scores.map((x) => x / Math.sqrt(d)));
      rows.forEach((tr, j) => {
        const a = bar();
        const b = bar();
        a.set(raw[j]!);
        b.set(scaled[j]!);
        tr.replaceChildren(
          h("th", { scope: "row" }, String(j + 1)),
          h("td", {}, fixed(scores[j]!, 1)),
          h("td", { class: "xp-weight" }, h("span", {}, pct(raw[j]!)), a.el),
          h("td", { class: "xp-weight" }, h("span", {}, pct(scaled[j]!)), b.el),
        );
      });
      const spread = Math.sqrt(
        scores.reduce((acc, x) => acc + x * x, 0) / scores.length,
      );
      summary.textContent = `At d_k = ${d}, the scores spread out to about ±${fixed(spread, 1)} (theory: √${d} ≈ ${fixed(Math.sqrt(d), 1)}). Without scaling, the top key gets ${pct(Math.max(...raw))} of the attention. With it, ${pct(Math.max(...scaled))}.`;
    };

    dim.input.addEventListener("input", render);
    again.addEventListener("click", () => {
      seed += 1;
      render();
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
    const vocab = numberField("Vocabulary", 50257, { min: "1", step: "1" });
    const ctx = numberField("Context length", 1024, { min: "1", step: "1" });

    const total = h("p", { class: "xp-big", "aria-live": "polite" });
    const stack = h("div", { class: "xp-stack", "aria-hidden": "true" });
    const legend = h("ul", { class: "xp-legend" });
    const notes = h("p", { class: "xp-summary" });
    const shapes = h("tbody");
    const shapeTable = h(
      "table",
      { class: "xp-table" },
      h("caption", {}, "The weight matrices in one block"),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          ...["Matrix", "Shape", "Parameters"].map((c) =>
            h("th", { scope: "col" }, c),
          ),
        ),
      ),
      shapes,
    );

    this.replaceChildren(
      h(
        "div",
        { class: "xp" },
        h("p", { class: "xp-title" }, "Parameter counter"),
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
        total,
        stack,
        legend,
        notes,
        h("div", { class: "xp-scroll" }, shapeTable),
      ),
    );

    const parts = [
      { key: "tokenEmb", label: "Token embeddings", cls: "c1" },
      { key: "posEmb", label: "Position embeddings", cls: "c2" },
      { key: "attention", label: "Attention", cls: "c3" },
      { key: "mlp", label: "MLP", cls: "c4" },
      { key: "norms", label: "Layer norms", cls: "c5" },
    ] as const;

    const render = () => {
      const D = num(d.input, 768);
      const L = num(layers.input, 12);
      const H = num(heads.input, 12);
      const V = Math.max(1, num(vocab.input, 50257));
      const C = Math.max(1, num(ctx.input, 1024));
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
      stack.replaceChildren(
        ...parts.map((part) => {
          const seg = h("span", { class: `xp-seg ${part.cls}` });
          seg.style.width = `${(p[part.key] / p.total) * 100}%`;
          return seg;
        }),
      );
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
      const headNote =
        D % H === 0
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
      vocab.input.value = "50257";
      ctx.input.value = "1024";
      render();
    });
    for (const el of [
      d.input,
      layers.input,
      heads.input,
      vocab.input,
      ctx.input,
    ])
      el.addEventListener("input", render);
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

class ServingBudget extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const preset = select("Setup", [...SETUPS.map((x) => x.name), "Custom"], 0);
    const f = {
      paramsB: numberField("Parameters (billions)", 13, {
        min: "0.1",
        step: "0.1",
      }),
      layers: numberField("Layers", 40, { min: "1", step: "1" }),
      kvHeads: numberField("KV heads", 40, { min: "1", step: "1" }),
      headDim: numberField("Head dimension", 128, { min: "1", step: "1" }),
      context: numberField("Tokens per sequence", 8192, {
        min: "1",
        step: "1",
      }),
      chips: numberField("Chips", 8, { min: "1", step: "1" }),
      memGB: numberField("Memory per chip (GB)", 17.18, {
        min: "1",
        step: "0.01",
      }),
      bwGBs: numberField("Memory bandwidth per chip (GB/s)", 820, {
        min: "1",
        step: "1",
      }),
      tflops: numberField("Compute per chip (TFLOP/s)", 197, {
        min: "1",
        step: "1",
      }),
    };
    const wBytes = select("Weights", ["bf16 (2 bytes)", "int8 (1 byte)"], 0);
    const kvBytes = select("KV cache", ["bf16 (2 bytes)", "int8 (1 byte)"], 0);
    // Log-scale batch slider: 0..100 → 1..1024.
    const toBatch = (v: number) => Math.max(1, Math.round(2 ** (v / 10)));
    const batch = slider("Batch size", 0, 100, 1, 0, (v) => String(toBatch(v)));

    const memBar = h("div", { class: "xp-stack", "aria-hidden": "true" });
    const memLegend = h("ul", { class: "xp-legend" });
    const facts = h("dl", { class: "xp-facts" });
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });
    const chart = s("svg", {
      viewBox: "0 0 320 190",
      class: "xp-chart",
      role: "img",
    });

    this.replaceChildren(
      h(
        "div",
        { class: "xp" },
        h("p", { class: "xp-title" }, "Serving budget"),
        h("div", { class: "xp-controls" }, preset.wrap),
        h(
          "div",
          { class: "xp-controls xp-grid" },
          ...Object.values(f).map((x) => x.wrap),
          wBytes.wrap,
          kvBytes.wrap,
        ),
        h("div", { class: "xp-controls" }, batch.wrap),
        memBar,
        memLegend,
        facts,
        summary,
        chart,
      ),
    );

    const read = (): Setup => ({
      name: "",
      paramsB: Math.max(0.1, num(f.paramsB.input, 13)),
      layers: Math.max(1, num(f.layers.input, 40)),
      kvHeads: Math.max(1, num(f.kvHeads.input, 40)),
      headDim: Math.max(1, num(f.headDim.input, 128)),
      context: Math.max(1, num(f.context.input, 8192)),
      chips: Math.max(1, num(f.chips.input, 8)),
      memGB: Math.max(1, num(f.memGB.input, 16)),
      bwGBs: Math.max(1, num(f.bwGBs.input, 820)),
      tflops: Math.max(1, num(f.tflops.input, 197)),
      wBytes: wBytes.input.value === "1" ? 1 : 2,
      kvBytes: kvBytes.input.value === "1" ? 1 : 2,
    });

    const load = (c: Setup) => {
      for (const [k, field] of Object.entries(f))
        field.input.value = String(c[k as keyof typeof f]);
      wBytes.input.value = c.wBytes === 1 ? "1" : "0";
      kvBytes.input.value = c.kvBytes === 1 ? "1" : "0";
    };

    const fact = (dt: string, dd: string) => [h("dt", {}, dt), h("dd", {}, dd)];

    const render = (fromInput = false) => {
      const c = read();
      if (fromInput) preset.input.value = String(SETUPS.length);
      const B = toBatch(Number(batch.input.value));
      batch.out.textContent = String(B);
      const r = servingBudget(c, B);

      // Memory bar: weights, KV for this batch, what's left.
      const used = Math.min(r.memory, r.weights + B * r.kvPerSeq);
      const segs: [string, number, string][] = [
        ["c1", Math.min(r.weights, r.memory), `Weights ${bytes(r.weights)}`],
        [
          "c3",
          Math.max(0, used - Math.min(r.weights, r.memory)),
          `KV cache for ${B} × ${int(c.context)} tokens: ${bytes(B * r.kvPerSeq)}`,
        ],
        [
          "c0",
          Math.max(0, r.memory - used),
          `Free ${bytes(Math.max(0, r.memory - r.weights - B * r.kvPerSeq))}`,
        ],
      ];
      memBar.classList.toggle("is-over", !r.fits);
      memBar.replaceChildren(
        ...segs.map(([cls, v]) => {
          const seg = h("span", { class: `xp-seg ${cls}` });
          seg.style.width = `${(v / r.memory) * 100}%`;
          return seg;
        }),
      );
      memLegend.replaceChildren(
        ...segs.map(([cls, , label]) =>
          h(
            "li",
            {},
            h("span", { class: `xp-swatch ${cls}`, "aria-hidden": "true" }),
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
      const xMax = Math.min(
        1024,
        Math.max(16, Math.ceil(Math.max(maxBatch * 1.3, critical * 1.3))),
      );
      const pts: [number, number, boolean][] = [];
      for (let b = 1; b <= xMax; b += Math.max(1, Math.floor(xMax / 120))) {
        const r = servingBudget(c, b);
        pts.push([b, r.tokensPerSec, r.fits]);
      }
      const yMax = Math.max(...pts.map((p) => p[1])) * 1.1 || 1;
      const L = 44;
      const R = 310;
      const T = 14;
      const Bm = 160;
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
        s("text", { x: L + 4, y: T + 4, class: "xp-label" }, "tokens/s"),
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
          s(
            "text",
            { x: x(critical) + 3, y: Bm - 6, class: "xp-label" },
            "critical",
          ),
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
          s(
            "text",
            { x: x(maxBatch) + 3, y: T + 18, class: "xp-label" },
            "memory full",
          ),
        );
      }
      if (current <= xMax) {
        els.push(
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

    preset.input.addEventListener("change", () => {
      const c = SETUPS[Number(preset.input.value)];
      if (c) load(c);
      render();
    });
    for (const field of Object.values(f))
      field.input.addEventListener("input", () => render(true));
    wBytes.input.addEventListener("change", () => render(true));
    kvBytes.input.addEventListener("change", () => render(true));
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
