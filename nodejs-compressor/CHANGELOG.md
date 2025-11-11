# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2024-11-11

### Fixed
- **TypeScript Declarations**: Fixed TypeScript declaration files to only expose public API
  - Reduced `.d.ts` file size from ~1434 lines to 191 lines (87% reduction)
  - Removed internal/private methods from public type definitions
  - Private methods (prefixed with `_`) are no longer visible in TypeScript autocomplete
  - Added proper TypeScript interfaces: `SmartCompressorOptions` and `TokenComparisonStats`
  - Improved IDE experience for TypeScript users

### Changed
- Modified `tsup.config.js` to use custom TypeScript declarations instead of auto-generation
- Added custom `src/index.d.ts` with clean, public-only API definitions

## [1.1.1] - 2025-11-11

### Changed
- **Documentation Improvements** - Enhanced README visual presentation
  - Updated npm version badge to use shields.io style (`img.shields.io`) for consistency
  - Added overview image (`preview.png`) to nodejs-compressor README
  - Improved visual consistency across all documentation files

## [1.1.0] - 2025-01-11

### Changed
- **Package Rename** - Migrated from `@ason-format/ason`
  - Updated package name to reflect organization scope
  - Updated all documentation and examples with new package name
  - Updated repository URLs to `https://github.com/ason-format/ason`

- **Token Estimation** - Removed external dependency for browser compatibility
  - Removed `gpt-tokenizer` dependency from package
  - Implemented lightweight approximation: `Math.ceil(text.length / 4)`
  - Reduced package size and improved browser compatibility
  - Updated all documentation to reflect token approximation method

- **Documentation Improvements**
  - Fixed indentation documentation (valid values: 1, 2, or 4 spaces - not 0)
  - Updated all code examples to use `indent: 1` instead of `indent: 0`
  - Corrected performance metrics throughout docs (up to 23% vs previous claims)
  - Improved clarity in all README files

- **Benchmarks Page Redesign**
  - Redesigned `/docs/benchmarks.html` with Vercel/GitHub-style color palette
  - Changed from bright colors to subtle emerald-600/rose-600 scheme
  - Added clean table layout showing Dataset | JSON | ASON | Toon | Winner | Comparisons
  - Improved readability with `font-mono` for numbers and better visual hierarchy
  - Added proper badges and SVG icons for key findings

### Added
- **Automated Documentation Build** - `npm run build` now auto-generates docs
  - Added `build:docs` script that copies `dist/index.js` to `docs/js/ason.js`
  - Eliminated code duplication between source and documentation
  - Ensures docs always use latest built version

### Fixed
- **CI/CD Pipeline** - GitHub Actions now properly build before testing
  - Added `npm run build` step in `test.yml` workflow
  - Added `npm run build` step in `npm-publish.yml` workflow
  - Prevents test failures due to missing dist files

- **Browser Compatibility** - Fixed web visualizer errors
  - Removed Node.js-specific dependencies from browser builds
  - Fixed "Cannot read properties of undefined" errors
  - Fixed "Failed to resolve module specifier" errors in console

## [1.0.0] - 2025-01-10

### Added
- **Initial Release** - ASON (Aliased Serialization Object Notation)
  - Complete Node.js implementation with SmartCompressor
  - Automatic pattern detection (zero configuration required)
  - Object references for repeated structures (`&obj0`, `&obj1`, etc.)
  - Inline-first value dictionary optimized for LLM readability (`#0`, `#1`, etc.)
  - Uniform array compression with `@keys` notation
  - Path flattening for nested single-property objects
  - Configurable indentation (1, 2, or 4 spaces)
  - Lossless compression with perfect round-trip fidelity

- **CLI Tool** - Command-line interface for JSON ↔ ASON conversion
  - Auto-detection of format from file extension or content
  - `--stats` flag for visual token count comparison with ASCII table
  - `--delimiter` option for comma/tab/pipe separators
  - Stdin/stdout support for piping workflows (e.g., `cat data.json | npx ason`)
  - Comprehensive help documentation with `-h/--help`
  - Support for `--no-references` and `--no-dictionary` flags

- **TypeScript Support** - Full type definitions included
  - `.d.ts` files for ESM (48.2 KB)
  - `.d.cts` files for CommonJS (48.2 KB)
  - Full IntelliSense and autocomplete support in VSCode and other IDEs
  - Proper type exports for both `import` and `require`

- **Build System** - Integrated tsup for optimized bundling
  - Minified ESM build (14.5 KB) - 70% smaller than source
  - Minified CJS build (14.5 KB) for Node.js legacy compatibility
  - Tree-shaking enabled for smaller bundle sizes
  - Dual package exports for seamless ESM/CJS interop

- **Testing & Quality**
  - Complete test suite with Jest
  - 33 passing tests across 3 test suites
  - Full coverage of compression/decompression cycles

- **Documentation & Community**
  - Interactive web visualizer with compress/decompress modes at `/docs/index.html`
  - Complete API documentation at `/docs/docs.html`
  - Interactive benchmarks at `/docs/benchmarks.html`
  - Premium README with head-to-head ASON vs Toon comparison
  - ASCII bar charts for visual benchmark comparison
  - Complete API reference with TypeScript examples
  - CLI usage guide with real-world examples
  - Professional badges (npm, TypeScript, License, Node.js)
  - Detailed table of contents with deep anchor links
  - "When to use" guide comparing ASON, Toon, JSON, and CSV
  - Examples in `/nodejs-compressor/examples/`
  - Community files: CODE_OF_CONDUCT, CONTRIBUTING, SECURITY
  - MIT License

### Performance
- **Up to 23.45% token reduction** on uniform arrays (Analytics dataset)
- **+4.94% average reduction** across 5 real-world datasets vs JSON
- Toon shows **-6.75% average** (uses MORE tokens than JSON on average)
- **ASON wins 3 out of 5** datasets vs JSON
- **Always performs better than Toon** - Even when ASON loses to JSON, it loses less than Toon
- Processes ~35ms for compression + decompression cycle
- Memory efficient: ~10MB for large datasets
- CLI `--stats` flag provides instant compression metrics

### Package Distribution
- Tarball size: 37.8 KB (includes types, CLI, and docs)
- Unpacked size: 148 KB
- Only 7 files published (optimized for production)
- Package ships with built/minified code instead of source files
- `package.json` configured with proper `exports` field for ESM/CJS resolution
- Updated `files` field to include only dist/, src/cli.js, and README.md
- Repository URL format corrected to use `git+` prefix (eliminates npm publish warning)

[1.1.2]: https://github.com/ason-format/ason/releases/tag/v1.1.2
[1.1.1]: https://github.com/ason-format/ason/releases/tag/v1.1.1
[1.1.0]: https://github.com/ason-format/ason/releases/tag/v1.1.0
[1.0.0]: https://github.com/ason-format/ason/releases/tag/v1.0.0
