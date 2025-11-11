/**
 * @fileoverview Integration tests for built package (dist/)
 *
 * Tests verify that the compiled package works correctly when imported
 * as if it were installed from NPM. This ensures the build output is valid.
 *
 * Tests:
 * - ESM imports from dist/index.js
 * - Basic compression/decompression
 * - TypeScript type exports
 * - All public API methods
 *
 * @module dist-integration.test
 * @license MIT
 */

import { SmartCompressor, TokenCounter } from "../dist/index.js";

describe("Built Package (dist/) - ESM Integration", () => {
  let compressor;

  beforeEach(() => {
    compressor = new SmartCompressor({ indent: 1 });
  });

  test("should import SmartCompressor from dist/", () => {
    expect(SmartCompressor).toBeDefined();
    expect(typeof SmartCompressor).toBe("function");
  });

  test("should import TokenCounter from dist/", () => {
    expect(TokenCounter).toBeDefined();
    expect(typeof TokenCounter.estimateTokens).toBe("function");
    expect(typeof TokenCounter.compareFormats).toBe("function");
  });

  test("should compress simple object", () => {
    const data = { name: "Alice", age: 25 };
    const compressed = compressor.compress(data);

    expect(compressed).toBeDefined();
    expect(typeof compressed).toBe("string");
    expect(compressed).toContain("name:");
    expect(compressed).toContain("age:");
  });

  test("should decompress back to original", () => {
    const original = { name: "Bob", age: 30, active: true };
    const compressed = compressor.compress(original);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(original);
  });

  test("should handle uniform arrays", () => {
    const data = {
      users: [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" }
      ]
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
    expect(compressed).toContain("@id,name,email");
  });

  test("should handle nested objects", () => {
    const data = {
      user: {
        profile: {
          name: "Alice",
          settings: {
            theme: "dark",
            notifications: true
          }
        }
      }
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test("should count tokens", () => {
    const text = "Hello world";
    const tokens = TokenCounter.estimateTokens(text);

    expect(typeof tokens).toBe("number");
    expect(tokens).toBeGreaterThan(0);
  });

  test("should compare formats", () => {
    const data = { name: "Test", value: 123 };
    const compressed = compressor.compress(data);
    const comparison = TokenCounter.compareFormats(data, compressed);

    expect(comparison).toHaveProperty("original_tokens");
    expect(comparison).toHaveProperty("compressed_tokens");
    expect(comparison).toHaveProperty("reduction_percent");
    expect(comparison).toHaveProperty("original_size");
    expect(comparison).toHaveProperty("compressed_size");

    expect(typeof comparison.original_tokens).toBe("number");
    expect(typeof comparison.compressed_tokens).toBe("number");
    expect(typeof comparison.reduction_percent).toBe("number");
    expect(typeof comparison.original_size).toBe("number");
    expect(typeof comparison.compressed_size).toBe("number");
  });

  test("should handle special characters", () => {
    const data = {
      text: 'Hello "world"',
      unicode: "こんにちは",
      emoji: "🚀",
      newline: "line1\nline2"
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test("should handle null and undefined", () => {
    const data = {
      nullValue: null,
      defined: "value"
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test("should handle arrays with different types", () => {
    const data = {
      mixed: [1, "string", true, null, { key: "value" }]
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test("should work with configuration options", () => {
    const customCompressor = new SmartCompressor({
      indent: 2,
      delimiter: "\t",
      useReferences: false,
      useDictionary: false
    });

    const data = { name: "Test" };
    const compressed = customCompressor.compress(data);
    const decompressed = customCompressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });
});

describe("Built Package (dist/) - Large Dataset Test", () => {
  test("should handle uniform array data with good compression", () => {
    const compressor = new SmartCompressor({ indent: 1 });

    // Create uniform data that compresses well (similar structure repeated)
    const uniformData = {
      users: []
    };

    // Generate 50 users with uniform structure
    for (let i = 1; i <= 50; i++) {
      uniformData.users.push({
        id: i,
        name: `User${i}`,
        email: `user${i}@example.com`,
        age: 20 + (i % 50),
        active: i % 2 === 0
      });
    }

    const compressed = compressor.compress(uniformData);
    const decompressed = compressor.decompress(compressed);

    // Verify lossless round-trip
    expect(decompressed).toEqual(uniformData);

    // Verify compression reduces size
    const jsonStr = JSON.stringify(uniformData);
    expect(compressed.length).toBeLessThan(jsonStr.length);

    // Verify token reduction (uniform arrays should compress very well)
    const jsonTokens = TokenCounter.estimateTokens(jsonStr);
    const asonTokens = TokenCounter.estimateTokens(compressed);
    expect(asonTokens).toBeLessThan(jsonTokens);

    // Verify significant compression ratio (should be > 10% for uniform data)
    const comparison = TokenCounter.compareFormats(uniformData, compressed);
    expect(comparison.reduction_percent).toBeGreaterThan(10);
  });
});
