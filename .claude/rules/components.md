---
paths:
  - "src/components/**"
  - "src/layouts/**"
  - "src/pages/**"
  - "src/styles/**"
---

# UI code

- Use tokens from `src/styles/tokens.css` (`var(--color-muted)`, `var(--space-4)`). No raw hex colors or ad-hoc spacing in components.
- Add new tokens to `tokens.css` with a dark-mode value, and check contrast ≥ 4.5:1 in both modes.
- One component per file, PascalCase filename, scoped `<style>` in the component.
- Client JS lives only in `src/scripts/drawer.ts` and `src/scripts/effects.ts` (plain TS, no framework, no `client:*`).
  Extend those rather than adding new scripts; ask before adding a dependency.
  The exception is `src/scripts/explainers.ts` and `src/scripts/rag-explainers.ts` (post widgets, sharing helpers in
  `src/scripts/explainer-kit.ts`): `effects.ts` imports them lazily, only on pages that use a widget, so they never load elsewhere. Its styles are `is:global` in `src/components/Explainers.astro`, since Markdown can't use scoped styles.
  Also `src/scripts/mockups.ts` (the "How it works" cards in drawers): `drawer.ts` imports it lazily when a drawer opens;
  styles in `src/styles/mockups.css`.
  The other exception is the tiny inline script in `Base.astro`'s `<head>` that applies the saved theme before paint.
- New dark colors go in both dark blocks of `tokens.css` (the media query and `:root[data-theme="dark"]`).
- Reuse `Section`, `RowList`, `Row` for any list, and `Drawer` for details. Icons come from `src/data/icons.ts`.
- Respect `prefers-reduced-motion`; keep keyboard support (Esc, ←/→, focus return) when touching drawers.
- Every widget is on one dev-only page, http://localhost:4321/dev/widgets/ (`src/pages/dev/[page].astro`, not in the
  production build). Add new widgets to its list. Its palette switcher (`src/data/dev-palettes.ts`) is the one other
  place client JS lives, and only in dev.
- `tests/visual/interactions.spec.ts` covers drawers and effects, and `tests/visual/explainers.spec.ts` pins the widgets'
  numbers to the posts' text; update them with behavior changes.
- Keep one `<h1>` per page.
