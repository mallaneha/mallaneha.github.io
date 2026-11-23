// "How it works" cards in drawer case studies: a closed disclosure at the end of a few sections that opens
// one line of context (what the term means, why it matters) plus a small interactive widget.
// Only sections where a reader may lack context get one; the rest have none.
//
// Self-contained and easy to remove: drawer.ts lazily imports this file (one line), the styles are in
// src/styles/mockups.css, and the Markdown is untouched. Without this file the plain "···" dividers return.
//
// Facts about Neha's work come only from the case-study text in src/content/. `context` lines explain
// general terms (SDTM, RMSE, PoisonedRAG…). Sample text is illustrative and tagged "Example" in the UI.

import "../styles/mockups.css";

type Steps = { kind: "steps"; items: { label: string; note: string }[] };
type Compare = {
  kind: "compare";
  tabs: { label: string; body: string; note: string }[]; // [[x]] is highlighted
};
type Bars = {
  kind: "bars";
  items: { label: string; value: number; max: number; note: string }[];
};
type Route = {
  kind: "route";
  stages: string[];
  cases: {
    label: string;
    path: number[]; // stage indexes visited, in order
    end: "pass" | "caught" | "loop";
    note: string;
  }[];
};
type Filter = {
  kind: "filter";
  toggle: string;
  items: { text: string; flagged?: boolean }[];
  noteOff: string;
  noteOn: string;
};
type Mockup = { title: string; context: string; example?: boolean } & (
  Steps | Compare | Bars | Route | Filter
);

