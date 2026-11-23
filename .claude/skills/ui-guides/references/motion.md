# Motion: timing, easing, springs, principles

Sources: userinterface.wiki/12-principles-of-animation, /to-spring-or-not-to-spring.

## Pick the role first

Ask: **is this motion reacting to the user, or is the system speaking?**

| Role        | Use for                                                                | CSS                                       |
| ----------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| None        | typing, keyboard nav, fast toggles, anything fired many times a minute | no transition                             |
| Spring-like | drag, flick, press, gestures; must survive interruption                | CSS `linear()` spring curve, or JS spring |
| Ease-out    | entrances, feedback (arrives fast, settles)                            | `cubic-bezier(0.215, 0.61, 0.355, 1)`     |
| Ease-in     | exits (builds speed, leaves)                                           | `cubic-bezier(0.55, 0.055, 0.675, 0.19)`  |
| Ease-in-out | moving between two equally important states (views, modes)             | `cubic-bezier(0.455, 0.03, 0.515, 0.955)` |
| Linear      | only when motion represents time: progress, loaders, hold-to-confirm   | `linear`                                  |

- `easing-entrance-ease-out`: ease-in on an entrance reads as lag. Flag it.
- `easing-no-overuse-in-out`: ease-in-out everywhere feels "sluggish and overly polite".
- `easing-linear-only-time`: linear on a non-progress movement looks mechanical. Easing on a progress
  bar breaks the time ↔ progress mapping.
- `none-is-valid`: no motion is a design decision, not a gap.
- Apple context menus animate only on exit, never entry: frequently-seen entrances compound into irritation.

## Durations

- `duration-press-hover`: presses and hovers 120–180 ms (150 ms is a good default; repo token `--transition`).
- `duration-small-state`: small state changes 180–260 ms.
- `duration-large`: larger transitions up to ~300 ms. Beyond that motion reads as deliberate, not reactive.
- `duration-shorten-first`: if it feels slow, shorten the duration before changing the curve.
- Tooltip at 150 ms feels responsive; the same tooltip at 400 ms feels broken.

## Reading a cubic-bezier

`cubic-bezier(x1, y1, x2, y2)`:

- first pair = start. Higher values start moving almost immediately (good for presses and hovers);
  low values add hesitation.
- second pair = landing. Higher = longer, calmer landing; lower = sharp, tense stop. If the end feels
  wrong, tune this pair first.
- Strong ease-out used across the source: `cubic-bezier(0.19, 1, 0.22, 1)` (expo-out).

## Springs

- `spring-for-gestures`: springs for anything attached to the user's finger/pointer; they keep
  velocity and survive interruption because they have no fixed end time. Easing has fixed start and end.
- `spring-not-for-announcements`: springs announcing a state change feel restless.
- `spring-no-bounce-default`: moderate params (source example: stiffness 500, damping 30). Avoid
  bouncy ones (stiffness 1000, damping 5). Stiffness = how fast it starts, damping = settle vs oscillate,
  mass = heaviness.
- Vanilla options here (no Motion library): a CSS `linear()` easing generated from a spring
  (e.g. via a spring-to-linear generator, pasted as a token), or a ~20-line rAF spring integrator in TS.
  A CSS spring curve still has a fixed duration, so it does not survive interruption; use the JS
  integrator for drag.

## Principles as checks

- `staging-one-focus`: don't animate everything at once. Sequence so attention lands on the important
  thing (dim the backdrop when a sheet opens).
- `staging-stagger-small`: stagger ≤ 50 ms per item (30 ms typical), only for non-critical items,
  cap the total (≈ 300 ms). Too much stagger makes the UI feel slow.
- `physics-press-scale`: `:active { transform: scale(0.98) }` for buttons and pressable rows.
  Squash/stretch stays within 0.95–1.05; more looks like a cartoon.
- `staging-anticipation-rare`: wind-ups (badge wiggle, button compress before send) only on moments
  that matter. On every micro-interaction they make the app feel sluggish.
- `staging-arcs-subtle`: straight lines are fine for utilitarian UI; arcs for hero moments.
- `staging-secondary-action`: small flourishes after the main action (a checkmark pops, a soft click),
  never instead of it.
- `staging-exaggeration-scarce`: onboarding, empty states, confirmations, errors only.
- `physics-3d-perspective`: 3D transforms need `perspective` on the parent.

## Pattern

```css
.thing {
  transition:
    transform var(--transition),
    opacity var(--transition);
}
.thing:active {
  transform: scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .thing {
    transition: opacity var(--transition);
  }
  .thing:active {
    transform: none;
  }
}
```
