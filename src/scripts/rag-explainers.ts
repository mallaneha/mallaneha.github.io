// Interactive widgets for the RAG and RAG security posts. Same rules as explainers.ts: each one is a custom
// element in a Markdown post with static fallback content inside, and every number shown is computed here.

import {
  checkbox,
  choice,
  fixed,
  h,
  head,
  motion,
  pct,
  s,
  slider,
  stackBar,
  tableHead,
} from "./explainer-kit";

/* ------------------------------------------------------------------ */
/* Abstention: a relevance floor over a toy eval set                  */
/* ------------------------------------------------------------------ */

type Kind = "hit" | "miss" | "none";
interface EvalQ {
  q: string;
  score: number; // top retrieval score
  kind: Kind; // hit: right chunk retrieved; miss: answerable, wrong chunk; none: documents can't answer it
}

// Twenty questions against one toy plan document. Scores are the top similarity the retriever returned.
export const EVAL_SET: EvalQ[] = [
  { q: "What's the copay for a primary care visit?", score: 0.88, kind: "hit" },
  { q: "Are test strips covered?", score: 0.84, kind: "hit" },
  { q: "Do I need a referral to see a specialist?", score: 0.81, kind: "hit" },
  { q: "What's the emergency room copay?", score: 0.79, kind: "hit" },
  { q: "Is a glucose monitor covered?", score: 0.76, kind: "hit" },
  { q: "What's the out-of-pocket maximum?", score: 0.74, kind: "hit" },
  { q: "Are flu shots covered?", score: 0.69, kind: "hit" },
  {
    q: "How many physical therapy visits are covered?",
    score: 0.66,
    kind: "hit",
  },
  { q: "Is telehealth covered?", score: 0.61, kind: "hit" },
  {
    q: "What does a generic drug cost at a mail-order pharmacy?",
    score: 0.55,
    kind: "hit",
  },
  { q: "Can I appeal a denied claim?", score: 0.48, kind: "hit" },
  { q: "What's the copay for a new patient visit?", score: 0.67, kind: "miss" },
  {
    q: "Is a second blood pressure monitor covered this year?",
    score: 0.53,
    kind: "miss",
  },
  {
    q: "What's covered after I'm discharged from the hospital?",
    score: 0.44,
    kind: "miss",
  },
  { q: "Is my dentist in network?", score: 0.71, kind: "none" },
  { q: "What will my premium be next year?", score: 0.63, kind: "none" },
  { q: "Can I switch plans in March?", score: 0.58, kind: "none" },
  { q: "Does the plan cover IVF?", score: 0.51, kind: "none" },
  { q: "What's my member ID?", score: 0.42, kind: "none" },
  { q: "Who won the game last night?", score: 0.36, kind: "none" },
];

export function abstain(floor: number, withNone = true) {
  const set = EVAL_SET.filter((e) => withNone || e.kind !== "none");
  const o = { right: 0, wrong: 0, madeUp: 0, wrongRefusal: 0, rightRefusal: 0 };
  for (const e of set) {
    const answers = e.score >= floor - 1e-9;
    if (e.kind === "none") answers ? o.madeUp++ : o.rightRefusal++;
    else if (!answers) o.wrongRefusal++;
    else e.kind === "hit" ? o.right++ : o.wrong++;
  }
  return { ...o, n: set.length, answered: o.right + o.wrong + o.madeUp };
}

const SW = 300; // strip plot viewBox width
const sx = (v: number) => 20 + v * (SW - 40);

