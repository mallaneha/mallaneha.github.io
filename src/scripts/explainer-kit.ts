// Shared building blocks for the interactive widgets in posts (explainers.ts, rag-explainers.ts).

export type Kid = Node | string;

export function h<K extends keyof HTMLElementTagNameMap>(
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

export const SVG_NS = "http://www.w3.org/2000/svg";
export function s(
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
export const nextId = (p: string) => `${p}-${++uid}`;

export const fixed = (n: number, d = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
export const int = (n: number) => Math.round(n).toLocaleString("en-US");
export const pct = (n: number) =>
  `${(n * 100).toFixed(n < 0.1 && n > 0 ? 1 : 0)}%`;

export function bytes(b: number): string {
  if (b >= 1e9) return `${fixed(b / 1e9, 1)} GB`;
  if (b >= 1e6) return `${fixed(b / 1e6, 2)} MB`;
  if (b >= 1e3) return `${fixed(b / 1e3, 0)} kB`;
  return `${int(b)} B`;
}

export function params(n: number): string {
  if (n >= 1e9) return `${fixed(n / 1e9, 2)}B`;
  if (n >= 1e6) return `${fixed(n / 1e6, 1)}M`;
  return int(n);
}

export function softmax(xs: number[]): number[] {
  const finite = xs.filter(Number.isFinite);
  const m = Math.max(...finite);
  const ex = xs.map((x) => (Number.isFinite(x) ? Math.exp(x - m) : 0));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

export const dot = (a: number[], b: number[]) =>
  a.reduce((acc, x, i) => acc + x * b[i]!, 0);

// Motion. While you drag or type, everything follows your hand with no easing. After a discrete change (a
// token, checkbox, preset or button) bars ease over --duration-state so you can see what moved. The
// .is-instant class on the widget switches the transitions off for the drag/type case.
export const motion = (root: HTMLElement) => (animate: boolean) =>
  root.classList.toggle("is-instant", !animate);

export function slider(
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

/** Accept what people type ("50,257", "8k", "16 GB"), return NaN for anything else. */
export function parseLoose(raw: string, allowK = false): number {
  let t = raw
    .trim()
    .toLowerCase()
    .replace(/[\s,_]/g, "");
  let mult = 1;
  if (allowK && /\dk$/.test(t)) {
    mult = 1e3;
    t = t.slice(0, -1);
  } else {
    t = t.replace(/[a-z/]+$/, ""); // a trailing unit: "16gb", "820gb/s"
  }
  if (!/^(\d+\.?\d*|\.\d+)(e\d+)?$/.test(t)) return NaN;
  return Number(t) * mult;
}

// A text field that is liberal in what it accepts and strict in what it shows: it parses loosely while you
// type, keeps the last valid value when the text isn't a number, and rewrites the text cleanly on blur.
export function numberField(
  label: string,
  value: number,
  opts: { min: number; integer?: boolean; allowK?: boolean },
) {
  const id = nextId("xp");
  const show = (v: number) => (opts.integer ? int(v) : String(v));
  const input = h("input", {
    type: "text",
    id,
    value: show(value),
    inputmode: opts.integer ? "numeric" : "decimal",
    autocomplete: "off",
    spellcheck: "false",
  });
  const hint = h(
    "span",
    { class: "xp-hint", id: `${id}-hint`, hidden: true },
    `Enter a number of at least ${opts.min}${opts.allowK ? ", like 8192 or 8k" : ""}.`,
  );
  let last = value;
  const valid = (ok: boolean) => {
    input.setAttribute("aria-invalid", String(!ok));
    hint.hidden = ok;
    if (ok) input.removeAttribute("aria-describedby");
    else input.setAttribute("aria-describedby", hint.id);
  };
  const parse = () => {
    let v = parseLoose(input.value, opts.allowK);
    if (opts.integer) v = Math.round(v);
    const ok = Number.isFinite(v) && v >= opts.min;
    valid(ok);
    if (ok) last = v;
    return ok;
  };
  input.addEventListener("input", parse);
  input.addEventListener("blur", () => {
    if (parse()) input.value = show(last);
  });
  const wrap = h(
    "div",
    { class: "xp-field xp-field-number" },
    h("label", { for: id }, label),
    input,
    hint,
  );
  return {
    wrap,
    input,
    value: () => last,
    set: (v: number) => {
      last = v;
      input.value = show(v);
      valid(true);
    },
  };
}

export function checkbox(label: string, checked: boolean) {
  const input = h("input", { type: "checkbox", checked });
  const wrap = h("label", { class: "xp-check" }, input, label);
  return { wrap, input };
}

export function select(label: string, options: string[], value = 0) {
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

/** Radio buttons drawn as one segmented control: few options, all visible, one tap each. */
export function choice(legend: string, options: string[], value: number) {
  const name = nextId("choice");
  const inputs = options.map((_, i) =>
    h("input", { type: "radio", name, value: String(i), checked: i === value }),
  );
  const wrap = h(
    "fieldset",
    { class: "xp-choice" },
    h("legend", {}, legend),
    h(
      "div",
      { class: "xp-tabs" },
      ...options.map((o, i) => h("label", {}, inputs[i]!, h("span", {}, o))),
    ),
  );
  return { wrap, inputs };
}

export function bar(): { el: HTMLSpanElement; set: (f: number) => void } {
  const fill = h("span", { class: "xp-bar-fill" });
  const el = h("span", { class: "xp-bar", "aria-hidden": "true" }, fill);
  return {
    el,
    set: (f) =>
      (fill.style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`),
  };
}

/** A table cell holding a percentage over a small bar. Built once, updated in place so the bar can ease. */
export function weightCell() {
  const share = h("span");
  const b = bar();
  const td = h("td", { class: "xp-weight" }, share, b.el);
  return {
    td,
    set: (f: number, zero = pct(f)) => {
      share.textContent = f === 0 ? zero : pct(f);
      b.set(f);
    },
  };
}

export const num = (
  input: HTMLInputElement | HTMLSelectElement,
  fallback: number,
) => {
  const v = Number(input.value);
  return Number.isFinite(v) ? v : fallback;
};

export const head = (title: string, ...extra: Node[]) =>
  h(
    "div",
    { class: "xp-head" },
    h("p", { class: "xp-title" }, title),
    ...extra,
  );

export const tableHead = (cols: (string | [string, string])[]) =>
  h(
    "thead",
    {},
    h(
      "tr",
      {},
      ...cols.map((c) =>
        typeof c === "string"
          ? h("th", { scope: "col" }, c)
          : h("th", { scope: "col", class: c[1] }, c[0]),
      ),
    ),
  );
