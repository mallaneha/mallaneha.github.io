# Typography, visual design, icons

From the userinterface.wiki agent skill. All CSS. Values belong in `src/styles/tokens.css`.

## Typography

- `type-tabular-nums`: `font-variant-numeric: tabular-nums` where numbers line up or change
  (dates, stats, counters, tables). `oldstyle-nums` in prose if the font has them.
- `type-slashed-zero`: `slashed-zero` in code-like UI.
- `type-text-wrap`: `text-wrap: balance` on headings, `text-wrap: pretty` on body paragraphs.
- `type-underline-offset`: `text-underline-offset: 3px` (or ~0.2em) on links.
- `type-uppercase-tracking`: uppercase labels get `letter-spacing: 0.05em`.
- `type-font-display`: `font-display: swap` on every `@font-face` (tokens.css already does this).
- `type-no-synthesis`: `font-synthesis: none` for display and icon fonts (no fake bold/italic).
- `type-optical-sizing`: `font-optical-sizing: auto` for variable fonts.
- `type-antialiased`: `-webkit-font-smoothing: antialiased` for light-on-dark text on retina.
- `type-keep-calt`: don't turn off contextual alternates.
- `type-hyphens`: `hyphens: auto` only together with justified text, and set `lang`.
- `type-fractions`: `diagonal-fractions` for ½-style fractions.

## Visual design

- `visual-concentric-radius`: nested rounded boxes: inner radius = outer radius − padding.
  A 16px-radius card with 6px padding holds a 10px-radius child.
- `visual-layered-shadows`: shadows built from 3+ layers (tight contact + mid + soft ambient), not one blur.
- `visual-one-light-source`: all shadows share one direction (y offset down, x ≈ 0).
- `visual-neutral-shadow`: tinted neutral shadow color (e.g. `rgb(17 24 39 / 0.08)`), not pure black.
  In dark mode, shadows mostly vanish; use borders or lighter surfaces.
- `visual-shadow-tokens`: a small shadow scale in tokens, not one-off values.
- `visual-spacing-scale`: spacing from a scale (4/8/12/16/24/32/48). Here: `--space-*` tokens only.
- `visual-translucent-borders`: borders as semi-transparent color so they work on any surface.

## Morphing icons

Source: userinterface.wiki/morphing-icons.

- `icon-three-lines`: every icon in a morphing set is exactly 3 SVG lines; icons needing fewer collapse
  the spare lines to a zero-length point at the center with opacity 0. Then any icon can morph to any other.
- `icon-shared-viewbox`: same `viewBox` for the whole set (source uses 14×14), `stroke-linecap="round"`.
- `icon-decorative-hidden`: `aria-hidden="true"` on the SVG; the button carries the accessible name.
- `icon-reduced-motion`: morph is instant under reduced motion.
- Vanilla: transition the line endpoints with CSS on `<line>` via `transform`, or animate the `d` of a
  `<path>` with CSS `d: path(...)` transitions (Chromium) and accept an instant swap elsewhere.