class AbstainLab extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const floor = slider("Relevance floor", 0, 0.9, 0.05, 0, (v) => fixed(v));
    const none = checkbox(
      "Include the 6 questions the documents can't answer",
      true,
    );

    // Strip plot: one row of dots for answerable questions, one for the rest.
    const shade = s("rect", {
      class: "xp-refuse",
      x: sx(0),
      y: 8,
      height: 74,
      width: 0,
    });
    const line = s("line", { class: "xp-guide is-limit", y1: 6, y2: 84 });
    // Answerable dots go on three rows, taken in score order, so neighbours with close scores don't overlap.
    const order = EVAL_SET.filter((e) => e.kind !== "none")
      .map((e) => e.score)
      .sort((a, b) => a - b);
    const dots = EVAL_SET.map((e) => {
      const y = e.kind === "none" ? 66 : 20 + (order.indexOf(e.score) % 3) * 9;
      const c = s(
        "circle",
        { class: `xp-q is-${e.kind}`, cx: sx(e.score), cy: y, r: 5 },
        s("title", {}, `${e.q} (top score ${fixed(e.score)})`),
      );
      return { c, e };
    });
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
      s("text", { class: "xp-label xp-middle", x: sx(t), y: 100 }, fixed(t)),
    );
    const plot = s(
      "svg",
      {
        class: "xp-chart xp-strip",
        viewBox: `0 0 ${SW} 106`,
        role: "img",
        "aria-label":
          "Each dot is one eval question, placed by its top retrieval score. Questions left of the floor get a refusal.",
      },
      shade,
      s("line", { class: "xp-axis", x1: sx(0), x2: sx(1), y1: 86, y2: 86 }),
      s("text", { class: "xp-label", x: sx(0), y: 12 }, "answerable"),
      s("text", { class: "xp-label", x: sx(0), y: 52 }, "not in the documents"),
      ...dots.map((d) => d.c),
      line,
      ...ticks,
    );

    const segs = {
      right: h("span", { class: "xp-seg c3" }),
      wrong: h("span", { class: "xp-seg c4" }),
      madeUp: h("span", { class: "xp-seg c2" }),
      wrongRefusal: h("span", { class: "xp-seg c5" }),
      rightRefusal: h("span", { class: "xp-seg c1" }),
    };
    const labels: [keyof typeof segs, string, string][] = [
      ["right", "c3", "Right answer"],
      ["wrong", "c4", "Wrong answer (wrong chunk)"],
      ["madeUp", "c2", "Made up (no answer exists)"],
      ["wrongRefusal", "c5", "Wrong refusal"],
      ["rightRefusal", "c1", "Right refusal"],
    ];
    const counts = Object.fromEntries(
      labels.map(([k]) => [k, h("span")]),
    ) as Record<keyof typeof segs, HTMLSpanElement>;
    const legend = h(
      "ul",
      { class: "xp-legend" },
      ...labels.map(([k, c, t]) =>
        h(
          "li",
          { "data-k": k },
          h("span", { class: `xp-swatch ${c}` }),
          h("span", {}, t, ": "),
          counts[k],
        ),
      ),
    );
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });

    const root = h(
      "div",
      { class: "xp" },
      head("Where should the system say “I don’t know”?"),
      h("div", { class: "xp-controls" }, floor.wrap, none.wrap),
      h("figure", { class: "xp-figure" }, plot),
      h(
        "div",
        { class: "xp-stack", "aria-hidden": "true" },
        ...Object.values(segs),
      ),
      legend,
      summary,
      h(
        "p",
        { class: "xp-note" },
        "A toy eval set of 20 questions about one plan document. Hover or tap a dot to see the question.",
      ),
    );
    this.replaceChildren(root);
    const setMotion = motion(root);

    const render = (animate = false) => {
      setMotion(animate);
      const t = Number(floor.input.value);
      const withNone = none.input.checked;
      floor.out.textContent = fixed(t);
      const r = abstain(t, withNone);
      shade.setAttribute("width", String(sx(t) - sx(0)));
      line.setAttribute("x1", String(sx(t)));
      line.setAttribute("x2", String(sx(t)));
      dots.forEach(({ c, e }) => {
        c.classList.toggle("is-hidden", !withNone && e.kind === "none");
        c.classList.toggle("is-refused", e.score < t - 1e-9);
      });
      stackBar(
        labels.map(([k]) => segs[k]),
        labels.map(([k]) => r[k]),
        r.n,
      );
      for (const [k] of labels) counts[k].textContent = String(r[k]);
      legend
        .querySelector('[data-k="madeUp"]')!
        .toggleAttribute("hidden", !withNone);
      legend
        .querySelector('[data-k="rightRefusal"]')!
        .toggleAttribute("hidden", !withNone);
      const bad = r.wrong + r.madeUp;
      const refused = r.n - r.answered;
      summary.textContent = withNone
        ? `Floor ${fixed(t)}: it answers ${r.answered} of ${r.n} and refuses ${refused}. Wrong or made-up answers: ${bad} of ${r.n} (${pct(bad / r.n)}). Wrong refusals: ${r.wrongRefusal}.`
        : `Floor ${fixed(t)}: ${r.right} of ${r.n} right (${pct(r.right / r.n)}). With only answerable questions, every refusal is a mistake, so the floor can only make this number worse.`;
    };

    floor.input.addEventListener("input", () => render());
    none.input.addEventListener("change", () => render(true));
    render();
  }
}

