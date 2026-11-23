// Candidate data palettes for the dev-only widgets page (src/pages/dev/[page].astro), to compare them on the real
// widgets. Production uses only the values in src/styles/tokens.css; once a palette is picked, its values go there.
//
// Each palette fills the same seven roles the widgets and drawer figures use:
//   main        the measured series, and what went right
//   main-soft   a second series of the same kind
//   alert       what went wrong or is dangerous, and nothing else (also used for text)
//   alert-soft  a lesser error
//   neutral     no verdict: a refusal, layer norms (also used for text and under white tag text)
//   other       a third category with no verdict (also under white tag text)
//   other-soft  a second series of that category

export const ROLES = [
  "main",
  "main-soft",
  "alert",
  "alert-soft",
  "neutral",
  "other",
  "other-soft",
] as const;
export type Role = (typeof ROLES)[number];
type Values = Record<Role, string>;

export interface Palette {
  id: string;
  name: string;
  story: string;
  light: Values;
  dark: Values;
}

const v = (...c: string[]): Values =>
  Object.fromEntries(ROLES.map((r, i) => [r, c[i]!])) as Values;

export const PALETTES: Palette[] = [
  {
    id: "ink",
    name: "Ink & red pencil",
    story:
      "The current one. Fountain-pen blue and a red correction pencil, with brass as the odd one out.",
    light: v(
      "#0b5cad",
      "#5b8bd0",
      "#b4233c",
      "#d9667a",
      "#737373",
      "#8f6412",
      "#ad8536",
    ),
    dark: v(
      "#8ab8ff",
      "#4f7fc4",
      "#ff7a8d",
      "#c4566a",
      "#8a8a8a",
      "#dba84f",
      "#9c7a3c",
    ),
  },
  {
    id: "prayer",
    name: "Prayer flags",
    story:
      "Lungta, the Himalayan prayer flags: blue sky, red fire, green water, yellow earth. Saturated, and Neha's own.",
    light: v(
      "#0050b5",
      "#3d84e6",
      "#d7261e",
      "#f2711c",
      "#5c5c5c",
      "#13874a",
      "#e0a500",
    ),
    dark: v(
      "#5b9cff",
      "#2f6fd1",
      "#ff5a4f",
      "#ff9a4d",
      "#8a8a8a",
      "#3ecf7a",
      "#ffd23f",
    ),
  },
  {
    id: "nepal",
    name: "Nepal flag",
    story:
      "The flag's crimson and deep blue, with the gold of its sun. Two strong hues and a warm third.",
    light: v(
      "#003893",
      "#4f6fbf",
      "#dc143c",
      "#ef7b8f",
      "#5c5c5c",
      "#b07800",
      "#d9a640",
    ),
    dark: v(
      "#6f95ff",
      "#3557b0",
      "#ff4d6a",
      "#b8384f",
      "#8a8a8a",
      "#f0b429",
      "#a87d1f",
    ),
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    story:
      "Primary blue, signal red, yellow and black. The boldest option; black carries the neutral role.",
    light: v(
      "#1f3fd1",
      "#8193ec",
      "#e10600",
      "#f47a6b",
      "#111111",
      "#f5b800",
      "#fadb6e",
    ),
    dark: v(
      "#5b78ff",
      "#2f45a8",
      "#ff3b30",
      "#a8322b",
      "#ededed",
      "#ffcc00",
      "#a88a1a",
    ),
  },
  {
    id: "ibm",
    name: "IBM colorblind-safe",
    story:
      "IBM Design's five-color set, built to stay distinct for color-blind readers. Violet, blue, magenta, orange, gold.",
    light: v(
      "#785ef0",
      "#648fff",
      "#dc267f",
      "#f17fb5",
      "#6f6f6f",
      "#fe6100",
      "#ffb000",
    ),
    dark: v(
      "#9d88ff",
      "#7fa4ff",
      "#ff4fa0",
      "#b34d82",
      "#8a8a8a",
      "#ff7a2e",
      "#ffc233",
    ),
  },
  {
    id: "okabe",
    name: "Okabe–Ito",
    story:
      "The standard colorblind-safe palette (Okabe & Ito 2008), recommended by Nature. Blue, vermillion, green, pink.",
    light: v(
      "#0072b2",
      "#56b4e9",
      "#d55e00",
      "#e69f00",
      "#6f6f6f",
      "#009e73",
      "#cc79a7",
    ),
    dark: v(
      "#56b4e9",
      "#0072b2",
      "#e8742a",
      "#e69f00",
      "#999999",
      "#2bc79a",
      "#cc79a7",
    ),
  },
  {
    id: "geist",
    name: "Geist",
    story:
      "Vercel's Geist colors: pure blue and red, violet and amber. Crisp on white, at home on a developer's site.",
    light: v(
      "#0070f3",
      "#79b8ff",
      "#ee0000",
      "#ff6b6b",
      "#666666",
      "#7928ca",
      "#f5a623",
    ),
    dark: v(
      "#3291ff",
      "#1a4f99",
      "#ff4444",
      "#a33333",
      "#888888",
      "#a855f7",
      "#f7b955",
    ),
  },
  {
    id: "category10",
    name: "Category10",
    story:
      "D3 and Matplotlib's default series colors. Instantly familiar to anyone who reads ML papers.",
    light: v(
      "#1f77b4",
      "#17becf",
      "#d62728",
      "#ff7f0e",
      "#7f7f7f",
      "#9467bd",
      "#2ca02c",
    ),
    dark: v(
      "#4fa3e0",
      "#17becf",
      "#ff5a5b",
      "#ff9a3c",
      "#9a9a9a",
      "#b392e0",
      "#4cc94c",
    ),
  },
];

/** CSS that applies a palette when <html data-palette="id">, in light and dark, over the tokens.css values. */
export function paletteCss(): string {
  const decl = (vals: Values) =>
    ROLES.map((r) => `--chart-${r}: ${vals[r]};`).join(" ");
  return PALETTES.map(
    (p) =>
      // html:root[…] outranks tokens.css's :root and its dark blocks (:root:not(…), :root[data-theme]).
      `html:root[data-palette="${p.id}"] { ${decl(p.light)} }
@media (prefers-color-scheme: dark) { html:root[data-palette="${p.id}"]:not([data-theme="light"]) { ${decl(p.dark)} } }
html:root[data-palette="${p.id}"][data-theme="dark"] { ${decl(p.dark)} }`,
  ).join("\n");
}
