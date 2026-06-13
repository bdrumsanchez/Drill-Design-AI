import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  test: {
    // Exclude vendored openmarch-core tests — they need deps (uuid,
    // svg-path-commander, fast-check) that are intentionally not installed.
    exclude: ["src/lib/openmarch-core/**"],
  },
});
