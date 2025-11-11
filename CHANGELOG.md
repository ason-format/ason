# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-10

### Added
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

### Changed
- Package now ships with built/minified code instead of source files
- `package.json` configured with proper `exports` field for ESM/CJS resolution
- Updated `files` field to include only dist/, src/cli.js, and README.md
- Repository URL format corrected to use `git+` prefix (eliminates npm publish warning)

### Improved
- **README** - Premium documentation matching Toon's quality
  - Head-to-head comparison table: ASON vs Toon showing ASON superiority
  - ASCII bar charts for visual benchmark comparison
  - Complete API reference with TypeScript examples
  - CLI usage guide with real-world examples
  - Professional badges (npm, TypeScript, License, Node.js)
  - Detailed table of contents with deep anchor links
  - "When to use" guide comparing ASON, Toon, JSON, and CSV
- **Package Distribution** - Optimized for production
  - Tarball size: 37.8 KB (includes types, CLI, and docs)
  - Unpacked size: 148 KB
  - Only 7 files published (down from previous bloat)

### Performance
- Benchmarks updated showing ASON achieves **+4.94% average token reduction**
- Toon shows **-6.75% average** (worse than JSON in some cases)
- ASON wins on **3 out of 4** tested real-world datasets
- CLI `--stats` flag provides instant compression metrics

## [1.0.0] - 2025-01-10

### Added
- Initial release of ASON (Aliased Serialization Object Notation)
- Complete Node.js implementation with SmartCompressor
- Automatic pattern detection (zero configuration required)
- Object references for repeated structures (`&obj0`, `&obj1`, etc.)
- Inline-first value dictionary optimized for LLM readability (`#0`, `#1`, etc.)
- Uniform array compression with `@keys` notation
- Path flattening for nested single-property objects
- Configurable indentation (0, 1, or 2 spaces)
- Lossless compression with perfect round-trip fidelity
- Interactive web visualizer with compress/decompress modes
- Comprehensive documentation site
- Benchmark suite comparing against Toon and JSON
- Complete test suite with Jest
- Community files: CODE_OF_CONDUCT, CONTRIBUTING, SECURITY
- MIT License

### Performance
- Achieves 33.26% token reduction on real-world data (28KB JSON)
- Beats Toon format by 8 tokens (1,808 vs 1,816)
- Processes ~35ms for compression + decompression cycle
- Memory efficient: ~10MB for large datasets

### Documentation
- Web visualizer at `/docs/index.html`
- Complete API documentation at `/docs/docs.html`
- Interactive benchmarks at `/docs/benchmarks.html`
- README with quick start guide
- Examples in `/nodejs-compressor/examples/`

[1.1.0]: https://github.com/SeanLuis/ason/releases/tag/v1.1.0
[1.0.0]: https://github.com/SeanLuis/ason/releases/tag/v1.0.0
