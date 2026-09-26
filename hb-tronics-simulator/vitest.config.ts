import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Default node env for headless engine/data tests; component tests opt into
    // jsdom per-file via `// @vitest-environment jsdom`.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@sim/core": r("./packages/sim-core/index.ts"),
      "@sim/oscilloscope": r("./packages/sim-oscilloscope/index.ts"),
      "@sim/multimeter": r("./packages/sim-multimeter/index.ts"),
      "@sim/scanner": r("./packages/sim-scanner/index.ts"),
      "@sim/location": r("./packages/sim-location/index.ts"),
      "@sim/schematic": r("./packages/sim-schematic/index.ts"),
      "@": r("./"),
    },
  },
});
