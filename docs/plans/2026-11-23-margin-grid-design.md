# Margin grid: design

Status: approved 2026-11-23, not built yet.

## Goal

Fill the empty left and right margins on larger screens with a quiet, slowly drifting texture: a grayscale,
minimal take on [oddgrid](https://oddgrid.vercel.app/). A square grid where a noise field lights up irregular
islands of cells in a few faint grays, some with a small dot. It should feel like an engineer's notebook margin,
never compete with the text, and make the site recognizable.

Rejected earlier: a "redacted intro" reveal in the header (felt gimmicky).

## What the visitor sees

- A fixed layer behind every page, from 1024px wide up. Nothing on phones or tablets under 1024px (at 768px
  the margins are about 110px, too thin).
- It draws only in the margins. The 34rem text column plus a 2rem band on each side stays clear; islands thin
  out toward that band instead of ending at a hard edge.
- 10px square cells with a 1px gap. About 15–20% of the margin area lit at a time, in irregular islands with
  lots of empty space.
- Lit cells take one of 3 faint grays by noise value (darker cores, lighter edges). About 1 in 6 core cells has a
  small darker dot.
  - Light: about `#f0f0f0` to `#dcdcdc` on white, dots about `#c4c4c4`.
  - Dark: about `#1a1a1a` to `#2a2a2a` on `#111`, dots about `#3a3a3a`.
- Slow drift: an island visibly reshapes over 10–20 seconds. Redrawn about 10 times a second, so cells step on
  and off like the oddgrid recording, no smooth fades.
- A new random seed on every page load.
- Still (one frame) with `prefers-reduced-motion`. Paused while the tab is hidden. Redraws once after a resize.
- Content and drawers sit above it; the drawer backdrop dims it like everything else.

## How it's built

- **Module.** New `src/scripts/margin-grid.ts`, imported lazily by `src/scripts/effects.ts` only when
  `matchMedia("(min-width: 64rem)")` matches (and later, if the window grows past it). Same pattern as the
  explainer widgets. Add it to the allowed client scripts in `.claude/rules/components.md` and `AGENTS.md`.
- **Canvas.** One `<canvas aria-hidden="true">` appended to `<body>`, styled in `src/styles/global.css`:
  `position: fixed; inset: 0; z-index: -1; pointer-events: none`, hidden in print. Sized to the window ×
  `devicePixelRatio`, cells snapped to device pixels. `html` has no background, so the body's background paints
  the canvas root and the canvas sits above it and below all content.
- **Clear zone.** `--measure` + 2rem per side, centered. Recomputed on resize. Near the zone the lit threshold
  rises so islands fade out.
- **Noise.** About 40 lines, no dependency: a seeded PRNG (`mulberry32`) fills a lattice; 3D value noise over
  (x, y, time) with smoothstep interpolation and 2 octaves. Threshold → lit; two higher thresholds → shades 2
  and 3. Dots from a per-cell hash (stable per cell, so they don't flicker).
- **Loop.** A ~100ms timer. Each tick clears the canvas, walks only the margin cells (about 14k at 1920×1080)
  and `fillRect`s lit cells grouped by color (4 fill-style changes per frame). Budget: under 3ms per tick,
  measured in Chrome; lower the frame rate or octaves if it's over. Stops on `visibilitychange` to hidden, below
  1024px, or after one frame with reduced motion. Resize is debounced 150ms.
- **Colors.** New tokens `--grid-1`, `--grid-2`, `--grid-3`, `--grid-dot` in `src/styles/tokens.css`, with dark
  values in both dark blocks. Read with `getComputedStyle`, re-read when `data-theme` or the system scheme
  changes.
- **Pinning (if needed).** `?seed=<n>` fixes the pattern for screenshots.

## Edge cases

- Nothing on the site is wider than the 34rem column today; drawers (44rem) are overlays. A future wide figure
  needs the clear zone widened. Note this in `docs/DESIGN.md`.
- A fixed canvas can't cause sideways scroll.
- The click-spark canvas (`z-index: 9999`) is unaffected.

## Testing

New `tests/visual/margin-grid.spec.ts`:

1. At 1280 and 1920px: the canvas exists, is `aria-hidden`, has `pointer-events: none`; pixels inside the column
   rectangle are blank and some margin pixels aren't.
2. At 375 and 768px: no canvas, module not loaded.
3. Reduced motion: two snapshots 500ms apart are identical; without it they differ.
4. Hidden tab: ticking stops.

Then `npm run check`, `npm run test:visual`, and `/check-responsive` at 1280 and 1920px in light and dark mode,
plus a look at the motion in a browser.

## Files

New `src/scripts/margin-grid.ts` and `tests/visual/margin-grid.spec.ts`. Changed: `src/scripts/effects.ts`,
`src/styles/tokens.css`, `src/styles/global.css`, `docs/DESIGN.md`, `AGENTS.md`, `.claude/rules/components.md`.
