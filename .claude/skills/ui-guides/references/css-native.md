# Pseudo-elements and native browser features

Source: userinterface.wiki/taking-advantage-of-pseudo-elements, plus the site's agent skill.

## Pseudo-elements

- `pseudo-content-required`: `::before`/`::after` render only with `content` (use `content: ""`).
- `pseudo-over-dom`: decoration, separators, hover fills and icons go in pseudo-elements, not extra
  `<span>`s.
- `pseudo-parent-relative`: the parent of an absolutely positioned pseudo needs `position: relative`.
- `pseudo-z-index`: a decorative pseudo behind content: pseudo `z-index: -1`, parent `z-index: 1`
  (or `isolation: isolate` on the parent).
- `pseudo-hit-area`: grow a small target invisibly: `::before { content: ""; position: absolute; inset: -8px -12px; }`.
  Check it doesn't overlap a neighbouring target.
- `pseudo-hover-fill`: hover backgrounds as a pseudo that scales in:

  ```css
  .row {
    position: relative;
    isolation: isolate;
  }
  .row::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--radius-row);
    background: var(--color-hover);
    opacity: 0;
    transform: scale(0.95);
    transition:
      opacity var(--transition),
      transform var(--transition);
  }
  .row:hover::before {
    opacity: 1;
    transform: scale(1);
  }
  ```

- `visual-animate-shadow-via-pseudo`: to animate a shadow, put it on a pseudo and fade its opacity;
  transitioning `box-shadow` itself repaints every frame.

## Native over custom

- `native-backdrop`: `dialog::backdrop` instead of an overlay `<div>`.
- `native-placeholder`: style `input::placeholder`, don't fake placeholders.
- `native-selection`: brand `::selection` (keep contrast ≥ 4.5:1).
- `native-marker`: `li::marker` for bullets, not background images.
- `native-first-line`: `::first-line` for lead-in styling.

## View Transitions (shared-element morphs)

- `transition-native-over-js`: prefer `document.startViewTransition()` to JS animation libraries
  when a few lines of CSS do it. Feature-detect and just apply the change when unsupported.
- `transition-name-handoff`: give the source `view-transition-name`, then inside the callback clear it
  on the source and set it on the target. Reverse the handoff to go back.
- `transition-unique-names`: names must be unique on the page at once, e.g. `card-${id}`.
- `transition-hide-source`: hide the source with `visibility: hidden` (not `display: none`) to avoid
  layout shift.
- `transition-timing`:

  ```css
  ::view-transition-group(card) {
    animation-duration: 300ms;
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation: none;
    }
  }
  ```

```ts
function morph(source: HTMLElement, target: HTMLElement, update: () => void) {
  if (!document.startViewTransition) return update();
  source.style.viewTransitionName = "card";
  document.startViewTransition(() => {
    source.style.viewTransitionName = "";
    update();
    target.style.viewTransitionName = "card";
  });
}
```
