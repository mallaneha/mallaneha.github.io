// Interactive mockups behind the "···" dividers in drawer case studies.
// Each divider becomes a "See how it works" button that opens a small widget explaining the section above it.
// Self-contained and easy to remove: drawer.ts lazily imports this file (one line), the styles are in
// src/styles/mockups.css, and the Markdown content is untouched. Without this file the plain "···" dividers return.
//
// Every number here comes from the case-study text in src/content/. Sample text (a patient note, a question)
// is illustrative and is marked "Example" in the UI.

import "../styles/mockups.css";

type Steps = { kind: "steps"; items: { label: string; note: string }[] };
type Compare = {
  kind: "compare";
  // [[text]] is highlighted.
  tabs: { label: string; body: string; note: string }[];
};
type Bars = {
  kind: "bars";
  states?: [string, string]; // toggle between value[0] and value[1]
  stateNotes?: [string, string];
  lowerIsBetter?: boolean;
  items: {
    label: string;
    value: number | [number, number];
    max: number;
    suffix?: string;
    note: string;
  }[];
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
type Trace = {
  kind: "trace";
  items: { label: string; meta?: string; detail: string }[];
};
type Filter = {
  kind: "filter";
  toggle: string;
  items: { text: string; flagged?: boolean }[];
  noteOff: string;
  noteOn: string;
};
type Mockup = { title: string; example?: boolean } & (
  Steps | Compare | Bars | Route | Trace | Filter
);

// Key: "<drawer id>:<id of the section heading above the divider>".
const MOCKUPS: Record<string, Mockup> = {
  // ---------- Autonomize AI ----------
  "role-autonomize-ai:overview": {
    title: "What the numbers measure",
    kind: "bars",
    items: [
      {
        label: "Anonymization recall",
        value: 97.7,
        max: 100,
        suffix: "%",
        note: "Share of the personal details in the test data that the redaction pipeline caught. In redaction, a miss is a leak.",
      },
      {
        label: "Extraction success",
        value: 90,
        max: 100,
        suffix: "%",
        note: "Extraction success on 100+ Medicare Evidence of Coverage PDFs rose to as much as 90%.",
      },
    ],
  },
  "role-autonomize-ai:pii-redaction": {
    title: "Reversible pseudonymization",
    example: true,
    kind: "compare",
    tabs: [
      {
        label: "Original",
        body: "[[Jane Roe]], born [[03/14/1961]], called about claim [[4471-22]].",
        note: "Patient text as it arrives. The highlighted spans are personal details.",
      },
      {
        label: "Redacted",
        body: "[[<PERSON_1>]], born [[<DATE_1>]], called about claim [[<ID_1>]].",
        note: "Each detail is swapped for a placeholder before the text goes anywhere else.",
      },
      {
        label: "Restored",
        body: "[[Jane Roe]], born [[03/14/1961]], called about claim [[4471-22]].",
        note: "The mapping is kept, so customer data can be restored when needed.",
      },
    ],
  },
  "role-autonomize-ai:document-rag": {
    title: "Finding the benefits chart",
    kind: "steps",
    items: [
      {
        label: "EOC PDF",
        note: "A Medicare Evidence of Coverage document. The layout varies from plan to plan.",
      },
      {
        label: "Table of contents",
        note: "Read the table of contents first, instead of guessing from page layout.",
      },
      {
        label: "Benefits chart",
        note: "Use it to locate the medical benefits chart pages.",
      },
      {
        label: "Ingest",
        note: "Isolate just those pages for the RAG pipeline. Extraction success rose to as much as 90%.",
      },
    ],
  },
  "role-autonomize-ai:security": {
    title: "Testing from both sides",
    kind: "steps",
    items: [
      {
        label: "Red team",
        note: "Red-teaming agents play the attacker.",
      },
      {
        label: "Blue team",
        note: "Blue-teaming agents play the defender.",
      },
      {
        label: "OWASP Top 10",
        note: "Generative AI architectures aligned with the OWASP Top 10.",
      },
      {
        label: "Cloud",
        note: "I configured Wiz cloud security tools.",
      },
    ],
  },

  // ---------- Numeric Mind ----------
  "role-numeric-mind:overview": {
    title: "3.5 years",
    kind: "steps",
    items: [
      {
        label: "Oct 2021",
        note: "Joined as a Data Analyst, turning raw trial data into datasets and reports for the FDA.",
      },
      {
        label: "Apr 2024",
        note: "Became a Senior Data Analyst, leading 12 analysts.",
      },
      {
        label: "Apr 2025",
        note: "End of the role. In total: 800+ CDISC datasets and reports, 15+ FDA submission packages.",
      },
    ],
  },
  "role-numeric-mind:pipelines": {
    title: "From raw data to the FDA",
    kind: "steps",
    items: [
      {
        label: "Raw data",
        note: "Data as collected in the clinical trial.",
      },
      {
        label: "SDTM",
        note: "Standardized into CDISC SDTM tabulation datasets.",
      },
      {
        label: "ADaM",
        note: "Derived into ADaM analysis datasets.",
      },
      {
        label: "TLFs",
        note: "Tables, listings and figures, built in SAS and R.",
      },
      {
        label: "CSR",
        note: "Clinical Study Reports for FDA submissions, for more than 10 pharmaceutical clients.",
      },
    ],
  },
  "role-numeric-mind:validation": {
    title: "Tracing a finding to the record",
    kind: "trace",
    items: [
      {
        label: "Pinnacle 21 finding",
        meta: "start",
        detail:
          "A validation check fails. On its own it doesn't say which patient records are wrong.",
      },
      {
        label: "SDTM and ADaM datasets",
        meta: "trace",
        detail:
          "The debugging tool follows the finding through the SDTM and ADaM datasets.",
      },
      {
        label: "Patient records",
        meta: "fix",
        detail:
          "It ends at the patient records to fix. This replaced manual lookups and cut issue resolution time by 75%.",
      },
    ],
  },
  "role-numeric-mind:leading": {
    title: "What leading looked like",
    kind: "steps",
    items: [
      {
        label: "12 analysts",
        note: "Across concurrent clinical projects.",
      },
      {
        label: "Cross-team",
        note: "Working with statisticians and data managers.",
      },
      {
        label: "Mentoring",
        note: "One-on-one mentoring on pipeline improvements raised data validation accuracy by 60%.",
      },
      {
        label: "3 weeks",
        note: "FDA submission packages delivered within 3 weeks, across 15+ studies.",
      },
    ],
  },

  // ---------- Vector Guard ----------
  "work-vector-guard:overview": {
    title: "Attack success, before and after",
    kind: "bars",
    states: ["No defense", "Vector Guard"],
    stateNotes: [
      "Attack success with no defense. Tap a bar for details.",
      "Attack success with the four checks in place. Tap a bar for details.",
    ],
    lowerIsBetter: true,
    items: [
      {
        label: "Threat intel (SOC)",
        value: [59, 3],
        max: 100,
        suffix: "%",
        note: "1,063 CVE and ATT&CK documents.",
      },
      {
        label: "NQ benchmark",
        value: [72, 24],
        max: 100,
        suffix: "%",
        note: "The public Natural Questions benchmark: open-domain questions are harder to defend.",
      },
    ],
  },
  "work-vector-guard:approach": {
    title: "Order of work",
    kind: "steps",
    items: [
      {
        label: "Attack",
        note: "Attack first, so the defense is measured against a real number.",
      },
      {
        label: "Layer",
        note: "Several cheap checks in layers, not one expensive one.",
      },
      {
        label: "Benchmark",
        note: "Report attack success on a public benchmark too, not just my own data.",
      },
    ],
  },
  "work-vector-guard:attack": {
    title: "Two poisoned documents",
    example: true,
    kind: "compare",
    tabs: [
      {
        label: "Clean",
        body: "Q: How severe is CVE-YYYY-NNNN?\nRetrieved: CVE doc · CVE doc · ATT&CK doc\nA: [[the severity the trusted sources give]]",
        note: "The retriever returns trusted documents and the answer follows them.",
      },
      {
        label: "Poisoned",
        body: "Q: How severe is CVE-YYYY-NNNN?\nRetrieved: [[poisoned doc]] · [[poisoned doc]] · CVE doc\nA: [[the severity the attacker wrote]]",
        note: "2 poisoned documents per query, out of more than a thousand, changed the answer 59% of the time.",
      },
    ],
  },
  "work-vector-guard:defense": {
    title: "Where a document gets stopped",
    kind: "route",
    stages: ["Structural", "Embedding", "NLI", "LLM score", "Model"],
    cases: [
      {
        label: "Odd format",
        path: [0],
        end: "caught",
        note: "Looks unlike the rest of the corpus: the cheap structural filter catches it.",
      },
      {
        label: "Odd embedding",
        path: [0, 1],
        end: "caught",
        note: "Sits unlike the rest of the corpus in embedding space: anomaly detection catches it.",
      },
      {
        label: "Reads normal, contradicts",
        path: [0, 1, 2],
        end: "caught",
        note: "Reads normally but contradicts trusted sources: the slower NLI and LLM checks are for these.",
      },
      {
        label: "Clean",
        path: [0, 1, 2, 3, 4],
        end: "pass",
        note: "Passes all four checks and reaches the model.",
      },
    ],
  },

  // ---------- Research Assistant Agent ----------
  "work-research-assistant-agent:overview": {
    title: "Checking before answering",
    example: true,
    kind: "compare",
    tabs: [
      {
        label: "Plain RAG",
        body: "Retrieve → generate → [[return, supported or not]]",
        note: "Answers confidently even when the documents don't support the answer.",
      },
      {
        label: "With reflection",
        body: "Retrieve → generate → [[is it grounded?]] → return or try again",
        note: "The self-reflection step reduced hallucinations by 80%.",
      },
    ],
  },
  "work-research-assistant-agent:approach": {
    title: "Three rules",
    kind: "steps",
    items: [
      { label: "Ground", note: "Every answer rests on retrieved documents." },
      {
        label: "Check",
        note: "The answer is checked before the user sees it.",
      },
      {
        label: "Trace",
        note: "Everything is traced, so failures can be explained.",
      },
    ],
  },
  "work-research-assistant-agent:self-reflection": {
    title: "The reflection loop",
    kind: "route",
    stages: ["Retrieve", "Generate", "Reflect", "Return"],
    cases: [
      {
        label: "Grounded draft",
        path: [0, 1, 2, 3],
        end: "pass",
        note: "The draft is supported by the retrieved documents, so it's returned.",
      },
      {
        label: "Unsupported draft",
        path: [0, 1, 2],
        end: "loop",
        note: "Reflection finds a claim the documents don't support, so the agent tries again instead of answering.",
      },
    ],
  },
  "work-research-assistant-agent:observability": {
    title: "A traced run",
    example: true,
    kind: "trace",
    items: [
      {
        label: "route",
        meta: "LangGraph",
        detail:
          "Which path the agent chose. Traces are used to evaluate its routing.",
      },
      {
        label: "retrieve",
        meta: "Milvus",
        detail:
          "Which documents came back, to keep improving retrieval accuracy.",
      },
      {
        label: "generate",
        meta: "LLM",
        detail: "The draft answer and its inputs.",
      },
      {
        label: "reflect",
        meta: "LLM",
        detail: "Whether the draft was judged grounded, and why.",
      },
    ],
  },
  "work-research-assistant-agent:deployment": {
    title: "Services on GKE",
    kind: "steps",
    items: [
      { label: "Streamlit", note: "The UI on top." },
      { label: "LangGraph", note: "The agent backend, its own microservice." },
      { label: "Milvus", note: "The vector store, its own microservice." },
      {
        label: "MCP",
        note: "MCP services, with Google Translate wired in through FastMCP for multilingual questions.",
      },
      {
        label: "GKE",
        note: "All of it on GKE, built with Docker and Terraform.",
      },
    ],
  },

  // ---------- SysToolChain ----------
  "work-systoolchain:overview": {
    title: "Three parts",
    kind: "steps",
    items: [
      {
        label: "Batch",
        note: "144K+ FIFA player records loaded with PySpark.",
      },
      {
        label: "Streaming",
        note: "Live World Cup comments through Kafka.",
      },
      {
        label: "Models",
        note: "Player rating prediction: 0.98 R² with a Random Forest.",
      },
    ],
  },
  "work-systoolchain:batch": {
    title: "The batch path",
    kind: "steps",
    items: [
      {
        label: "Cloud Storage",
        note: "Raw player files land in Cloud Storage.",
      },
      {
        label: "Dataproc",
        note: "PySpark on GCP Dataproc processes 144K+ records.",
      },
      {
        label: "PostgreSQL",
        note: "Written over JDBC to a self-hosted PostgreSQL Docker container.",
      },
    ],
  },
  "work-systoolchain:streaming": {
    title: "Filtering ambiguous names",
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
    noteOff:
      "Say one player is called King. Without a filter, every “king” counts as a mention.",
    noteOn:
      "Ambiguous names are filtered out to reduce false matches. Only real mentions are tracked.",
  },
  "work-systoolchain:models": {
    title: "Prediction error (RMSE, lower is better)",
    kind: "bars",
    lowerIsBetter: true,
    items: [
      {
        label: "Linear baseline",
        value: 1.94,
        max: 2,
        note: "1.94 RMSE.",
      },
      {
        label: "Random Forest",
        value: 0.97,
        max: 2,
        note: "0.97 RMSE and 0.98 R²: roughly half the baseline's error.",
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
const button = (label: string, cls = "mk-chip") =>
  h("button", { type: "button", class: cls }, label);

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
function choices(labels: string[], onPick: (i: number) => void) {
  const row = h("div", { class: "mk-choices", role: "group" });
  const btns = labels.map((l, i) => {
    const b = button(l);
    b.setAttribute("aria-pressed", "false");
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
  const wrap = h("div");
  const { row, pick } = choices(
    m.items.map((s, i) => `${i + 1}. ${s.label}`),
    (i) => {
      note.textContent = m.items[i].note;
      next.disabled = i === m.items.length - 1;
      idx = i;
    },
  );
  row.classList.add("mk-steps");
  let idx = 0;
  const next = button("Next →", "mk-button");
  next.addEventListener("click", () =>
    pick(Math.min(idx + 1, m.items.length - 1)),
  );
  wrap.append(row, next);
  pick(0);
  return wrap;
}

function renderCompare(m: Compare, note: HTMLElement) {
  const wrap = h("div");
  const view = h("div", { class: "mk-view" });
  const { row, pick } = choices(
    m.tabs.map((t) => t.label),
    (i) => {
      view.replaceChildren(rich(m.tabs[i].body));
      note.textContent = m.tabs[i].note;
    },
  );
  wrap.append(row, view);
  pick(0);
  return wrap;
}

function renderBars(m: Bars, note: HTMLElement) {
  const wrap = h("div");
  let state = 0;
  const rows = m.items.map((item) => {
    const fill = h("span", { class: "mk-fill" });
    const val = h("span", { class: "mk-val" });
    const r = h(
      "button",
      { type: "button", class: "mk-bar" },
      h("span", { class: "mk-bar-label" }, item.label),
      h("span", { class: "mk-track" }, fill),
      val,
    );
    r.addEventListener("click", () => {
      note.textContent = item.note;
    });
    return { item, fill, val };
  });
  function draw() {
    for (const { item, fill, val } of rows) {
      const v = Array.isArray(item.value) ? item.value[state] : item.value;
      fill.style.width = `${(v / item.max) * 100}%`;
      val.textContent = `${v}${item.suffix ?? ""}`;
    }
  }
  if (m.states) {
    const { row, pick } = choices(m.states, (i) => {
      state = i;
      draw();
      note.textContent = m.stateNotes?.[i] ?? "Tap a bar for details.";
    });
    wrap.append(row);
    wrap.append(...rows.map((r) => r.fill.closest(".mk-bar")!));
    pick(0);
  } else {
    wrap.append(...rows.map((r) => r.fill.closest(".mk-bar")!));
    draw();
    note.textContent = `Tap a bar for details.${m.lowerIsBetter ? " Shorter is better." : ""}`;
  }
  return wrap;
}

function renderRoute(m: Route, note: HTMLElement) {
  const wrap = h("div");
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
      const step = reduceMotion.matches ? 0 : 280;
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
  wrap.append(row, list);
  pick(0);
  return wrap;
}

function renderTrace(m: Trace, note: HTMLElement) {
  const wrap = h("div");
  const { row, pick } = choices(
    m.items.map((t) => (t.meta ? `${t.label} · ${t.meta}` : t.label)),
    (i) => {
      note.textContent = m.items[i].detail;
    },
  );
  row.classList.add("mk-trace");
  wrap.append(row);
  pick(0);
  return wrap;
}

function renderFilter(m: Filter, note: HTMLElement) {
  const wrap = h("div");
  const items = m.items.map((it) =>
    h("li", { class: it.flagged ? "mk-item is-flagged" : "mk-item" }, it.text),
  );
  const list = h("ul", { class: "mk-list" }, ...items);
  const toggle = button(m.toggle);
  toggle.setAttribute("aria-pressed", "false");
  const set = (on: boolean) => {
    toggle.setAttribute("aria-pressed", String(on));
    list.classList.toggle("is-filtered", on);
    note.textContent = on ? m.noteOn : m.noteOff;
  };
  toggle.addEventListener("click", () =>
    set(toggle.getAttribute("aria-pressed") !== "true"),
  );
  wrap.append(h("div", { class: "mk-choices" }, toggle), list);
  set(false);
  return wrap;
}

function render(m: Mockup) {
  const note = h("p", { class: "mk-note", "aria-live": "polite" });
  const body =
    m.kind === "steps"
      ? renderSteps(m, note)
      : m.kind === "compare"
        ? renderCompare(m, note)
        : m.kind === "bars"
          ? renderBars(m, note)
          : m.kind === "route"
            ? renderRoute(m, note)
            : m.kind === "trace"
              ? renderTrace(m, note)
              : renderFilter(m, note);
  const head = h("p", { class: "mk-title" }, m.title);
  if (m.example) head.append(h("span", { class: "mk-tag" }, "Example"));
  return [head, body, note];
}

// ---------- wire up the dividers in one drawer ----------
let counter = 0;
export function enhance(dialog: HTMLDialogElement) {
  const caseEl = dialog.querySelector<HTMLElement>(".case");
  if (!caseEl || caseEl.classList.contains("has-mockups")) return;
  const heads = [...caseEl.querySelectorAll<HTMLHeadingElement>(":scope > h2")];
  heads.forEach((h2, i) => {
    if (i === 0) return;
    const above = heads[i - 1];
    const m = MOCKUPS[`${dialog.id}:${above.id}`];
    const box = h("div", { class: "mk" });
    if (!m) {
      box.append(h("span", { class: "mk-dots", "aria-hidden": "true" }, "···"));
      h2.before(box);
      return;
    }
    const id = `mk-${++counter}`;
    const toggle = h(
      "button",
      {
        type: "button",
        class: "mk-toggle",
        "aria-expanded": "false",
        "aria-controls": id,
      },
      h("span", { "aria-hidden": "true" }, "···"),
      h(
        "span",
        { class: "mk-toggle-label" },
        `See how it works: ${above.textContent}`,
      ),
    );
    const panel = h("div", { class: "mk-panel", id, hidden: "" });
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      if (open && !panel.childElementCount) panel.append(...render(m));
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    });
    box.append(toggle, panel);
    h2.before(box);
  });
  caseEl.classList.add("has-mockups");
}
