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
 * @version 2.0.0
 *
 * @example
 * import { SmartCompressor, TokenCounter } from 'ason';
 *
 * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
 * const data = { users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}] };
 *
 * // Compress
 * const ason = compressor.compress(data);
 *
 * // Decompress
 * const original = compressor.decompress(ason);
 *
 * // Compare
 * const stats = TokenCounter.compareFormats(data, ason);
 * console.log(`Reduced tokens by ${stats.reduction_percent}%`);
 */

import { Lexer } from './lexer/Lexer.js';
import { Parser } from './parser/Parser.js';
import { ReferenceAnalyzer } from './analyzer/ReferenceAnalyzer.js';
import { SectionAnalyzer } from './analyzer/SectionAnalyzer.js';
import { TabularAnalyzer } from './analyzer/TabularAnalyzer.js';
import { Serializer } from './compiler/Serializer.js';
import { TokenCounter } from './utils/TokenCounter.js';

/**
 * SmartCompressor handles compression and decompression for ASON 2.0.
 *
 * @class SmartCompressor
 *
 * @example
 * const compressor = new SmartCompressor({ indent: 1 });
 * const ason = compressor.compress({ users: [{id: 1, name: "Alice"}] });
 * const data = compressor.decompress(ason);
 */
export class SmartCompressor {
  /**
   * Creates a new SmartCompressor instance.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.indent=1] - Indentation spaces
   * @param {string} [options.delimiter='|'] - Field delimiter for tabular arrays
   * @param {boolean} [options.useReferences=true] - Enable reference detection
   * @param {boolean} [options.useSections=true] - Enable section organization
   * @param {boolean} [options.useTabular=true] - Enable tabular array format
   * @param {number} [options.minFieldsForSection=3] - Min fields to create section
   * @param {number} [options.minRowsForTabular=2] - Min rows for tabular format
   * @param {number} [options.minReferenceOccurrences=2] - Min occurrences for reference
   *
   * @example
   * // Maximum compression
   * new SmartCompressor({ indent: 1 })
   *
   * // Maximum readability
   * new SmartCompressor({ indent: 2, useSections: false, useTabular: false })
   */
  constructor(options = {}) {
    /** @type {number} Indentation level */
    this.indent = Math.max(1, options.indent ?? 1);

    /** @type {string} Delimiter for tabular arrays */
    this.delimiter = options.delimiter ?? '|';

    /** @type {boolean} Use reference optimization */
    this.useReferences = options.useReferences ?? true;

    /** @type {boolean} Use section organization */
    this.useSections = options.useSections ?? true;

    /** @type {boolean} Use tabular array format */
    this.useTabular = options.useTabular ?? true;

    // Analyzer options
    this.minFieldsForSection = options.minFieldsForSection ?? 3;
    this.minRowsForTabular = options.minRowsForTabular ?? 2;
    this.minReferenceOccurrences = options.minReferenceOccurrences ?? 2;

    // Initialize components
    this.referenceAnalyzer = new ReferenceAnalyzer({
      minOccurrences: this.minReferenceOccurrences,
      minLength: 5
    });

    this.sectionAnalyzer = new SectionAnalyzer({
      minFieldsForSection: this.minFieldsForSection
    });

    this.tabularAnalyzer = new TabularAnalyzer({
      minRows: this.minRowsForTabular,
      minUniformity: 0.8
    });

    this.serializer = new Serializer({
      indent: this.indent,
      delimiter: this.delimiter
    });
  }