/* ------------------------------------------------------------------ */
/* Exact codes: keyword vs vector vs hybrid on a toy plan document     */
/* ------------------------------------------------------------------ */

export const CHUNKS = [
  "Diabetes supplies (E11.9): test strips and lancets are covered for type 2 diabetes. No prior authorization needed.",
  "Type 2 diabetes with hyperglycemia (E11.65): continuous glucose monitors are covered after prior authorization.",
  "Office visit, established patient (CPT 99213): $20 copay with your primary care doctor.",
  "Office visit, new patient (CPT 99203): $35 copay with your primary care doctor, or $50 with a specialist.",
  "High blood pressure (I10): one home blood pressure monitor is covered every two years.",
  "Emergency room visits: $90 copay, waived if admitted to the hospital.",
];

interface CodeQuery {
  text: string;
  target: number; // index of the chunk that answers it
  synonym?: string; // what query expansion adds on the keyword side
  vec: number[]; // similarity to each chunk, set by hand (see the post)
}

export const CODE_QUERIES: CodeQuery[] = [
  { text: "E11.65", target: 1, vec: [0.82, 0.8, 0.31, 0.3, 0.38, 0.22] },
  { text: "99213 copay", target: 2, vec: [0.25, 0.24, 0.78, 0.79, 0.27, 0.61] },
  {
    text: "high blood sugar",
    target: 1,
    synonym: "hyperglycemia",
    vec: [0.7, 0.74, 0.2, 0.19, 0.58, 0.23],
  },
];

const STOP = new Set(
  "a an and are is the to for with your of or if no after every one".split(" "),
);
const tokens = (t: string) =>
  t
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .map((w) => w.replace(/^\.+|\.+$/g, ""))
    .filter((w) => w && !STOP.has(w));

/** BM25 (k1 = 1.2, b = 0.75) of one query against every chunk. */
export function bm25(query: string, docs = CHUNKS): number[] {
  const D = docs.map(tokens);
  const avg = D.reduce((a, d) => a + d.length, 0) / D.length;
  const q = tokens(query);
  return D.map((d) =>
    q.reduce((acc, w) => {
      const df = D.filter((x) => x.includes(w)).length;
      if (!df) return acc;
      const idf = Math.log(1 + (D.length - df + 0.5) / (df + 0.5));
      const tf = d.filter((x) => x === w).length;
      return (
        acc + (idf * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * d.length) / avg))
      );
    }, 0),
  );
}

/** Chunk indexes by score, best first, leaving out zero scores. */
const ranking = (scores: number[]) =>
  scores
    .map((v, i) => [v, i] as const)
    .filter(([v]) => v > 0)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .map(([, i]) => i);

/** Reciprocal rank fusion with k = 60: each list adds 1 / (60 + rank). */
export function fuse(a: number[], b: number[]): number[] {
  const out = a.map(() => 0);
  for (const list of [ranking(a), ranking(b)])
    list.forEach((i, r) => (out[i]! += 1 / (61 + r)));
  return out;
}

export function codeSearch(qi: number, expand: boolean) {
  const q = CODE_QUERIES[qi]!;
  const kwText = expand && q.synonym ? `${q.text} ${q.synonym}` : q.text;
  const kw = bm25(kwText);
  const hy = fuse(kw, q.vec);
  const lists = { keyword: kw, vector: q.vec, hybrid: hy };
  const rankOf = (sc: number[]) => {
    const r = ranking(sc).indexOf(q.target);
    return r < 0 ? null : r + 1;
  };
  return {
    lists,
    ranks: { keyword: rankOf(kw), vector: rankOf(q.vec), hybrid: rankOf(hy) },
    kwText,
  };
}

const rankText = (r: number | null) => (r === null ? "not found" : `#${r}`);

