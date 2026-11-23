// Dev-only Astro toolbar app (registered in astro.config.mjs, never shipped): previews where
// the header cat sits on the home page. "name" is the built layout (cat right after the name,
// its ledge on the name's baseline); "shelf" moves it onto its own shelf at the right, with
// the icons hanging under it. The choice is kept in localStorage so it survives reloads.
import { defineToolbarApp } from "astro/toolbar";

type Pos = "shelf" | "name";
const KEY = "debug-cat-position";
const LABELS: Record<Pos, string> = {
  name: "Next to the name (default)",
  shelf: "On its shelf (right)",
};

function saved(): Pos {
  try {
    return localStorage.getItem(KEY) === "shelf" ? "shelf" : "name";
  } catch {
    return "name";
  }
}

function apply(pos: Pos) {
  try {
    localStorage.setItem(KEY, pos);
  } catch {}
  const cat = document.querySelector("header-cat");
  const h1 = document.querySelector(".top h1");
  const perch = document.querySelector(".top .perch");
  if (!cat || !h1 || !perch) return;
  document.documentElement.dataset.catPos = pos;
  if (pos === "name") h1.append(cat);
  else perch.prepend(cat);
}

export default defineToolbarApp({
  init(canvas, app) {
    let pos = saved();
    if (pos !== "name") apply(pos);

    const win = document.createElement("astro-dev-toolbar-window");
    const title = document.createElement("p");
    title.textContent = "Header cat position";
    title.style.cssText = "margin:0 0 8px;font-weight:600";
    win.append(title);

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
    const buttons = (Object.keys(LABELS) as Pos[]).map((p) => {
      const b = document.createElement("astro-dev-toolbar-button");
      b.size = "small";
      b.textContent = LABELS[p];
      b.addEventListener("click", () => {
        pos = p;
        apply(p);
        paint();
      });
      row.append(b);
      return [p, b] as const;
    });
    const paint = () => {
      for (const [p, b] of buttons)
        b.buttonStyle = p === pos ? "purple" : "gray";
    };
    paint();
    win.append(row);

    const note = document.createElement("p");
    note.textContent = document.querySelector("header-cat")
      ? "Phones hide the cat in both."
      : "No header cat on this page (home page only).";
    note.style.cssText = "margin:8px 0 0;opacity:.7;font-size:12px";
    win.append(note);

    canvas.append(win);
    app.onToggled(({ state }) => {
      win.style.display = state ? "block" : "none";
    });
  },
});