  /**
   * Compresses JSON data to ASON 2.0 format.
   *
   * Pipeline:
   * 1. Analyze references (repeated values → $var)
   * 2. Analyze sections (object organization → @section)
   * 3. Analyze arrays (uniform arrays → tabular format)
   * 4. Serialize to ASON 2.0 string
   *
   * @param {*} data - Data to compress
   * @returns {string} ASON 2.0 formatted string
   *
   * @example
   * const data = {
   *   customer: { name: 'John', email: 'john@ex.com' },
   *   billing: { email: 'john@ex.com' }
   * };
   * const ason = compressor.compress(data);
   */
  compress(data) {
    // Step 1: Analyze references
    let references = new Map();
    if (this.useReferences) {
      references = this.referenceAnalyzer.analyze(data);
    }

    // Step 2: Analyze sections
    let sectionPlan = null;
    if (this.useSections && data && typeof data === 'object' && !Array.isArray(data)) {
      sectionPlan = this.sectionAnalyzer.analyze(data);
    }

    // Step 3: Analyze tabular arrays
    const tabularArrays = new Map();
    if (this.useTabular) {
      const arrayInfos = this.tabularAnalyzer.findArrays(data);
      for (const info of arrayInfos) {
        if (info.analysis.isTabular) {
          tabularArrays.set(info.path, info.analysis);
        }
      }
    }

    // Step 4: Serialize
    const ason = this.serializer.serialize(data, references, sectionPlan, tabularArrays);

    return ason;
  }

  /**
   * Decompresses ASON 2.0 format back to JSON.
   *
   * Pipeline:
   * 1. Tokenize (Lexer)
   * 2. Parse (Parser → AST)
   * 3. Convert AST to JavaScript value
   *
   * @param {string} ason - ASON 2.0 formatted string
   * @returns {*} Original JSON data
   *
   * @example
   * const ason = "@users [2]{id,name}\n1|Alice\n2|Bob";
   * const data = compressor.decompress(ason);
   * // Returns: { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }
   */
  decompress(ason) {
    // Step 1: Tokenize
    const lexer = new Lexer(ason);
    const tokens = lexer.tokenize();

    // Step 2: Parse
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Step 3: Convert AST to value
    return ast.toValue();
  }

  /**
   * Compresses data and returns detailed statistics.
   *
   * @param {*} data - Data to compress
   * @returns {Object} Compression result with statistics
   *
   * @example
   * const result = compressor.compressWithStats(data);
   * console.log(`Reduced tokens by ${result.stats.reduction_percent}%`);
   */
  compressWithStats(data) {
    const jsonString = JSON.stringify(data);
    const asonString = this.compress(data);

    const stats = TokenCounter.compareFormats(data, jsonString, asonString);

    return {
      ason: asonString,
      stats,
      original_tokens: stats.original_tokens,
      compressed_tokens: stats.compressed_tokens,
      reduction_percent: stats.reduction_percent
    };
  }

  /**
   * Validates that compress/decompress round-trips correctly.
   *
   * @param {*} data - Data to test
   * @returns {Object} Validation result
   *
   * @example
   * const result = compressor.validateRoundTrip(data);
   * if (result.valid) {
   *   console.log('Round-trip successful!');
   * }
   */
  validateRoundTrip(data) {
    try {
      const compressed = this.compress(data);
      const decompressed = this.decompress(compressed);

      const original = JSON.stringify(data);
      const result = JSON.stringify(decompressed);

      const valid = original === result;

      return {
        valid,
        compressed,
        original: data,
        decompressed,
        error: valid ? null : 'Data mismatch after round-trip'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Gets optimization statistics without compressing.
   *
   * @param {*} data - Data to analyze
   * @returns {Object} Analysis statistics
   */
  getOptimizationStats(data) {
    const references = this.useReferences
      ? this.referenceAnalyzer.analyze(data)
      : new Map();

    const sectionPlan = this.useSections && data && typeof data === 'object'
      ? this.sectionAnalyzer.analyze(data)
      : null;

    const tabularStats = this.useTabular
      ? this.tabularAnalyzer.getStatistics(data)
      : null;

    const sectionStats = sectionPlan
      ? this.sectionAnalyzer.getStatistics(sectionPlan)
      : null;

    return {
      references: {
        count: references.size,
        names: Array.from(references.keys())
      },
      sections: sectionStats,
      tabular: tabularStats
    };
  }
}

// Export TokenCounter for convenience
export { TokenCounter };
