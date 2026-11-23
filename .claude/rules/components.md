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
  The one exception is the tiny inline script in `Base.astro`'s `<head>` that applies the saved theme before paint.
- New dark colors go in both dark blocks of `tokens.css` (the media query and `:root[data-theme="dark"]`).
- Reuse `Section`, `RowList`, `Row` for any list, and `Drawer` for details. Icons come from `src/data/icons.ts`.
- Respect `prefers-reduced-motion`; keep keyboard support (Esc, ←/→, focus return) when touching drawers.
- `tests/visual/interactions.spec.ts` covers drawers and effects; update it with behavior changes.
- Keep one `<h1>` per page.