class CodeSearch extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const query = choice(
      "Query",
      CODE_QUERIES.map((q) => q.text),
      0,
    );
    const expand = checkbox("Add synonyms to the keyword query", false);
    const methods = ["keyword", "vector", "hybrid"] as const;
    const cells = [0, 1, 2].map(() => methods.map(() => h("td")));
    const table = h(
      "table",
      { class: "xp-table xp-ranks" },
      h("caption", {}, "Top three chunks from each kind of search"),
      tableHead([
        "Rank",
        "Keyword (BM25)",
        "Vector (similarity)",
        "Hybrid (RRF)",
      ]),
      h(
        "tbody",
        {},
        ...cells.map((row, r) =>
          h("tr", {}, h("th", { scope: "row" }, `#${r + 1}`), ...row),
        ),
      ),
    );
    const items = CHUNKS.map((c, i) =>
      h("li", {}, h("span", { class: "xp-chunk-id" }, `C${i + 1}`), " ", c),
    );
    const kwLine = h("p", { class: "xp-note xp-left" });
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });

    const root = h(
      "div",
      { class: "xp" },
      head("Three ways to search one plan document"),
      h("div", { class: "xp-controls" }, query.wrap, expand.wrap),
      summary,
      h("div", { class: "xp-scroll" }, table),
      kwLine,
      h(
        "ol",
        {
          class: "xp-chunks",
          "aria-label": "The document, split into six chunks",
        },
        ...items,
      ),
      h(
        "p",
        { class: "xp-note" },
        "Keyword and hybrid scores are computed live. Vector similarities are set by hand to show the pattern; they don't come from a real model.",
      ),
    );
    this.replaceChildren(root);

    const render = () => {
      const qi = query.inputs.findIndex((i) => i.checked);
      const q = CODE_QUERIES[qi]!;
      const res = codeSearch(qi, expand.input.checked);
      methods.forEach((m, c) => {
        const order = ranking(res.lists[m]);
        const dp = m === "hybrid" ? 4 : 2;
        cells.forEach((row, r) => {
          const i = order[r];
          const td = row[c]!;
          td.className = i === q.target ? "is-target" : "";
          td.textContent =
            i === undefined ? "–" : `C${i + 1}  ${fixed(res.lists[m][i]!, dp)}`;
        });
      });
      items.forEach((li, i) =>
        li.classList.toggle("is-target", i === q.target),
      );
      kwLine.textContent = `Keyword query: “${res.kwText}”${q.synonym ? "" : " (no synonyms for this one)"}`;
      summary.textContent = `The right chunk is C${q.target + 1}. Keyword search ranks it ${rankText(res.ranks.keyword)}, vector search ${rankText(res.ranks.vector)}, hybrid ${rankText(res.ranks.hybrid)}.`;
    };

    query.inputs.forEach((i) => i.addEventListener("change", render));
    expand.input.addEventListener("change", render);
    render();
  }
}

/* ------------------------------------------------------------------ */
/* Rule of Two: features of a healthcare RAG assistant                 */
/* ------------------------------------------------------------------ */

type Prop = "A" | "B" | "C";
interface Feature {
  label: string;
  adds: Prop[];
  on: boolean;
  locked?: boolean;
}

export const FEATURES: Feature[] = [
  {
    label: "Answers from the member's own claims and plan documents",
    adds: ["B"],
    on: true,
    locked: true,
  },
  {
    label: "Reads PDFs the member uploads (bills, letters)",
    adds: ["A"],
    on: true,
  },
  {
    label: "Searches provider web pages for network questions",
    adds: ["A"],
    on: false,
  },
  {
    label: "Reads faxed referrals from outside providers",
    adds: ["A"],
    on: false,
  },
  { label: "Shows links and images in its answers", adds: ["C"], on: false },
  { label: "Emails the member a summary", adds: ["C"], on: false },
  {
    label: "Files an appeal or updates the member's address",
    adds: ["C"],
    on: false,
  },
];

const PROP_NAME: Record<Prop, string> = {
  A: "untrusted input",
  B: "sensitive data",
  C: "acts or talks to the outside",
};

export function ruleOfTwo(on: boolean[], approval: boolean) {
  const have = new Set<Prop>();
  FEATURES.forEach((f, i) => on[i] && f.adds.forEach((p) => have.add(p)));
  const props = (["A", "B", "C"] as Prop[]).filter((p) => have.has(p));
  let verdict: string;
  if (props.length === 3)
    verdict = approval
      ? "All three, so it can't run on its own. Every outbound action waits for a person."
      : "Danger: all three in one session. A document can tell it to send data out.";
  else if (props.length === 2)
    verdict = `Lower risk: ${props.map((p) => `[${p}] ${PROP_NAME[p]}`).join(" and ")}.`;
  else
    verdict = `One property: ${props.map((p) => `[${p}] ${PROP_NAME[p]}`).join("")}.`;
  return { props, verdict, danger: props.length === 3 && !approval };
}

