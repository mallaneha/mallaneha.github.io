// Skills tabs on the home page (src/components/Skills.astro). Click or tap a topic to show its tools;
// ←/→, Home and End move between topics (WAI-ARIA tabs pattern, automatic activation). No hover
// switching. All motion is in the component's CSS; this only flips aria-selected and data-active.

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
      document
        .getElementById(t.getAttribute("aria-controls") ?? "")
        ?.toggleAttribute("data-active", on);
    }
  };

  for (const tab of tabs) tab.addEventListener("click", () => select(tab));

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
    tabs[next].focus();
    select(tabs[next]);
  });
}

document.querySelectorAll<HTMLElement>("[data-skills]").forEach(init);

export {};
