// Debug panel, never shown to visitors. Open any page with `?debug` to turn it on (remembered in this
// browser), `?debug=0` or the panel's × to turn it off. Loaded by effects.ts only when debug mode is on.
//
// Logo toggle: an <img data-logo-alt="…"> (a Row or Drawer whose entry sets `logoAlt`, e.g. CMU's red-on-white
// wordmark vs. its red square) swaps to the alternative logo at data-logo-alt-size px, covering the whole tile
// when data-logo-alt-full is set.

const FLAG = "debug";
const LOGO_KEY = "debug-logo-alt"; // "alt" shows the alternative logos

function store(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode: lasts for this page only */
  }
}
function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const param = new URLSearchParams(location.search).get("debug");
if (param === "0" || param === "false") {
  store(FLAG, null);
} else {
  if (param !== null) store(FLAG, "1");
  init();
}

function init() {
  const imgs = [
    ...document.querySelectorAll<HTMLImageElement>("img[data-logo-alt]"),
  ];
  let alt = read(LOGO_KEY) === "alt";

  function applyLogos() {
    for (const img of imgs) {
      const tile = img.parentElement;
      img.dataset.logoDefault ??= img.getAttribute("src") ?? "";
      img.dataset.logoDefaultSize ??= img.getAttribute("width") ?? "";
      img.dataset.logoDefaultFull ??= String(tile?.classList.contains("full"));
      const size = alt ? img.dataset.logoAltSize : img.dataset.logoDefaultSize;
      img.src =
        (alt ? img.dataset.logoAlt : img.dataset.logoDefault) ?? img.src;
      if (size) {
        img.width = Number(size);
        img.height = Number(size);
      }
      tile?.classList.toggle(
        "full",
        alt
          ? img.dataset.logoAltFull === "true"
          : img.dataset.logoDefaultFull === "true",
      );
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    .debug-panel {
      position: fixed;
      left: var(--space-4, 1rem);
      bottom: var(--space-4, 1rem);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: calc(100vw - 2rem);
      padding: 0.375rem 0.5rem 0.375rem 0.75rem;
      border: 1px dashed var(--color-border);
      border-radius: 999px;
      background: var(--color-bg);
      color: var(--color-muted);
      font-size: 0.75rem;
      line-height: 1rem;
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
    }
    .debug-panel button {
      padding: 0.25rem 0.625rem;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      background: var(--color-surface);
      color: var(--color-text);
      font: inherit;
      cursor: pointer;
    }
    .debug-panel .debug-close {
      padding: 0.25rem 0.5rem;
      border-color: transparent;
      background: transparent;
      color: var(--color-muted);
    }
  `;
  document.head.append(style);

  const panel = document.createElement("div");
  panel.className = "debug-panel";
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Debug options");
  panel.innerHTML = `
    <span>Debug</span>
    <button type="button" class="debug-logo" aria-pressed="false"></button>
    <button type="button" class="debug-close" aria-label="Turn debug mode off">×</button>
  `;
  const logoButton = panel.querySelector<HTMLButtonElement>(".debug-logo")!;

  function syncButton() {
    logoButton.textContent = alt ? "CMU logo: red" : "CMU logo: white";
    logoButton.setAttribute("aria-pressed", String(alt));
    logoButton.title = alt
      ? "Switch to the white logo"
      : "Switch to the red logo";
  }

  logoButton.addEventListener("click", () => {
    alt = !alt;
    store(LOGO_KEY, alt ? "alt" : null);
    applyLogos();
    syncButton();
  });
  panel.querySelector(".debug-close")!.addEventListener("click", () => {
    store(FLAG, null);
    alt = false;
    applyLogos();
    panel.remove();
  });

  if (imgs.length === 0) logoButton.hidden = true;
  applyLogos();
  syncButton();
  document.body.append(panel);
}

export {};