class RuleOfTwo extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const boxes = FEATURES.map((f) => {
      const c = checkbox("", f.on);
      if (f.locked) c.input.disabled = true;
      c.wrap.replaceChildren(
        c.input,
        h("span", {}, f.label),
        ...f.adds.map((p) => h("span", { class: `xp-tag is-${p}` }, p)),
      );
      return c;
    });
    const approval = checkbox("A person approves every outbound action", false);

    const circle = (
      p: Prop,
      cx: number,
      cy: number,
      lx: number,
      ly: number,
    ) => {
      const c = s("circle", { class: `xp-venn is-${p}`, cx, cy, r: 58 });
      const t = s(
        "text",
        { class: "xp-label xp-middle xp-venn-label", x: lx, y: ly },
        `[${p}] ${PROP_NAME[p]}`,
      );
      return { c, t };
    };
    const A = circle("A", 112, 92, 82, 22);
    const B = circle("B", 188, 92, 218, 22);
    const C = circle("C", 150, 156, 150, 236);
    const core = s("circle", { class: "xp-venn-core", cx: 150, cy: 114, r: 9 });
    const venn = s(
      "svg",
      {
        class: "xp-chart xp-venn-svg",
        viewBox: "0 0 300 244",
        role: "img",
        "aria-label":
          "Three overlapping circles: untrusted input, sensitive data, and acting or talking to the outside.",
      },
      A.c,
      B.c,
      C.c,
      core,
      A.t,
      B.t,
      C.t,
    );
    const verdict = h("p", {
      class: "xp-summary xp-verdict",
      "aria-live": "polite",
    });

    const root = h(
      "div",
      { class: "xp" },
      head("Which features push the assistant into all three?"),
      h("figure", { class: "xp-figure" }, venn),
      verdict,
      h(
        "fieldset",
        { class: "xp-controls xp-features" },
        h("legend", {}, "Features"),
        ...boxes.map((b) => b.wrap),
        approval.wrap,
      ),
    );
    this.replaceChildren(root);

    const render = () => {
      const r = ruleOfTwo(
        boxes.map((b) => b.input.checked),
        approval.input.checked,
      );
      for (const [p, c] of [
        ["A", A],
        ["B", B],
        ["C", C],
      ] as const)
        c.c.classList.toggle("is-on", r.props.includes(p));
      core.classList.toggle("is-on", r.danger);
      root.classList.toggle("is-danger", r.danger);
      verdict.textContent = r.verdict;
    };
    [...boxes, approval].forEach((b) =>
      b.input.addEventListener("change", render),
    );
    render();
  }
}

/* ------------------------------------------------------------------ */
/* Poisoning defense: what each layer is built to catch               */
/* ------------------------------------------------------------------ */

const LAYERS = ["Structure", "Embedding", "NLI contradiction", "LLM score"];
type Verdict = "stop" | "pass" | "maybe";
interface Poison {
  label: string;
  what: string;
  at: Verdict[];
}

export const POISONS: Poison[] = [
  {
    label: "Looks off",
    what: "Instructions pasted into the text, odd markup, or a layout unlike the rest of the corpus.",
    at: ["stop", "pass", "pass", "pass"],
  },
  {
    label: "Sits off",
    what: "Ordinary-looking text whose embedding lands far from the documents it claims to be like.",
    at: ["pass", "stop", "pass", "pass"],
  },
  {
    label: "Contradicts",
    what: "Reads like a normal advisory but gives a CVE a lower severity than the trusted entry for that CVE.",
    at: ["pass", "pass", "stop", "pass"],
  },
  {
    label: "Fills a gap",
    what: "Reads normally, sits with similar documents, and makes a claim no trusted document covers, so there's nothing to contradict.",
    at: ["pass", "pass", "pass", "maybe"],
  },
];

class PoisonLayers extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const pick = choice(
      "Poisoned document",
      POISONS.map((p) => p.label),
      0,
    );
    const what = h("p", { class: "xp-summary" });
    const gates = LAYERS.map((l, i) => {
      const state = h("span", { class: "xp-gate-state" });
      const li = h(
        "li",
        { class: "xp-gate" },
        h("span", { class: "xp-gate-n" }, String(i + 1)),
        h("span", { class: "xp-gate-name" }, l),
        state,
      );
      return { li, state };
    });
    const out = h("p", { class: "xp-summary", "aria-live": "polite" });
    const root = h(
      "div",
      { class: "xp" },
      head("Four checks, four kinds of poison"),
      h("div", { class: "xp-controls" }, pick.wrap),
      what,
      h(
        "ol",
        { class: "xp-gates", "aria-label": "The four checks, cheapest first" },
        ...gates.map((g) => g.li),
      ),
      out,
      h(
        "p",
        { class: "xp-note" },
        "What each check is built to catch, not measured per-layer rates.",
      ),
    );
    this.replaceChildren(root);

    const render = () => {
      const p = POISONS[pick.inputs.findIndex((i) => i.checked)]!;
      what.textContent = p.what;
      const stop = p.at.indexOf("stop");
      gates.forEach((g, i) => {
        const v: Verdict | "skip" = stop >= 0 && i > stop ? "skip" : p.at[i]!;
        g.li.dataset.state = v;
        g.state.textContent = {
          stop: "stops it",
          pass: "passes",
          maybe: "might flag it",
          skip: "never reached",
        }[v];
      });
      out.textContent =
        stop >= 0
          ? `Stopped at check ${stop + 1}, ${LAYERS[stop]}.`
          : "Passes the first three checks. Only the LLM score might flag it, and that's the check an adaptive attacker would tune against.";
    };
    pick.inputs.forEach((i) => i.addEventListener("change", render));
    render();
  }
}

