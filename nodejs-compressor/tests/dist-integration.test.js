/**
 * Integration tests for dist/ build
 * Tests the compiled version to ensure it works correctly
 */

import { SmartCompressor, TokenCounter } from '../dist/index.js';

describe('Dist Integration - SmartCompressor', () => {
  let compressor;

  beforeEach(() => {
    compressor = new SmartCompressor();
  });

  test('should compress and decompress simple object from dist', () => {
    const data = { id: 1, name: 'Alice' };
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle nested objects from dist', () => {
    const data = {
      user: {
        profile: {
          name: 'Bob',
          age: 30
        }
      }
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle arrays from dist', () => {
    const data = {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle negative numbers from dist', () => {
    const data = {
      temperature: -15.5,
      coordinates: { lat: 37.7749, lng: -122.4194 }
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle unicode and emojis from dist', () => {
    const data = {
      message: 'Hello 世界 🌍',
      name: 'こんにちは'
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle mixed type arrays from dist', () => {
    const data = {
      data: [
        'string',
        42,
        true,
        null,
        { nested: 'object' },
        [1, 2, 3]
      ]
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should validate round-trip from dist', () => {
    const data = { users: [{ id: 1, name: 'Alice' }] };
    const result = compressor.validateRoundTrip(data);

    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should get compression stats from dist', () => {
    const data = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
    const result = compressor.compressWithStats(data);

    expect(result.ason).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.reduction_percent).toBeGreaterThan(0);
  });

  test('should handle deeply nested structures from dist', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep'
            }
          }
        }
      }
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle tabular arrays from dist', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' }
      ]
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });
});

describe('Dist Integration - TokenCounter', () => {
  test('should estimate tokens from dist', () => {
    const text = 'Hello world!';
    const tokens = TokenCounter.estimateTokens(text);

    expect(typeof tokens).toBe('number');
    expect(tokens).toBeGreaterThan(0);
  });

  test('should compare formats from dist', () => {
    const data = { name: 'Test', value: 123 };
    const json = JSON.stringify(data);
    const ason = 'name:Test\nvalue:123';

    const stats = TokenCounter.compareFormats(data, json, ason);

    expect(stats).toHaveProperty('original_tokens');
    expect(stats).toHaveProperty('compressed_tokens');
    expect(stats).toHaveProperty('reduction_percent');
  });
});

describe('Dist Integration - Edge Cases', () => {
  let compressor;

  beforeEach(() => {
    compressor = new SmartCompressor();
  });

  test('should handle empty objects from dist', () => {
    const data = {};
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle empty arrays from dist', () => {
    const data = { items: [] };
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle null values from dist', () => {
    const data = { value: null };
    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle special characters in strings from dist', () => {
    const data = {
      path: '/usr/local/bin',
      email: 'user@example.com',
      code: 'ABC-123-XYZ'
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });

  test('should handle large numbers from dist', () => {
    const data = {
      bigNumber: 9007199254740991, // Number.MAX_SAFE_INTEGER
      smallNumber: -9007199254740991,
      decimal: 3.141592653589793
    };

    const compressed = compressor.compress(data);
    const decompressed = compressor.decompress(compressed);

    expect(decompressed).toEqual(data);
  });
});
