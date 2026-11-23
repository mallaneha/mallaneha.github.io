# Enter, exit and size changes

Sources: userinterface.wiki/mastering-animate-presence, /animating-container-bounds. The source uses
Motion's `AnimatePresence`; below are the vanilla equivalents of each idea.

## Enter / exit

- `exit-has-exit`: anything that animates in must animate out (or vanish on purpose). A removal with
  no exit is a jump. Exits are usually shorter than entrances (repo: `--drawer-in` 500 ms, `--drawer-out` 300 ms).
- `exit-entry-css`: simple entrances need no JS: `@starting-style` + `transition`.

  ```css
  .toast {
    transition:
      opacity 180ms cubic-bezier(0.215, 0.61, 0.355, 1),
      transform 180ms cubic-bezier(0.215, 0.61, 0.355, 1),
      display 180ms allow-discrete;
  }
  @starting-style {
    .toast {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  .toast[hidden] {
    display: none;
    opacity: 0;
    transform: translateY(4px);
  }
  ```

  For `<dialog>`/popover add `overlay 180ms allow-discrete` and style `:not([open])`.

- `exit-wait-before-remove` (usePresence/safeToRemove): when removing a node with JS, set the exit
  state, wait for `transitionend`/`animationend` (with a timeout fallback for reduced motion) and only
  then remove it. Async cleanup (save, network) runs in parallel; remove when both are done.
- `exit-disable-while-leaving` (useIsPresent): an element that is leaving gets `inert` (or
  `pointer-events: none`) so it can't be clicked twice.
- `exit-unique-key`: when items are added/removed from a list, identify them by a stable id, not index.
- `exit-mode-wait`: if old must leave before new enters, each half gets about half the duration
  (0.3 s → 0.15 s each) so the total stays the same.
- `exit-mode-sync`: crossfade only when the layout can hold both at once (stack them in one grid cell).
- `exit-mode-pop-layout`: a leaving item that shouldn't hold space: take it out of flow
  (`position: absolute` at its current box) at exit start so siblings reflow immediately.
- `exit-nested` (propagate): when a parent exits, decide whether children animate out too. In CSS,
  give children their own exit rule keyed off the parent's state (`.sheet[data-state="closing"] .item`).
- Recipe used throughout the source: enter from `opacity: 0; scale: 0.95; filter: blur(8px)` with
  `cubic-bezier(0.19, 1, 0.22, 1)` ~400 ms; exit to the same. Blur is optional polish; drop it under
  reduced motion.

## Container bounds (animating to "auto" size)

- `container-no-snap`: a container whose content changes (button label → "Sending…", accordion,
  details panel) should resize smoothly, not snap.
- `container-native-first`: try CSS first. `interpolate-size: allow-keywords` on `:root` lets
  `height`/`width` transition to `auto` in supporting browsers (falls back to an instant snap, which is
  acceptable). For `<details>`, use `::details-content` with `block-size` transition.
- `container-two-element`: if JS is needed, use two elements: an outer one you animate, an inner one you
  measure. Never measure and animate the same element (resize → measure → animate loop).
- `container-resize-observer`: measure with `ResizeObserver` (`entry.contentRect`), not
  `getBoundingClientRect` on every frame. Disconnect it when the component goes away.
- `container-guard-zero`: the first measurement can be 0; use `auto` until a real size exists, or it
  animates from 0 on load.
- `container-overflow-hidden`: the animated outer element needs `overflow: hidden`.
- `container-small-delay`: a ~50 ms delay on the size change lets the container follow the content.
  Source timing: `duration 0.4s, cubic-bezier(0.19, 1, 0.22, 1), delay 0.05s`.
- `container-sparingly`: subtle effect; buttons, accordions, small interactive pieces only.

```ts
const outer = el.querySelector<HTMLElement>(".bounds")!;
const inner = outer.firstElementChild as HTMLElement;
new ResizeObserver(([e]) => {
  const h = e.contentRect.height;
  if (h > 0) outer.style.height = `${h}px`;
}).observe(inner);
// CSS: .bounds { overflow: hidden; transition: height 400ms cubic-bezier(0.19,1,0.22,1) 50ms; }
```
