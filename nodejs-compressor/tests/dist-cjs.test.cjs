/**
 * @fileoverview CommonJS integration test for built package (dist/)
 *
 * Tests that the CJS build (dist/index.cjs) works correctly when required
 * using CommonJS syntax. This ensures compatibility with older Node.js projects.
 *
 * @module dist-cjs.test
 * @license MIT
 */

const { SmartCompressor, TokenCounter } = require("../dist/index.cjs");

describe("Built Package (dist/) - CommonJS Integration", () => {
  let compressor;

  beforeEach(() => {
    compressor = new SmartCompressor({ indent: 1 });
  });

  test("should require SmartCompressor from dist/index.cjs", () => {
    expect(SmartCompressor).toBeDefined();
    expect(typeof SmartCompressor).toBe("function");
  });

  test("should require TokenCounter from dist/index.cjs", () => {
    expect(TokenCounter).toBeDefined();
    expect(typeof TokenCounter.estimateTokens).toBe("function");
    expect(typeof TokenCounter.compareFormats).toBe("function");
  });

  test("should compress and decompress (CJS)", () => {
    const original = { name: "Alice", age: 25, active: true };
    const compressed = compressor.compress(original);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(original);
  });

  test("should handle uniform arrays (CJS)", () => {
    const data = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" }
      ]
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
    expect(compressed).toContain("@id,name");
  });

  test("should count tokens (CJS)", () => {
    const text = "Hello world from CommonJS";
    const tokens = TokenCounter.estimateTokens(text);

    expect(typeof tokens).toBe("number");
    expect(tokens).toBeGreaterThan(0);
  });

  test("should compare formats (CJS)", () => {
    const data = { test: "value", number: 42 };
    const compressed = compressor.compress(data);
    const comparison = TokenCounter.compareFormats(data, compressed);

    expect(comparison).toHaveProperty("original_tokens");
    expect(comparison).toHaveProperty("compressed_tokens");
    expect(comparison).toHaveProperty("reduction_percent");
    expect(comparison).toHaveProperty("original_size");
    expect(comparison).toHaveProperty("compressed_size");
  });

  test("should work with all configuration options (CJS)", () => {
    const customCompressor = new SmartCompressor({
      indent: 1,
      delimiter: ",",
      useReferences: true,
      useDictionary: true
    });

    const data = {
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" }
      ]
    };

    const compressed = customCompressor.compress(data);
    const decompressed = customCompressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });
});
