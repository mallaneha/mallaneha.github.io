---
name: ui-guides
description: Evaluate or build UI components against the userinterface.wiki guides (motion timing, easing vs springs, exit animations, container bounds, pseudo-elements, view transitions, sound feedback, Laws of UX, typography, visual design). Use when reviewing a component, CSS or client script for interaction quality, or when creating a new component, effect or animation. Outputs file:line findings with rule ids.
---

UI guides task: $ARGUMENTS

Rules distilled from https://www.userinterface.wiki (Raphael Salaja, MIT license) and its agent skill,
translated to this repo's stack: Astro components, plain CSS with tokens in `src/styles/tokens.css`,
vanilla TS in `src/scripts/`. The source uses React + Motion; here every rule has a CSS/vanilla equivalent.
**Don't add Motion, React or any npm dependency** (AGENTS.md rule) to follow a guide.

## Reference files (read only the ones that apply)

| File                        | Covers                                                                 | Rule prefixes                                    |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| `references/motion.md`      | 12 principles, durations, easing vs spring vs linear vs none, stagger  | `timing-` `easing-` `spring-` `none-` `staging-` |
| `references/enter-exit.md`  | Enter/exit, `@starting-style`, exit-only, container bounds (auto size) | `exit-` `container-`                             |
| `references/css-native.md`  | Pseudo-elements, hit areas, View Transitions, `::backdrop`, `::marker` | `pseudo-` `transition-` `native-`                |
| `references/sound.md`       | When to play sound, Web Audio synthesis parameters, mute/a11y          | `a11y-` `appropriate-` `impl-` `synth-`          |
| `references/ux-laws.md`     | Fitts, Hick, Miller, Doherty, Postel, gestalt laws                     | `ux-`                                            |
| `references/type-visual.md` | Typography features, radius, shadows, spacing, borders, morphing icons | `type-` `visual-` `icon-`                        |

Priority when rules conflict: accessibility (AGENTS.md: contrast ≥ 4.5:1, visible focus, 375px, reduced
motion) > this repo's `docs/DESIGN.md` and tokens > these guides. A guide is never a reason to break
the "every list entry is a `Row`, details in a drawer" rule.

## Mode 1: evaluate (review existing UI)

1. Work out the target: a file, a component name, a page, or the current diff (`git diff main...HEAD`).
   Read the `.astro` file plus the CSS and scripts it uses (`src/styles/*.css`, `src/scripts/*.ts`).
2. Classify what it does: moves? enters/exits? changes size? makes sound? takes input? shows numbers?
   Load only the matching reference files.
3. Check each applicable rule. Quote the actual value (`transition: all 400ms ease-in`), not a paraphrase.
   Also check the universal list below.
4. Report findings, most severe first, one per line:
   `src/components/Drawer.astro:42 - [easing-entrance-ease-out] Sheet enters with ease-in (reads as lag). Use var(--ease-drawer) or an ease-out curve.`
   Severity: **critical** (breaks a11y, reduced motion, or feels broken: > 400 ms response, sound with no
   visual), **high** (wrong curve/duration, missing exit, layout jump), **medium** (polish), **low** (nit).
5. End with a table: severity × count, and the rules that passed (so the reader knows what was checked).
6. Don't edit files in evaluate mode unless asked. If asked to fix, follow the CLAUDE.md worktree flow.

## Mode 2: create (build a new component or effect)

1. Before writing code, answer in 3–5 lines: what triggers the motion (user or system?), how often it
   fires (high-frequency → no motion), which role applies (none / spring-like / ease-out / ease-in /
   ease-in-out / linear), the duration band, and whether it needs sound (usually no).
2. Use tokens. Add a new timing or easing to `src/styles/tokens.css` only if no existing one fits
   (`--transition` 150ms, `--ease-drawer`, `--drawer-in` 500ms, `--drawer-out` 300ms).
3. Build it with the patterns in the reference files: CSS first, then vanilla TS. Prefer
   pseudo-elements over decorative DOM, `@starting-style`/View Transitions over hand-rolled JS.
4. Run Mode 1 on what you wrote and fix every critical/high finding.
5. Then the repo's normal verification: `npm run check`, `npm run test:visual`, and `/check-responsive`
   (375, 768, 1280 px, light and dark).

## Universal checks (every component)

- `none-reduced-motion`: every `transition`/`animation`/JS animation is off or reduced under
  `prefers-reduced-motion: reduce` (CSS media query, or `matchMedia(...)` as in `src/scripts/drawer.ts`).
  Fades may stay; movement, scale and blur go.
- `timing-under-300`: user-initiated motion ≤ 300 ms. Longer needs a stated reason (large sheets, as
  in the drawer's 500 ms entrance).
- `timing-consistent`: the same kind of element uses the same duration everywhere (use the token).
- `none-high-frequency`: no animation on typing, keyboard navigation, fast toggles. Focus uses
  `:focus-visible` only, no transition.
- `transition-specific-props`: never `transition: all`; list the properties. Animate only `transform`
  and `opacity` (and `filter` sparingly). Never animate `width`/`height`/`top`/`left` directly.
- `ux-hit-area`: interactive targets ≥ 32px (44px preferred on touch); grow small ones with a
  `::before` hit area rather than visible padding.
- `ux-doherty`: feedback within 100 ms of input; anything > 400 ms shows progress or responds optimistically.
- `a11y-visual-equivalent`: every sound or vibration has a visible equivalent.
