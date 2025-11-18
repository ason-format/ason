# Changelog

All notable changes to the ASON Go Compressor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Go implementation of ASON 2.0
- Comprehensive test suite with testify (11 tests)
- Lexer for tokenization
- Parser for AST generation
- Support for tabular arrays
- Support for sections
- Support for references
- Token counting and compression statistics
- Round-trip validation
- Pure Go implementation (no external dependencies except testify for testing)

### Fixed
- Parser bug with implicit object format (key:value pairs)
- Parser bug with reference definitions followed by arrays
- String quoting for ASON special characters (@, $, &, [, ], =)

## [1.0.0] - 2025-01-XX

### Added
- First stable release of Go ASON compressor
- Full compatibility with ASON 2.0 specification
- 100% test coverage
- Go module distribution

[Unreleased]: https://github.com/ason-format/ason/compare/go-v1.0.0...HEAD
[1.0.0]: https://github.com/ason-format/ason/releases/tag/go-v1.0.0
