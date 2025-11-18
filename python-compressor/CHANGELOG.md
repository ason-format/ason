# Changelog

All notable changes to the ASON Python Compressor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Python implementation of ASON 2.0
- Comprehensive test suite with pytest (21 tests)
- Support for tabular arrays
- Support for sections
- Support for references
- Token counting and compression statistics
- Round-trip validation
- uv package manager support

### Changed
- Migrated tests to pytest framework with fixtures and parametrization

### Fixed
- String escaping for special ASON characters
- Empty structure handling

## [2.0.0] - 2025-01-XX

### Added
- First stable release of Python ASON compressor
- Full compatibility with ASON 2.0 specification
- 100% test coverage
- PyPI package distribution

[Unreleased]: https://github.com/ason-format/ason/compare/python-v2.0.0...HEAD
[2.0.0]: https://github.com/ason-format/ason/releases/tag/python-v2.0.0