// Key: "<drawer id>:<id of the section heading>". The card goes at the end of that section.
const MOCKUPS: Record<string, Mockup> = {
  // ---------- Autonomize AI ----------
  "role-autonomize-ai:pii-redaction": {
    title: "Reversible redaction",
    context:
      "Redaction swaps personal details for placeholders. Recall is the share it catches, and every miss is a leak.",
    example: true,
    kind: "compare",
    tabs: [
      {
        label: "Original",
        body: "[[Jane Roe]], born [[03/14/1961]], called about claim [[4471-22]].",
        note: "Three personal details.",
      },
      {
        label: "Redacted",
        body: "[[<PERSON_1>]], born [[<DATE_1>]], called about claim [[<ID_1>]].",
        note: "Safe to pass on.",
      },
      {
        label: "Restored",
        body: "[[Jane Roe]], born [[03/14/1961]], called about claim [[4471-22]].",
        note: "A stored mapping turns placeholders back into the real values.",
      },
    ],
  },
  "role-autonomize-ai:document-rag": {
    title: "Finding the benefits chart",
    context:
      "An Evidence of Coverage (EOC) is a Medicare plan's yearly document of benefits and costs. Each plan lays it out differently.",
    kind: "steps",
    items: [
      { label: "PDF", note: "Layout varies by plan, so page rules break." },
      {
        label: "Contents",
        note: "The table of contents says where things are.",
      },
      { label: "Chart", note: "Jump to the medical benefits chart pages." },
      {
        label: "Ingest",
        note: "Only those pages go into RAG: up to 90% extracted.",
      },
    ],
  },

  // ---------- Numeric Mind ----------
  "role-numeric-mind:pipelines": {
    title: "CDISC, step by step",
    context:
      "CDISC standards are the formats the FDA expects trial data in. Each step is built from the one before, so every number traces back.",
    kind: "steps",
    items: [
      { label: "Raw", note: "Trial data as collected." },
      {
        label: "SDTM",
        note: "Study Data Tabulation Model: the same data in standard domains, such as demographics and adverse events.",
      },
      {
        label: "ADaM",
        note: "Analysis Data Model: analysis-ready datasets derived from SDTM.",
      },
      {
        label: "TLFs",
        note: "Tables, listings and figures for statisticians.",
      },
      {
        label: "CSR",
        note: "Clinical Study Report: the trial's results, written up for the FDA.",
      },
    ],
  },
  "role-numeric-mind-data-analyst:validation": {
    title: "From finding to record",
    context:
      "Pinnacle 21 checks datasets against CDISC and FDA rules. A finding names a rule and a dataset, not the patient record behind it.",
    kind: "steps",
    items: [
      { label: "Finding", note: "A rule fails somewhere in a dataset." },
      {
        label: "SDTM / ADaM",
        note: "The tool follows it through both datasets.",
      },
      {
        label: "Patient",
        note: "…to the records to fix. 75% faster than manual lookups.",
      },
    ],
  },

  // ---------- Vector Guard ----------
  "work-vector-guard:attack": {
    title: "Two poisoned documents",
    context:
      "PoisonedRAG plants text written to be retrieved for one question and to push a chosen answer. Black-box: the attacker never touches the model.",
    example: true,
    kind: "compare",
    tabs: [
      {
        label: "Clean",
        body: "Q: How severe is CVE-YYYY-NNNN?\nRetrieved: CVE doc · CVE doc · ATT&CK doc\nA: [[what the sources say]]",
        note: "Trusted documents, right answer.",
      },
      {
        label: "Poisoned",
        body: "Q: How severe is CVE-YYYY-NNNN?\nRetrieved: [[poisoned]] · [[poisoned]] · CVE doc\nA: [[what the attacker wrote]]",
        note: "2 planted documents out of 1,063 flipped the answer 59% of the time.",
      },
    ],
  },
  "work-vector-guard:defense": {
    title: "Where a document gets stopped",
    context:
      "Cheap checks run first, so the slow ones only see documents that already look normal. NLI (natural language inference) asks whether one text contradicts another.",
    kind: "route",
    stages: ["Structure", "Embedding", "NLI", "LLM score", "Model"],
    cases: [
      {
        label: "Odd format",
        path: [0],
        end: "caught",
        note: "Doesn't look like the corpus.",
      },
      {
        label: "Odd embedding",
        path: [0, 1],
        end: "caught",
        note: "Sits unlike the rest of the corpus in embedding space.",
      },
      {
        label: "Contradicts sources",
        path: [0, 1, 2],
        end: "caught",
        note: "Reads normally, but disagrees with trusted documents.",
      },
      {
        label: "Clean",
        path: [0, 1, 2, 3, 4],
        end: "pass",
        note: "Passes all four checks.",
      },
    ],
  },

  // ---------- Research Assistant Agent ----------
  "work-research-assistant-agent:self-reflection": {
    title: "The reflection loop",
    context:
      "Grounded means every claim is backed by a retrieved document. Reflection is an extra model call that checks this before anyone sees the answer.",
    kind: "route",
    stages: ["Retrieve", "Generate", "Reflect", "Return"],
    cases: [
      {
        label: "Grounded",
        path: [0, 1, 2, 3],
        end: "pass",
        note: "Supported, so it's returned.",
      },
      {
        label: "Unsupported",
        path: [0, 1, 2],
        end: "loop",
        note: "A claim isn't backed, so the agent tries again. 80% fewer hallucinations.",
      },
    ],
  },
  "work-research-assistant-agent:observability": {
    title: "One traced run",
    context:
      "A trace records every step of a single run, so a wrong answer can be followed back to the step that caused it.",
    example: true,
    kind: "steps",
    items: [
      { label: "route", note: "Which path the agent took." },
      { label: "retrieve", note: "Which documents Milvus returned." },
      { label: "generate", note: "The draft and its inputs." },
      { label: "reflect", note: "Grounded or not, and why." },
    ],
  },

  // ---------- SysToolChain ----------
  "work-systoolchain:streaming": {
    title: "Ambiguous names",
    context:
      "Mentions are counted by matching player names in comments. A name that's also a common word matches far too much.",
    example: true,
    kind: "filter",
    toggle: "Filter ambiguous names",
    items: [
      { text: "What a goal from Moreno!" },
      { text: "He played like a king tonight", flagged: true },
      { text: "Moreno again, unstoppable" },
      { text: "King of the midfield? Not today", flagged: true },
      { text: "Great pass from King to Moreno" },
    ],
    noteOff: "Say a player is called King: every “king” counts.",
    noteOn: "Filtered: only real mentions count.",
  },
  "work-systoolchain:models": {
    title: "Prediction error",
    context:
      "RMSE is the typical error in rating points, so lower is better. R² is the share of rating variation explained (1.0 is all of it).",
    kind: "bars",
    items: [
      { label: "Linear", value: 1.94, max: 2, note: "Baseline: 1.94 RMSE." },
      {
        label: "Random Forest",
        value: 0.97,
        max: 2,
        note: "0.97 RMSE, 0.98 R²: about half the error.",
      },
    ],
  },
};

// ---------- tiny DOM helper ----------
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else el.setAttribute(k, v);
  }
  el.append(...children);
  return el;
}

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

// "[[x]]" → <mark>x</mark>; "\n" → line break.
function rich(text: string) {
  const out = h("p", { class: "mk-text" });
  text.split("\n").forEach((line, i) => {
    if (i) out.append(h("br"));
    line.split(/(\[\[.*?\]\])/).forEach((part) => {
      if (part.startsWith("[[")) out.append(h("mark", {}, part.slice(2, -2)));
      else if (part) out.append(part);
    });
  });
  return out;
}

// A row of buttons where exactly one is pressed.
function choices(labels: string[], onPick: (i: number) => void, cls = "") {
  const row = h("div", { class: `mk-choices ${cls}`.trim(), role: "group" });
  const btns = labels.map((l, i) => {
    const b = h(
      "button",
      { type: "button", class: "mk-chip", "aria-pressed": "false" },
      l,
    );
    b.addEventListener("click", () => pick(i));
    return b;
  });
  function pick(i: number) {
    btns.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    onPick(i);
  }
  row.append(...btns);
  return { row, pick };
}

// ---------- widgets ----------
function renderSteps(m: Steps, note: HTMLElement) {
  const { row, pick } = choices(
    m.items.map((s) => s.label),
    (i) => (note.textContent = m.items[i].note),
    "mk-steps",
  );
  pick(0);
  return row;
}

