/**
 * ASON - Aliased Serialization Object Notation
 *
 * A token-optimized serialization format designed specifically for LLMs,
 * reducing token usage by 20-60% compared to JSON while maintaining full round-trip fidelity.
 *
 * @module @ason-format/ason
 * @license MIT
 */

/**
 * Configuration options for SmartCompressor
 */
export interface SmartCompressorOptions {
  /**
   * Indentation spaces (minimum 1 for parser compatibility)
   * @default 1
   */
  indent?: number;

  /**
   * Delimiter for CSV arrays
   * @default ','
   */
  delimiter?: string;

  /**
   * Enable automatic pattern detection and references
   * @default true
   */
  useReferences?: boolean;

  /**
   * Enable inline-first value dictionary
   * @default true
   */
  useDictionary?: boolean;
}

/**
 * Token comparison statistics
 */
export interface TokenComparisonStats {
  /** Original token count */
  original_tokens: number;

  /** Compressed token count */
  compressed_tokens: number;

  /** Reduction percentage */
  reduction_percent: number;

  /** Original size in characters */
  original_size: number;

  /** Compressed size in characters */
  compressed_size: number;
}

/**
 * SmartCompressor class handles compression and decompression of JSON data to/from ASON format.
 *
 * @example
 * ```typescript
 * import { SmartCompressor } from '@ason-format/ason';
 *
 * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
 * const data = { users: [{id: 1, name: "Alice"}] };
 *
 * // Compress
 * const compressed = compressor.compress(data);
 *
 * // Decompress
 * const original = compressor.decompress(compressed);
 * ```
 */
export class SmartCompressor {
  /**
   * Creates a new SmartCompressor instance with optional configuration.
   *
   * @param options - Configuration options
   *
   * @example
   * ```typescript
   * // Maximum compression
   * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
   *
   * // Maximum readability
   * const readable = new SmartCompressor({ indent: 2, useReferences: false });
   * ```
   */
  constructor(options?: SmartCompressorOptions);

  /**
   * Compresses JSON data into ASON format.
   *
   * Performs a three-pass compression:
   * 1. Detect repeated array structures (3+ occurrences)
   * 2. Detect repeated objects (2+ occurrences)
   * 3. Detect frequent string values (2+ occurrences)
   *
   * @param data - Any JSON-serializable data
   * @returns ASON-formatted string
   *
   * @example
   * ```typescript
   * const data = {
   *   users: [
   *     {id: 1, name: "Alice", email: "alice@example.com"},
   *     {id: 2, name: "Bob", email: "bob@example.com"}
   *   ]
   * };
   * const compressed = compressor.compress(data);
   * // Output: users:[2]@id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com
   * ```
   */
  compress(data: any): string;

  /**
   * Decompresses ASON format back to original JSON structure.
   *
   * Parses the ASON format including:
   * - $def: section for structure/object/value definitions
   * - $data: section for actual data
   * - Uniform array notation ([N]@keys)
   * - Object aliases (&obj0)
   * - Value dictionary references (#0)
   * - Path flattening (a.b.c)
   *
   * @param text - ASON formatted string
   * @returns Original JSON data structure
   * @throws {Error} If parsing fails due to malformed input
   *
   * @example
   * ```typescript
   * const ason = "users:[2]@id,name\n1,Alice\n2,Bob";
   * const original = compressor.decompress(ason);
   * // Returns: {users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]}
   * ```
   */
  decompress(text: string): any;
}

/**
 * TokenCounter provides utilities for estimating and comparing token usage.
 *
 * Uses approximation (text.length / 4) for token counts.
 *
 * @example
 * ```typescript
 * import { TokenCounter } from '@ason-format/ason';
 *
 * const tokens = TokenCounter.estimateTokens("Hello world");
 * console.log(tokens); // 3
 *
 * const stats = TokenCounter.compareFormats(original, compressed);
 * console.log(`Saved ${stats.reduction_percent}% tokens`);
 * ```
 */
export class TokenCounter {
  /**
   * Estimates token count for text using approximation (text.length / 4).
   *
   * @param text - Text to count tokens for (auto-stringifies non-strings)
   * @returns Estimated token count
   *
   * @example
   * ```typescript
   * TokenCounter.estimateTokens("Hello world") // 3
   * TokenCounter.estimateTokens({key: "value"}) // 4
   * ```
   */
  static estimateTokens(text: string | any): number;

  /**
   * Compares token usage between original JSON and compressed ASON.
   *
   * @param original - Original data structure
   * @param compressed - Compressed data (ASON string or data structure)
   * @returns Token comparison statistics
   *
   * @example
   * ```typescript
   * const original = {users: [{id: 1}, {id: 2}]};
   * const compressed = compressor.compress(original);
   * const stats = TokenCounter.compareFormats(original, compressed);
   * // Returns: {original_tokens: 15, compressed_tokens: 8, reduction_percent: 46.67, ...}
   * ```
   */
  static compareFormats(original: any, compressed: string | any): TokenComparisonStats;
}
