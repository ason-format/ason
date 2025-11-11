/**
 * @fileoverview Test suite for ASON SmartCompressor
 *
 * Tests cover:
 * - Basic compression/decompression (round-trip guarantee)
 * - Complex nested structures
 * - Real-world data examples
 * - Token counting and compression metrics
 * - Edge cases (nulls, empty values, special characters)
 *
 * All tests verify lossless round-trip: compress(data) → decompress → original data
 *
 * @module compressor.test
 * @requires SmartCompressor
 * @requires TokenCounter
 * @license MIT
 */

import { SmartCompressor, TokenCounter } from "../src/index.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Loads a JSON example file from the examples/data directory.
 *
 * @param {string} filename - Name of the JSON file to load
 * @returns {*} Parsed JSON data
 * @throws {Error} If file doesn't exist or contains invalid JSON
 */
const loadExample = (filename) => {
  const path = join(__dirname, "../examples/data", filename);
  return JSON.parse(readFileSync(path, "utf8"));
};

describe("SmartCompressor - Basic Functionality", () => {
  /** @type {SmartCompressor} */
  let compressor;

  beforeEach(() => {
    compressor = new SmartCompressor();
  });

  /**
   * Test Case: Simple object with primitives
   * Verifies basic compression and perfect round-trip for flat objects.
   */
  test("should compress and decompress simple object", () => {
    const data = { name: "Alice", age: 30, active: true };
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  /**
   * Test Case: Nested object structure
   * Verifies path flattening and nested object handling.
   */
  test("should compress and decompress nested object", () => {
    const data = {
      user: { id: 1, name: "Bob" },
      settings: { theme: "dark", lang: "en" },
    };
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  /**
   * Test Case: Array of primitives
   * Verifies [val1,val2] format for primitive arrays.
   */
  test("should compress and decompress array of primitives", () => {
    const data = [1, 2, 3, "a", "b", true, false, null];
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  /**
   * Test Case: Uniform array compression
   * Verifies automatic schema extraction and CSV-style formatting.
   * Tests both round-trip correctness and compression efficiency.
   */
  test("should compress uniform array efficiently", () => {
    const data = [
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Charlie", age: 35 },
    ];
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    // Test round-trip
    expect(decompressed).toEqual(data);

    // Test compression (should be more compact)
    const originalStr = JSON.stringify(data);
    const compressedStr = JSON.stringify(compressed);
    expect(compressedStr.length).toBeLessThan(originalStr.length);
  });

  /**
   * Test Case: Null and empty value handling
   * Verifies proper serialization of null, undefined, 0, and empty strings.
   * Note: JavaScript undefined is not JSON-serializable, so it gets dropped.
   */
  test("should handle null and undefined", () => {
    const data = { a: null, b: undefined, c: 0, d: "" };
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed.a).toBeNull();
    expect(decompressed.c).toBe(0);
    expect(decompressed.d).toBe("");
  });

  /**
   * Test Case: Real-world shipping record
   * Tests compression on actual production-like data with multiple levels of nesting.
   */
  test("should compress real shipping record", () => {
    const data = loadExample("shipping_record.json");
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  /**
   * Test Case: Lossless compression guarantee
   * Verifies that stringified compressed-decompressed data matches original.
   * This is the ultimate test for round-trip fidelity.
   */
  test("should compress without data loss", () => {
    const data = loadExample("shipping_record.json");
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    // Perfect round-trip is what matters
    expect(JSON.stringify(decompressed)).toBe(JSON.stringify(data));
  });
});

describe("SmartCompressor - Complex Structures", () => {
  /** @type {SmartCompressor} */
  let compressor;

  beforeEach(() => {
    compressor = new SmartCompressor();
  });

  /**
   * Test Case: Deeply nested object structure
   * Verifies path flattening for deep single-property chains.
   * Example: {a: {b: {c: "value"}}} → a.b.c:value
   */
  test("should handle deeply nested objects", () => {
    const data = loadExample("deeply-nested.json");
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  /**
   * Test Case: E-commerce order data
   * Tests realistic e-commerce scenario with mixed structures:
   * - Order metadata (timestamps, IDs)
   * - Line items array (uniform structure)
   * - Customer information
   * - Payment details
   */
  test("should handle e-commerce order", () => {
    const data = loadExample("e-commerce-order.json");
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  /**
   * Test Case: Mixed type arrays
   * Verifies handling of non-uniform arrays containing:
   * - Different object structures
   * - Primitives mixed with objects
   * - Nested arrays
   */
  test("should handle mixed type arrays", () => {
    const data = loadExample("mixed-types.json");
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });
});

describe("TokenCounter", () => {
  /**
   * Test Case: Token estimation
   * Verifies that TokenCounter can estimate token counts for text.
   * Uses GPT tokenizer (cl100k_base) or falls back to approximation.
   */
  test("should estimate tokens", () => {
    const text = "Hello World";
    const tokens = TokenCounter.estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
  });

  /**
   * Test Case: Format comparison metrics
   * Verifies that compareFormats returns all expected metrics:
   * - Original and compressed token counts
   * - Reduction percentage
   * - Byte sizes
   */
  test("should compare formats and provide metrics", () => {
    const original = { name: "Test", value: 123, items: [1, 2, 3] };
    const compressor = new SmartCompressor();
    const compressed = compressor.compress(original);

    const comparison = TokenCounter.compareFormats(original, compressed);

    expect(comparison).toHaveProperty("original_tokens");
    expect(comparison).toHaveProperty("compressed_tokens");
    expect(comparison).toHaveProperty("reduction_percent");
    expect(comparison).toHaveProperty("original_size");
    expect(comparison).toHaveProperty("compressed_size");
  });

  /**
   * Test Case: Compression benefit on uniform arrays
   * Verifies that uniform arrays show significant compression benefit.
   * Uniform arrays are ASON's strongest use case (40-60% reduction typical).
   *
   * This test generates 10 user objects with consistent schema and verifies
   * that compression achieves at least 10% token reduction.
   */
  test("should show compression benefit on uniform arrays", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `User${i}`,
      email: `user${i}@example.com`,
      age: 20 + i,
    }));

    const compressor = new SmartCompressor();
    const compressed = compressor.compress(data);
    const comparison = TokenCounter.compareFormats(data, compressed);

    // Uniform arrays should compress well
    expect(comparison.reduction_percent).toBeGreaterThan(10);
  });
});
