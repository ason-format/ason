import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.js"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  treeshake: true,
  outDir: "dist",
  external: ["gpt-tokenizer", "@toon-format/toon"],
});
