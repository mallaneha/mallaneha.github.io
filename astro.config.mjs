// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages user site: served from the domain root, so no `base`.
export default defineConfig({
  site: "https://nehamalla.com",
  trailingSlash: "ignore",
  build: { format: "directory" },
  // Prefetch same-origin pages when a link is hovered or focused, so the next page is
  // usually cached by the time it's clicked. External links are never prefetched.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  // The desktop app's autoPort sets PORT so parallel worktree dev servers don't collide.
  server: { port: Number(process.env.PORT) || 4321 },
});
