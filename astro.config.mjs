// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "./src/integrations/svelte-static/index.js";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://fursuit.catme0w.org",
  integrations: [sitemap(), svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: "file",
  },
});
