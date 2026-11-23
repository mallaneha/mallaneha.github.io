// Bottom-sheet drawers on native <dialog>, modeled on ch.sh (which uses vaul).
// Open from [data-drawer-open], close with ✕, Esc, a backdrop click, or by dragging the header down.
// ←/→ move between drawers. #<id> in the URL opens that drawer on load.

const drawers = [
  ...document.querySelectorAll<HTMLDialogElement>("dialog[data-drawer]"),
];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const OUT_MS = 300;
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
  if (!animate || reduceMotion.matches) {
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
  const done = () => {
    closeNow(d);
    opener?.focus({ preventScroll: true });
    opener = null;
  };
  if (reduceMotion.matches) done();
  else setTimeout(done, OUT_MS);
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
  let startY = 0;
  let startT = 0;
  let dy = 0;
  let dragging = false;

  handle.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    dragging = true;
    startY = e.clientY;
    startT = performance.now();
    dy = 0;
    handle.setPointerCapture(e.pointerId);
    d.classList.add("is-dragging");
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dy = e.clientY - startY;
    // Resist upward drags, follow downward ones.
    const y = dy < 0 ? -Math.sqrt(-dy) * 2 : dy;
    d.style.transform = `translateY(${y}px)`;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    d.classList.remove("is-dragging");
    const velocity = dy / Math.max(1, performance.now() - startT); // px/ms
    if (dy > d.offsetHeight * 0.25 || (dy > 10 && velocity > 0.4)) {
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
