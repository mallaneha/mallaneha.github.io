# Design

## Feel

Modeled on ch.sh: one narrow column, small text, generous white space, lists of rows with icon
tiles, and details that open in a bottom-sheet drawer instead of a new page. Small, tactile
feedback on every click. It should feel like an engineer's notebook, not an agency portfolio.
We copy the interaction patterns, not ch.sh's content, branding or code.

## Page structure (`src/pages/index.astro`)

1. Header: name (h1), tagline (muted), availability card (status dot, "Open to full-time roles", a muted
   date line, LinkedIn and GitHub icons, and a "Get in touch" button that jumps to Connect; on phones the icons
   and button wrap to a second line), "Resume (PDF)" below it when the file exists,
   3 short paragraphs (now, what I build, which industries).
   The email is only in Connect.
2. Experience: each row opens a drawer. The tile shows the company's logo (`logo:` in frontmatter,
   file in `public/logos/`) in its own colors on a light tile,
   or the icon when there's no logo.
3. Projects: projects with `featured: true`, three in one line (stacked on phones), no icon tile, an open-link arrow on each. Each row opens a drawer.
4. Writing: latest 3 published posts, then an "All writing · N posts →" pill button.
5. Connect: one column: Email (copies, toast), LinkedIn, GitHub, and Resume when `site.resume` is set.
   LinkedIn and GitHub also appear as icon links in the availability card in the header.
6. Footer: optional motto · © year · city · local time (live, from `site.timeZone`), then the sound
   toggle (home page only) and the light/dark theme toggle.
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

Home page only (`<Base effects>` sets `data-effects` on `<body>`), and not for clicks inside an open
drawer. Every click: 6 short lines burst outward from the pointer (12px radius, 300ms, 30% opacity, text
color), a soft synthesized two-tick sound, and an 8ms vibration on phones. The footer toggle mutes the
sound and vibration but keeps the sparks; it's remembered in `localStorage`. No sparks for keyboard
clicks or with `prefers-reduced-motion`. Posts, the writing index and 404 have no effects and no toggle.

## Explainer widgets (`src/components/Explainers.astro`, `src/scripts/explainers.ts`)

Interactive figures inside posts: a bordered `--color-surface` panel at `--text-sm`, controls stacked on
phones, 44px tap targets, numbers in the mono font. Tables scroll inside the panel instead of the page.
Charts and bars use `--chart-1` to `--chart-5`; weights are bars next to the number, never colored cell
backgrounds, so text contrast doesn't depend on the data. Bar transitions only run without
`prefers-reduced-motion`.

## Tokens (`src/styles/tokens.css`)

- Fonts: system sans and mono stacks. No web fonts.
- Sizes: rows and drawers at `--text-sm` (14px); post bodies at `--text-base`.
- Colors: text, body, muted, faint, subtle (dotted rules), border, surface, hover, overlay. Each has
  a dark-mode value; contrast ratios are noted in the file.
- Chart series: `--chart-1` to `--chart-5`, for the explainer widgets.
- Motion: `--ease-drawer`, `--drawer-in`, `--drawer-out`, `--transition`.

## Voice

- First person, direct, specific. "I built X to cut Y from 59% to 3%" beats "passionate about AI safety".
- Numbers and concrete results over adjectives. No emoji. No marketing language.
- Target readers: hiring managers for applied AI and data/AI governance roles in healthcare, banking, insurance.
