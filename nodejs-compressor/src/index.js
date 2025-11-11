/**
 * @fileoverview ASON (Aliased Serialization Object Notation) - Main Entry Point
 *
 * This module exports the main compression engine and token counter utilities
 * for converting JSON to ASON format, a token-optimized serialization format
 * designed for Large Language Models (LLMs).
 *
 * ASON reduces token usage by 20-60% compared to JSON while maintaining
 * perfect round-trip fidelity (lossless compression).
 *
 * @module ason
 * @see {@link SmartCompressor} for compression/decompression
 * @see {@link TokenCounter} for token estimation utilities
 * @license MIT
 * @version 1.0.0
 *
 * @example
 * import { SmartCompressor, TokenCounter } from 'ason';
 *
 * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
 * const data = { users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}] };
 *
 * // Compress
 * const ason = compressor.compress(data);
 * // Output: users:[2]@id,name\n1,Alice\n2,Bob
 *
 * // Decompress
 * const original = compressor.decompress(ason);
 *
 * // Compare
 * const stats = TokenCounter.compareFormats(data, ason);
 * console.log(`Reduced tokens by ${stats.reduction_percent}%`);
 */

export { SmartCompressor, TokenCounter } from "./compressor/SmartCompressor.js";
