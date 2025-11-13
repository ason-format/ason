/**
 * @fileoverview Token Counter utility for ASON 2.0
 *
 * Estimates token counts for different formats (JSON, ASON, etc.)
 * using approximation methods.
 *
 * @module TokenCounter
 * @license MIT
 * @version 2.0.0
 */

/**
 * Token counting utilities.
 *
 * @class TokenCounter
 */
export class TokenCounter {
  /**
   * Estimates tokens for text using character-based approximation.
   *
   * Uses the common heuristic: ~1 token per 4 characters for English text.
   *
   * @static
   * @param {string|*} text - Text to count (auto-stringifies non-strings)
   * @returns {number} Estimated token count
   *
   * @example
   * TokenCounter.estimateTokens("Hello world") // ~3
   * TokenCounter.estimateTokens({key: "value"}) // ~5
   */
  static estimateTokens(text) {
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }

    // Approximate: 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Compares token counts between two formats.
   *
   * @static
   * @param {*} original - Original data/text
   * @param {*} compressed - Compressed data/text
   * @returns {Object} Comparison statistics
   *
   * @example
   * const stats = TokenCounter.compare(originalJSON, asonString);
   * console.log(`Saved ${stats.reduction_percent}%`);
   */
  static compare(original, compressed) {
    const originalStr = typeof original === 'string' ? original : JSON.stringify(original);
    const compressedStr = typeof compressed === 'string' ? compressed : JSON.stringify(compressed);

    const originalTokens = this.estimateTokens(originalStr);
    const compressedTokens = this.estimateTokens(compressedStr);

    const reduction = originalTokens - compressedTokens;
    const reductionPercent = originalTokens > 0
      ? (reduction / originalTokens) * 100
      : 0;

    return {
      original_tokens: originalTokens,
      compressed_tokens: compressedTokens,
      tokens_saved: reduction,
      reduction_percent: parseFloat(reductionPercent.toFixed(2)),
      original_size: originalStr.length,
      compressed_size: compressedStr.length,
      bytes_saved: originalStr.length - compressedStr.length,
      size_reduction_percent: parseFloat(
        ((originalStr.length - compressedStr.length) / originalStr.length * 100).toFixed(2)
      )
    };
  }

  /**
   * Gets detailed token breakdown for JSON.
   *
   * @static
   * @param {*} data - Data to analyze
   * @returns {Object} Token breakdown
   */
  static analyzeJSON(data) {
    const json = typeof data === 'string' ? data : JSON.stringify(data);

    // Count different types of characters
    const brackets = (json.match(/[\[\]{}]/g) || []).length;
    const quotes = (json.match(/"/g) || []).length;
    const colons = (json.match(/:/g) || []).length;
    const commas = (json.match(/,/g) || []).length;

    return {
      total_chars: json.length,
      total_tokens: this.estimateTokens(json),
      structural: {
        brackets,
        quotes,
        colons,
        commas
      },
      structural_overhead: brackets + quotes + colons + commas
    };
  }

  /**
   * Gets detailed token breakdown for ASON.
   *
   * @static
   * @param {string} ason - ASON text
   * @returns {Object} Token breakdown
   */
  static analyzeASON(ason) {
    const sections = (ason.match(/@\w+/g) || []).length;
    const references = (ason.match(/\$\w+/g) || []).length;
    const pipes = (ason.match(/\|/g) || []).length;
    const newlines = (ason.match(/\n/g) || []).length;

    return {
      total_chars: ason.length,
      total_tokens: this.estimateTokens(ason),
      features: {
        sections,
        references,
        pipe_delimiters: pipes,
        newlines
      }
    };
  }

  /**
   * Calculates comprehensive comparison stats.
   *
   * @static
   * @param {*} data - Original data
   * @param {string} jsonString - JSON representation
   * @param {string} asonString - ASON representation
   * @returns {Object} Detailed comparison
   */
  static compareFormats(data, jsonString, asonString) {
    const jsonAnalysis = this.analyzeJSON(jsonString);
    const asonAnalysis = this.analyzeASON(asonString);
    const comparison = this.compare(jsonString, asonString);

    return {
      ...comparison,
      json: jsonAnalysis,
      ason: asonAnalysis,
      efficiency: {
        tokens_per_char_json: jsonAnalysis.total_tokens / jsonAnalysis.total_chars,
        tokens_per_char_ason: asonAnalysis.total_tokens / asonAnalysis.total_chars,
        compression_ratio: asonAnalysis.total_chars / jsonAnalysis.total_chars
      }
    };
  }
}
