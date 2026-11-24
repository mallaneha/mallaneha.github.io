// Skills section tabs (src/components/Skills.astro). A topic becomes active on mouse hover, tap/click,
// or keyboard focus (←/→, Home, End move between tiles, as in the WAI-ARIA tabs pattern with automatic
// activation). The last active topic stays when the mouse leaves. All motion is in the component's CSS.

function init(root: HTMLElement) {
  const tabs = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  );
  if (!tabs.length) return;

  const select = (tab: HTMLButtonElement) => {
    if (tab.getAttribute("aria-selected") === "true") return;
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(
        t.getAttribute("aria-controls") ?? "",
      );
      panel?.toggleAttribute("data-active", on);
    }
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("focus", () => select(tab));
    tab.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") select(tab);
    });
  }

  root.querySelector('[role="tablist"]')?.addEventListener("keydown", (e) => {
    const ev = e as KeyboardEvent;
    const current = tabs.findIndex((t) => t === document.activeElement);
    if (current < 0) return;
    let next = -1;
    if (ev.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (ev.key === "ArrowLeft")
      next = (current - 1 + tabs.length) % tabs.length;
    else if (ev.key === "Home") next = 0;
    else if (ev.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    ev.preventDefault();
    tabs[next].focus(); // focus selects it
  });
}

document.querySelectorAll<HTMLElement>("[data-skills]").forEach(init);

export {};