function renderCompare(m: Compare, note: HTMLElement) {
  const view = h("div", { class: "mk-view" });
  const { row, pick } = choices(
    m.tabs.map((t) => t.label),
    (i) => {
      view.replaceChildren(rich(m.tabs[i].body));
      note.textContent = m.tabs[i].note;
    },
  );
  pick(0);
  return h("div", {}, row, view);
}

function renderBars(m: Bars, note: HTMLElement) {
  const rows = m.items.map((item) => {
    const fill = h("span", { class: "mk-fill" });
    fill.style.width = `${(item.value / item.max) * 100}%`;
    const r = h(
      "button",
      { type: "button", class: "mk-bar", "aria-pressed": "false" },
      h("span", {}, item.label),
      h("span", { class: "mk-track" }, fill),
      h("span", { class: "mk-val" }, String(item.value)),
    );
    r.addEventListener("click", () => {
      rows.forEach((x) => x.setAttribute("aria-pressed", String(x === r)));
      note.textContent = item.note;
    });
    return r;
  });
  rows.at(-1)?.click();
  return h("div", { class: "mk-bars" }, ...rows);
}

function renderRoute(m: Route, note: HTMLElement) {
  const stages = m.stages.map((s) => h("li", { class: "mk-stage" }, s));
  const list = h("ol", { class: "mk-route" }, ...stages);
  let timers: number[] = [];
  const { row, pick } = choices(
    m.cases.map((c) => c.label),
    (i) => {
      const c = m.cases[i];
      timers.forEach(clearTimeout);
      timers = [];
      stages.forEach((s) => (s.className = "mk-stage"));
      note.textContent = "";
      const step = reduceMotion.matches ? 0 : 240;
      c.path.forEach((idx, k) => {
        timers.push(
          window.setTimeout(() => {
            const last = k === c.path.length - 1;
            stages[idx].classList.add(
              last && c.end !== "pass" ? `is-${c.end}` : "is-passed",
            );
            if (last) note.textContent = c.note;
          }, k * step),
        );
      });
    },
  );
  pick(0);
  return h("div", {}, row, list);
}

function renderFilter(m: Filter, note: HTMLElement) {
  const items = m.items.map((it) =>
    h("li", { class: it.flagged ? "mk-item is-flagged" : "mk-item" }, it.text),
  );
  const list = h("ul", { class: "mk-list" }, ...items);
  const toggle = h(
    "button",
    { type: "button", class: "mk-chip", "aria-pressed": "false" },
    m.toggle,
  );
  const set = (on: boolean) => {
    toggle.setAttribute("aria-pressed", String(on));
    list.classList.toggle("is-filtered", on);
    note.textContent = on ? m.noteOn : m.noteOff;
  };
  toggle.addEventListener("click", () =>
    set(toggle.getAttribute("aria-pressed") !== "true"),
  );
  set(false);
  return h("div", {}, h("div", { class: "mk-choices" }, toggle), list);
}

function renderBody(m: Mockup) {
  const note = h("p", { class: "mk-note", "aria-live": "polite" });
  const widget =
    m.kind === "steps"
      ? renderSteps(m, note)
      : m.kind === "compare"
        ? renderCompare(m, note)
        : m.kind === "bars"
          ? renderBars(m, note)
          : m.kind === "route"
            ? renderRoute(m, note)
            : renderFilter(m, note);
  return [
    h("p", { class: "mk-context" }, m.context),
    h("div", { class: "mk-widget" }, widget, note),
  ];
}

const chevron = () => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", "14");
  s.setAttribute("height", "14");
  s.setAttribute("aria-hidden", "true");
  s.classList.add("mk-chevron");
  s.innerHTML =
    '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>';
  return s;
};

// ---------- add the cards to one drawer ----------
export function enhance(dialog: HTMLDialogElement) {
  const caseEl = dialog.querySelector<HTMLElement>(".case");
  if (!caseEl || caseEl.classList.contains("has-mockups")) return;
  const heads = [...caseEl.querySelectorAll<HTMLHeadingElement>(":scope > h2")];
  heads.forEach((h2, i) => {
    const m = MOCKUPS[`${dialog.id}:${h2.id}`];
    if (!m) return;
    const summary = h(
      "summary",
      { class: "mk-summary" },
      h("span", { class: "mk-kicker" }, "How it works"),
      h("span", { class: "mk-title" }, m.title),
    );
    if (m.example) summary.append(h("span", { class: "mk-tag" }, "Example"));
    summary.append(chevron());
    const body = h("div", { class: "mk-body" });
    const card = h("details", { class: "mk" }, summary, body);
    card.addEventListener("toggle", () => {
      if (card.open && !body.childElementCount) body.append(...renderBody(m));
    });
    const next = heads[i + 1];
    if (next) next.before(card);
    else caseEl.append(card);
  });
  caseEl.classList.add("has-mockups");
}
