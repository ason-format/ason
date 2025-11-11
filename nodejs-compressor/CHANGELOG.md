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

## [1.1.1] - 2024-11-10

### Changed
- Documentation improvements
- Updated badges and preview images in README
- Enhanced package metadata

## [1.1.0] - 2024-11-10

### Added
- Initial public release
- Smart compression with automatic pattern detection
- Uniform array compression with schema extraction
- Object aliasing for repeated structures
- Inline-first value dictionary
- Path flattening for nested objects
- Token counter utilities
- CLI tool for compression/decompression
- Comprehensive documentation and examples

[1.1.2]: https://github.com/ason-format/ason/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/ason-format/ason/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ason-format/ason/releases/tag/v1.1.0
