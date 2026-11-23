// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages user site: served from the domain root, so no `base`.
export default defineConfig({
  site: "https://mallaneha.github.io",
  trailingSlash: "ignore",
  build: { format: "directory" },
  // The desktop app's autoPort sets PORT so parallel worktree dev servers don't collide.
  server: { port: Number(process.env.PORT) || 4321 },
});
