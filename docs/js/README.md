# ASON Documentation JavaScript Files

## File Structure

- **`ason.js`** - Auto-generated from `nodejs-compressor/dist/index.js` (DO NOT EDIT)
- **`app.js`** - Main application logic for the web demo
- **`benchmarks.js`** - Benchmark runner for the web interface

## Build Process

The `ason.js` file is automatically generated when you run:

```bash
cd nodejs-compressor
npm run build
```

This command:
1. Runs `tsup` to build the TypeScript source
2. Copies `dist/index.js` → `../docs/js/ason.js`

**Important:** Never edit `ason.js` directly. All changes should be made in `nodejs-compressor/src/` and then rebuilt.

## Why This Approach?

Using the built distribution file ensures:
- ✅ Docs always use the same code as the published package
- ✅ No code duplication or drift
- ✅ Proper minification and optimization
- ✅ Single source of truth
