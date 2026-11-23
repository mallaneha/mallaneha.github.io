// Bottom-sheet drawers on native <dialog>, modeled on ch.sh (which uses vaul).
// Open from [data-drawer-open], close with ✕, Esc, a backdrop click, or by dragging the header down.
// ←/→ move between drawers. #<id> in the URL opens that drawer on load.

const drawers = [
  ...document.querySelectorAll<HTMLDialogElement>("dialog[data-drawer]"),
];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
// Exit duration comes from the --drawer-out token; the timeout is only a fallback for transitionend.
const outMs = () =>
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--drawer-out"),
  ) || 300;
let current: HTMLDialogElement | null = null;
let opener: HTMLElement | null = null;

function setHash(id: string | null) {
  const url = id ? `#${id}` : location.pathname + location.search;
  history.replaceState(history.state, "", url);
}

function open(d: HTMLDialogElement, animate = true) {
  if (current && current !== d) closeNow(current);
  if (!d.open) d.showModal();
  import("./mockups").then((m) => m.enhance(d)); // "How it works" cards; remove this line to turn them off
  current = d;
  d.querySelector(".body")?.scrollTo(0, 0);
  d.style.transform = "";
  d.classList.remove("is-closing");
  // Keyboard (←/→) and #hash opens are instant. With reduced motion the CSS fades instead of sliding.
  if (!animate) {
    d.classList.add("is-dragging"); // no transition for this frame
    d.classList.add("is-visible");
    requestAnimationFrame(() => d.classList.remove("is-dragging"));
  } else {
    // Let the browser paint the off-screen position first, then slide up.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => d.classList.add("is-visible")),
    );
  }
  setHash(d.id);
}

function closeNow(d: HTMLDialogElement) {
  d.classList.remove("is-visible", "is-closing", "is-dragging");
  d.style.transform = "";
  if (d.open) d.close();
  if (current === d) current = null;
}

function close(d: HTMLDialogElement) {
  if (!d.open || d.classList.contains("is-closing")) return;
  d.classList.remove("is-dragging");
  d.classList.add("is-closing");
  d.classList.remove("is-visible");
  d.style.transform = "";
  setHash(null);
  let fallback = 0;
  const done = (e?: TransitionEvent) => {
    // Reduced motion fades (opacity) instead of sliding (transform).
    const prop = reduceMotion.matches ? "opacity" : "transform";
    if (e && (e.target !== d || e.propertyName !== prop)) return;
    d.removeEventListener("transitionend", done);
    clearTimeout(fallback);
    if (!d.classList.contains("is-closing")) return; // reopened while closing
    closeNow(d);
    opener?.focus({ preventScroll: true });
    opener = null;
  };
  d.addEventListener("transitionend", done);
  fallback = window.setTimeout(done, outMs() + 100);
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const trigger = target.closest<HTMLElement>("[data-drawer-open]");
  if (trigger) {
    const d = document.getElementById(trigger.dataset.drawerOpen ?? "");
    if (d instanceof HTMLDialogElement) {
      opener = trigger;
      open(d);
    }
    return;
  }
  if (target.closest("[data-drawer-close]") && current) close(current);
});

for (const d of drawers) {
  // Esc: animate instead of the instant default.
  d.addEventListener("cancel", (e) => {
    e.preventDefault();
    close(d);
  });
  // A click on the dialog element itself is a click on the backdrop.
  d.addEventListener("click", (e) => {
    if (e.target === d) close(d);
  });
  enableDrag(d);
}

window.addEventListener("keydown", (e) => {
  if (!current || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
  const i = drawers.indexOf(current);
  const step = e.key === "ArrowRight" ? 1 : -1;
  const next = drawers[(i + step + drawers.length) % drawers.length];
  e.preventDefault();
  open(next, false);
});

function enableDrag(d: HTMLDialogElement) {
  const handle = d.querySelector<HTMLElement>("[data-drawer-handle]");
  if (!handle) return;
  const VELOCITY_WINDOW = 100; // ms of recent movement that counts as the release speed
  let startY = 0;
  let dy = 0;
  let dragging = false;
  let pointer = -1;
  let samples: { y: number; t: number }[] = [];

  handle.addEventListener("pointerdown", (e) => {
    // One finger drags; a second touch mid-drag would otherwise reset the start and make the sheet jump.
    if (dragging) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    dragging = true;
    pointer = e.pointerId;
    startY = e.clientY;
    dy = 0;
    samples = [{ y: e.clientY, t: performance.now() }];
    handle.setPointerCapture(e.pointerId);
    d.classList.add("is-dragging");
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointer) return;
    dy = e.clientY - startY;
    const now = performance.now();
    samples.push({ y: e.clientY, t: now });
    while (samples.length > 2 && now - samples[0]!.t > VELOCITY_WINDOW)
      samples.shift();
    // Resist upward drags, follow downward ones.
    const y = dy < 0 ? -Math.sqrt(-dy) * 2 : dy;
    d.style.transform = `translateY(${y}px)`;
  });
  const end = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointer) return;
    dragging = false;
    d.classList.remove("is-dragging");
    // Speed at release, from the last VELOCITY_WINDOW ms only: hold-then-flick still counts as a flick.
    const now = performance.now();
    const last = samples[samples.length - 1]!;
    const first = samples.find((s) => now - s.t <= VELOCITY_WINDOW) ?? last;
    const velocity = (last.y - first.y) / Math.max(1, now - first.t); // px/ms, + is down
    if (dy > d.offsetHeight * 0.25 || (dy > 10 && velocity > 0.11)) {
      close(d);
    } else {
      d.style.transform = "";
    }
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

function openFromHash() {
  const id = location.hash.slice(1);
  const d = id ? document.getElementById(id) : null;
  if (d instanceof HTMLDialogElement && drawers.includes(d)) {
    if (d !== current) open(d, false);
  } else if (current) {
    close(current);
  }
}
openFromHash();
addEventListener("hashchange", openFromHash);

export {};
