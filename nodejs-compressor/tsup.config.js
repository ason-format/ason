import { defineConfig } from "tsup";
import { copyFileSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: ["src/index.js"],
  format: ["esm", "cjs"],
  dts: false, // Disable auto-generation, we use custom .d.ts
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  treeshake: true,
  outDir: "dist",
  external: ["gpt-tokenizer", "@toon-format/toon"],
  async onSuccess() {
    // Copy custom TypeScript declarations to dist
    copyFileSync(
      join(process.cwd(), "src/index.d.ts"),
      join(process.cwd(), "dist/index.d.ts")
    );
    copyFileSync(
      join(process.cwd(), "src/index.d.ts"),
      join(process.cwd(), "dist/index.d.cts")
    );
    console.log("✓ TypeScript declarations copied");
  },
});
