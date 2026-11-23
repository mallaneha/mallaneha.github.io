# Design

## Feel

Modeled on ch.sh: one narrow column, small text, generous white space, lists of rows with icon
tiles, and details that open in a bottom-sheet drawer instead of a new page. Small, tactile
feedback on every click. It should feel like an engineer's notebook, not an agency portfolio.
We copy the interaction patterns, not ch.sh's content, branding or code.

## Page structure (`src/pages/index.astro`)

1. Header: name (h1), tagline (muted), availability badge (pill with a status dot, plus "Resume (PDF)"
   when the file exists), 3 short paragraphs (now, what I build, which industries),
   "Reach me at <email, click to copy>, on LinkedIn, or read my resume".
2. Featured: projects with `featured: true`. Each row opens a drawer.
3. Experience: each row opens a drawer.
4. Building: `status: building` projects, static rows marked "In progress".
5. Writing: latest 2 published posts + "All writing".
6. Connect: email (copies, toast), LinkedIn, GitHub, resume when available.
7. Footer: optional motto · © year · city, then the sound toggle and the light/dark theme toggle.
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

## Click effects (`src/scripts/effects.ts`)

Every click: 6 short lines burst outward from the pointer (12px radius, 300ms, 30% opacity, text
color), a soft synthesized two-tick sound, and an 8ms vibration on phones. The footer toggle mutes
all three and is remembered in `localStorage`. No sparks for keyboard clicks or with
`prefers-reduced-motion`.

## Tokens (`src/styles/tokens.css`)

- Fonts: system sans and mono stacks. No web fonts.
- Sizes: rows and drawers at `--text-sm` (14px); post bodies at `--text-base`.
- Colors: text, body, muted, faint, subtle (dotted rules), border, surface, hover, overlay. Each has
  a dark-mode value; contrast ratios are noted in the file.
- Motion: `--ease-drawer`, `--drawer-in`, `--drawer-out`, `--transition`.

## Voice

- First person, direct, specific. "I built X to cut Y from 59% to 3%" beats "passionate about AI safety".
- Numbers and concrete results over adjectives. No emoji. No marketing language.
- Target readers: hiring managers for applied AI and data/AI governance roles in healthcare, banking, insurance.
