# Design

## Feel

Modeled on ch.sh: one narrow column, small text, generous white space, lists of rows with icon
tiles, and details that open in a bottom-sheet drawer instead of a new page. Small, tactile
feedback on every click. It should feel like an engineer's notebook, not an agency portfolio.
We copy the interaction patterns, not ch.sh's content, branding or code.

## Page structure (`src/pages/index.astro`)

1. Header: the availability line first, above the name: status dot and `site.availability` in small text
   on a soft green highlight (`--color-highlight`, sweeps in once on load unless reduced motion). Then the
   name (h1) with LinkedIn and GitHub icon links at the right of the same line (plus a resume icon when the
   file exists), and the tagline (muted). Then 3 short paragraphs (now, what I build, which industries).
   The email is only in Connect.
2. Experience: each row opens a drawer. The tile shows the company's logo (`logo:` in frontmatter,
   file in `public/logos/`) in its own colors on a light tile,
   or the icon when there's no logo.
3. Projects: projects with `featured: true`, three in one line (stacked on phones), no icon tile, an open-link arrow on each. Each row opens a drawer.
4. Writing: latest 3 published posts, then a quiet "All writing · N posts →" link styled like a row (no fill until hover).
5. Connect: one column: Email (copies, toast), LinkedIn, GitHub, and Resume when `site.resume` is set.
   LinkedIn and GitHub also appear as icon links next to the name in the header.
6. Footer: optional motto · © year · city · local time (live, from `site.timeZone`), then the sound
   toggle and the light/dark theme toggle.
   The theme follows the system until toggled; the choice is saved in localStorage (`theme`).
   Dark values live twice in `tokens.css` (system media query and `[data-theme="dark"]`): keep them in sync.

## Row (`src/components/Row.astro`)

40px icon tile (radius 10px, `--color-surface`), name in medium weight, one muted line below.
Hover: row background `--color-hover`, icon scales 1.1. Press: scales to 0.98. External links
show ↗ on hover (always on touch screens).

## Drawer (`src/components/Drawer.astro`, `src/scripts/drawer.ts`)

- Native `<dialog>`, docked to the bottom, max 85% of the viewport height, 16px top corners.
- Slides up in 500ms with `cubic-bezier(0.32, 0.72, 0, 1)`; closes in 300ms. Backdrop: 20% black,
  2px blur.
- Header: icon · name · short description, a "Read"/"Code"/"Visit ↗" pill when there's a link,
  and ✕. On phones the description and pill take turns every 3s.
- Close with ✕, Esc, a backdrop click, or by dragging the header down. ←/→ move between drawers.
  The URL hash (`#work-<slug>`, `#role-<slug>`) deep-links to a drawer.
- Body: 30rem text column inside a 44rem header width. Case-study format: see `docs/CONTENT.md`.
- "How it works" cards (`src/scripts/mockups.ts`, `src/styles/mockups.css`): a closed `<details>` at the end of a
  few sections, only where a reader may lack context (a term like SDTM or RMSE, or a mechanism like a poisoning
  attack). Open, it shows one line of context, a small interactive widget, and a short caption. Keyed by drawer id +
  heading id. Facts come only from the case-study text; sample text is tagged "Example". With the cards loaded,
  sections are separated by space alone (no `···`). To remove: delete both files and the `import("./mockups")`
  line in `drawer.ts`.

## Click effects (`src/scripts/effects.ts`)

Every page, for clicks on links and buttons (not on text or empty space), and not inside an open
drawer. Each click: 6 short lines burst outward from the pointer (12px radius, 300ms, 30% opacity, text
color), a soft synthesized two-tick sound, and an 8ms vibration on phones. The footer toggle mutes the
sound and vibration but keeps the sparks; it's remembered in `localStorage`. No sparks for keyboard
clicks or with `prefers-reduced-motion`; sound starts muted with `prefers-reduced-motion` until toggled on.

## Explainer widgets (`src/components/Explainers.astro`, `src/scripts/explainers.ts`)

Interactive figures inside posts, styled as figures in the notebook: a white (`--color-bg`) card with a hairline
border, a header strip (a mono "Interactive" kicker with the green status dot, then the title) and a footnote under
a dotted rule. `--text-sm`, controls stacked on phones, 44px tap targets, numbers in the mono font. Controls are
monochrome and drawn, not native: sliders are a thin track filled in `--color-text` with a raised thumb, checkboxes
fill with `--color-text`, the segmented control is a sunken track with the selected segment raised
(`--color-raised`, `--shadow-raised`). Chart labels render at a true 11px whatever the chart's width.
All widgets on one page, dev server only: http://localhost:4321/dev/widgets/ (`src/pages/dev/[page].astro`). Tables scroll inside the panel instead of the page.
Colors come from one data palette of seven roles (`tokens.css`): `--chart-main` for the measured series and what
went right, `--chart-alert` only for what went wrong or is dangerous, `--chart-neutral` for no verdict,
`--chart-other` for a third category, each but neutral with a `-soft` step. The palette is Bauhaus: primary blue,
signal red, yellow and black. Yellow is only ever a fill: text on it is `--chart-on-other` (black), and yellow
marks on white get a `--color-text` outline. The abstain lab colors each dot by its
outcome at the current floor, so dots, bar and legend agree. Weights are bars next to the number, never colored cell
backgrounds, so text contrast doesn't depend on the data. Hover, tap or arrow keys show a dot's question in a tooltip (toast colors). Bar transitions only run without
`prefers-reduced-motion`.

## Tokens (`src/styles/tokens.css`)

- Fonts: system sans and mono stacks. No web fonts.
- Sizes: rows and drawers at `--text-sm` (14px); post bodies at `--text-base`.
- Colors: text, body, muted, faint, subtle (dotted rules), border, surface, hover, overlay. Each has
  a dark-mode value; contrast ratios are noted in the file.
- Data colors: `--chart-main`, `-alert`, `-neutral`, `-other` (+ `-soft` steps), one palette for the post widgets
  and the drawers' figures (`mockups.css`, `story.css`). Alert means wrong, flagged or dangerous, and nothing else.
  Candidate palettes can be compared on the real widgets at /dev/widgets/ (`src/data/dev-palettes.ts`; `[` and `]`
  cycle them).
- Motion: `--ease-drawer`, `--drawer-in`, `--drawer-out`, `--transition`.

## Voice

- First person, direct, specific. "I built X to cut Y from 59% to 3%" beats "passionate about AI safety".
- Numbers and concrete results over adjectives. No emoji. No marketing language.
- Target readers: hiring managers for applied AI and data/AI governance roles in healthcare, banking, insurance.
