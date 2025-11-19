# Changelog

All notable changes to the ASON Rust Compressor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Rust implementation of ASON 2.0
- Complete lexer for tokenization with full test coverage
- Full parser implementation supporting:
  - Implicit objects (key:value format)
  - Tabular arrays
  - Sections
  - Reference definitions
- AST node definitions for all ASON types
- Basic serializer module
- Comprehensive SmartCompressor API
- Module stubs for analyzers (reference, section, tabular)
- Round-trip compression/decompression
- Pure Rust implementation using serde

### Changed
- N/A (initial release)

### Fixed
- Rust borrow checker issues in parser

## [1.0.0] - 2025-01-XX

### Added
- First stable release of Rust ASON compressor
- Full compatibility with ASON 2.0 specification
- Pure Rust implementation with serde integration
- Crates.io package distribution

[Unreleased]: https://github.com/ason-format/ason/compare/rust-v1.0.0...HEAD
[1.0.0]: https://github.com/ason-format/ason/releases/tag/rust-v1.0.0