/* ------------------------------------------------------------------ */
/* Static vs adaptive attacks on 12 published defenses                 */
/* ------------------------------------------------------------------ */

// Attack success rates from Nasr et al., "The Attacker Moves Second" (arXiv:2510.09023), as reported by
// Simon Willison (simonwillison.net/2025/Nov/2/new-prompt-injection-papers/).
export const DEFENSES: [string, number, number][] = [
  ["Spotlighting", 28, 99],
  ["Prompt Sandwich", 21, 95],
  ["RPO", 0, 99],
  ["Circuit Breaker", 8, 100],
  ["StruQ", 62, 100],
  ["SeqAlign", 5, 96],
  ["ProtectAI", 15, 90],
  ["PromptGuard", 26, 94],
  ["PIGuard", 0, 71],
  ["Model Armor", 0, 90],
  ["Data Sentinel", 0, 80],
  ["MELON", 0, 89],
];

export function attackSummary(adaptive: boolean) {
  const v = DEFENSES.map((d) => (adaptive ? d[2] : d[1]));
  return {
    under10: v.filter((x) => x < 10).length,
    atLeast90: v.filter((x) => x >= 90).length,
    lowest: Math.min(...v),
  };
}

class AttackGap extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";

    const mode = choice(
      "Attacker",
      ["Static (fixed attacks)", "Adaptive (iterates)"],
      0,
    );
    const rows = DEFENSES.map(([name]) => {
      const val = h("span", { class: "xp-hbar-val" });
      const fill = h("span", { class: "xp-hbar-fill" });
      const li = h(
        "li",
        { class: "xp-hbar" },
        h("span", { class: "xp-hbar-name" }, name),
        h("span", { class: "xp-hbar-track", "aria-hidden": "true" }, fill),
        val,
      );
      return { li, val, fill };
    });
    const summary = h("p", { class: "xp-summary", "aria-live": "polite" });
    const root = h(
      "div",
      { class: "xp" },
      head("Attack success against 12 published defenses"),
      h("div", { class: "xp-controls" }, mode.wrap),
      summary,
      h("ul", { class: "xp-hbars" }, ...rows.map((r) => r.li)),
      h(
        "p",
        { class: "xp-note" },
        "Nasr et al. 2025 (arXiv:2510.09023), as reported by Simon Willison.",
      ),
    );
    this.replaceChildren(root);
    const setMotion = motion(root);

    const render = (animate = false) => {
      setMotion(animate);
      const adaptive = mode.inputs[1]!.checked;
      DEFENSES.forEach((d, i) => {
        const v = adaptive ? d[2] : d[1];
        rows[i]!.fill.style.transform = `scaleX(${v / 100})`;
        rows[i]!.val.textContent = `${v}%`;
        rows[i]!.li.classList.toggle("is-high", v >= 90);
      });
      const a = attackSummary(adaptive);
      summary.textContent = adaptive
        ? `Adaptive attacks: ${a.atLeast90} of 12 defenses at 90% attack success or higher. The best one still let through ${a.lowest}%.`
        : `Static attacks: ${a.under10} of 12 defenses hold attack success under 10%. This is the number most defense papers report.`;
    };
    mode.inputs.forEach((i) =>
      i.addEventListener("change", () => render(true)),
    );
    render();
  }
}

const define = (name: string, ctor: CustomElementConstructor) => {
  if (!customElements.get(name)) customElements.define(name, ctor);
};
define("abstain-lab", AbstainLab);
define("code-search", CodeSearch);
define("rule-of-two", RuleOfTwo);
define("poison-layers", PoisonLayers);
define("attack-gap", AttackGap);
