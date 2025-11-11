import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false, // Disable DTS for now due to workspace package resolution issues
  sourcemap: true,
  clean: true,
  target: "node22"
});

