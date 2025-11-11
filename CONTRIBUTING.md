# Contributing to ASON

Thank you for your interest in contributing to ASON! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** including JSON inputs and expected vs actual outputs
* **Describe the behavior you observed** and explain what behavior you expected
* **Include screenshots or code snippets** if relevant
* **Specify your environment**: Node.js version, OS, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the suggested enhancement
* **Explain why this enhancement would be useful** to most ASON users
* **List examples** of how the feature would be used
* **Mention if you're willing to implement** the enhancement yourself

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards (see below)
3. **Add tests** if you're adding functionality
4. **Ensure all tests pass**: `npm test` in `nodejs-compressor/`
5. **Update documentation** if you're changing functionality
6. **Write a clear commit message** describing your changes
7. **Submit a pull request** with a comprehensive description

## Development Setup

### Node.js Implementation

```bash
# Clone the repository
git clone https://github.com/ason-format/ason.git
cd ason

# Install dependencies for Node.js version
cd nodejs-compressor
npm install

# Run tests
npm test

# Run benchmarks
node benchmarks/toon-comparison-benchmark.js
```

### Web Visualizer

```bash
# Navigate to docs directory
cd docs

# Start a local server
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## Coding Standards

### JavaScript Style Guide

* Use **ES6+ features** where appropriate
* Follow **consistent indentation** (2 spaces)
* Use **meaningful variable names**
* Add **JSDoc comments** for public APIs
* Keep functions **small and focused**
* Prefer **const** over **let**, avoid **var**

### Example:

```javascript
/**
 * Compresses a JSON object to ASON format
 * @param {Object} data - The JSON data to compress
 * @param {Object} options - Compression options
 * @returns {string} The compressed ASON string
 */
compress(data, options = {}) {
  // Implementation
}
```

### Testing

* **Write tests** for new features and bug fixes
* **Maintain or improve** test coverage
* **Use descriptive test names** that explain what is being tested
* **Follow the existing test structure** in the codebase

Example test:

```javascript
test('compresses uniform array with references', () => {
  const input = {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };
  const result = compressor.compress(input);
  expect(result).toContain('@id,name');
});
```

### Commit Messages

* Use the **present tense** ("Add feature" not "Added feature")
* Use the **imperative mood** ("Move cursor to..." not "Moves cursor to...")
* **Limit the first line** to 72 characters or less
* **Reference issues and pull requests** when relevant

Examples:
```
Add inline-first dictionary compression
Fix decompression of nested arrays
Update benchmarks with new test data
```

## Project Structure

```
nodejs-compressor/
├── src/
│   └── compressor/
│       ├── SmartCompressor.js  # Main compression engine
│       └── PatternDetector.js  # Pattern detection logic
├── tests/
│   └── compressor.test.js      # Test suite
├── benchmarks/                  # Performance benchmarks
└── examples/                    # Sample data files

docs/
├── index.html                   # Web visualizer
├── docs.html                    # Documentation page
├── benchmarks.html              # Benchmarks page
├── js/
│   ├── compressor.js           # Browser-compatible compressor
│   ├── app.js                  # Visualizer logic
│   └── benchmarks.js           # Benchmark runner
└── css/
    └── styles.css              # Styles
```

## Areas Needing Contribution

We welcome contributions in these areas:

### High Priority

* **Fix failing tests** (4/13 tests currently failing)
* **Improve decompression parser** for edge cases
* **Add more test coverage** for complex JSON structures
* **Performance optimizations** in pattern detection

### Medium Priority

* **Python implementation** (port from Node.js)
* **Better error messages** for invalid inputs
* **CLI tool** for command-line compression
* **Benchmark against more formats** (MessagePack, etc.)

### Low Priority

* **Key compression** feature (see Future Improvements)
* **Base36 encoding** for long IDs
* **Tiktoken integration** for exact token counting
* **Additional examples** and tutorials

## Documentation

* Update the **README.md** if you change functionality
* Update **JSDoc comments** for modified functions
* Add examples to the **docs/** folder if adding features
* Update **CHANGELOG.md** (if exists) with your changes

## Testing Guidelines

### Unit Tests

Run unit tests with:
```bash
cd nodejs-compressor
npm test
```

### Manual Testing

1. Test with the **web visualizer** at `docs/index.html`
2. Try various **JSON structures** (nested, arrays, primitives)
3. Verify **round-trip fidelity** (compress → decompress → equals original)
4. Check **benchmarks** to ensure no performance regression

### Test Data

Add test cases for:
* **Simple objects** and arrays
* **Nested structures**
* **Uniform arrays** (same keys)
* **Mixed data types**
* **Edge cases** (empty objects, null values, special characters)

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
5. Push tags: `git push --tags`
6. Create GitHub release with notes

## Questions?

* Check the [documentation](./docs/docs.html)
* Review [existing issues](https://github.com/ason-format/ason/issues)
* Open a new issue for discussion

## Recognition

Contributors will be:
* Listed in release notes
* Mentioned in significant feature announcements
* Credited in the project documentation

Thank you for contributing to ASON! 🚀
