/**
 * @fileoverview PatternDetector - Automatic detection of repeated array structures
 *
 * This module provides utilities for analyzing JSON data and automatically
 * detecting repeated patterns in uniform object arrays. It's used internally
 * by SmartCompressor for automatic pattern detection without hardcoding.
 *
 * Key Features:
 * - Zero-configuration pattern detection
 * - Tracks pattern frequency and locations
 * - Generates automatic reference names ($0, $1, etc.)
 * - Configurable minimum occurrence threshold
 *
 * @module PatternDetector
 * @license MIT
 * @version 1.0.0
 */

/**
 * PatternDetector automatically identifies repeated array structures in JSON data.
 *
 * The detector recursively traverses a JSON tree and identifies uniform object arrays
 * (arrays where all objects share the same key structure). When a pattern appears
 * multiple times (configurable threshold), it becomes a candidate for creating
 * a structure reference to reduce repetition.
 *
 * @class PatternDetector
 * @example
 * const detector = new PatternDetector(3); // Require 3+ occurrences
 * detector.analyze({
 *   process: {items: [{id: 1, name: "A"}]},
 *   company: {items: [{id: 2, name: "B"}]},
 *   field: {items: [{id: 3, name: "C"}]}
 * });
 * const patterns = detector.getFrequentPatterns();
 * // Returns: [{signature: "id|name", keys: ["id", "name"], count: 3, name: "$0"}]
 */
export class PatternDetector {
  /**
   * Creates a new PatternDetector instance.
   *
   * @constructor
   * @param {number} [minOccurrences=3] - Minimum occurrences required to consider a pattern "frequent"
   *
   * @example
   * // Require 3+ occurrences (default)
   * new PatternDetector();
   *
   * // Require 2+ occurrences (more aggressive)
   * new PatternDetector(2);
   */
  constructor(minOccurrences = 3) {
    this.minOccurrences = minOccurrences; // Only create refs for patterns appearing N+ times

    /** @type {Map<string, {keys: string[], count: number, locations: string[]}>} */
    this.patterns = new Map(); // signature -> { keys, count, locations }
  }

  /**
   * Analyzes an entire JSON tree to find repeated array patterns.
   *
   * Performs a depth-first traversal of the data structure, identifying
   * uniform object arrays and tracking their key signatures. Records the
   * frequency and location of each pattern for later reference generation.
   *
   * @param {*} data - JSON-serializable data to analyze
   * @param {Array<string>} [path=[]] - Current path in the data tree (for tracking locations)
   *
   * @example
   * const detector = new PatternDetector();
   * detector.analyze({
   *   users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}],
   *   admins: [{id: 3, name: "Charlie"}]
   * });
   * // Detects pattern {id, name} appears 2 times across users and admins
   */
  analyze(data, path = []) {
    if (Array.isArray(data)) {
      // Check if this is a uniform object array
      if (this._isUniformObjectArray(data)) {
        const keys = Object.keys(data[0]).sort();
        const signature = this._createSignature(keys);

        this._recordPattern(signature, keys, path);

        // Recurse into each object
        data.forEach((obj, idx) => {
          for (const key of keys) {
            this.analyze(obj[key], [...path, `[${idx}]`, key]);
          }
        });
      } else {
        // Non-uniform array - recurse into each element
        data.forEach((item, idx) => {
          this.analyze(item, [...path, `[${idx}]`]);
        });
      }
    } else if (data && typeof data === "object") {
      // Regular object - recurse into properties
      for (const [key, value] of Object.entries(data)) {
        this.analyze(value, [...path, key]);
      }
    }
    // Primitives - no action needed
  }

  /**
   * Returns patterns that appear frequently enough to warrant references.
   *
   * Filters patterns by minimum occurrence threshold and sorts by frequency.
   * Automatically generates reference names ($0, $1, $2, etc.) for each pattern.
   *
   * @returns {Array<{signature: string, keys: string[], count: number, name: string}>}
   *          Array of frequent patterns with metadata
   *
   * @example
   * const patterns = detector.getFrequentPatterns();
   * // Returns:
   * // [
   * //   {signature: "id|name|email", keys: ["id", "name", "email"], count: 5, name: "$0"},
   * //   {signature: "status|value", keys: ["status", "value"], count: 3, name: "$1"}
   * // ]
   */
  getFrequentPatterns() {
    const frequent = [];

    for (const [signature, info] of this.patterns.entries()) {
      if (info.count >= this.minOccurrences) {
        frequent.push({
          signature,
          keys: info.keys,
          count: info.count,
          name: `$${frequent.length}`, // Auto-generate ref names
        });
      }
    }

    // Sort by count (most frequent first)
    frequent.sort((a, b) => b.count - a.count);

    return frequent;
  }

  /**
   * Creates a unique signature for a set of keys.
   *
   * The signature is a pipe-delimited string of sorted keys, used to
   * identify identical patterns regardless of key order in the source data.
   *
   * @private
   * @param {string[]} keys - Array of object keys
   * @returns {string} Pipe-delimited signature
   *
   * @example
   * _createSignature(["name", "id"]) → "id|name"
   * _createSignature(["id", "email", "age"]) → "age|email|id"
   */
  _createSignature(keys) {
    return keys.join("|");
  }

  /**
   * Records a pattern occurrence with its location.
   *
   * Updates the pattern's frequency counter and tracks where it appears
   * in the data tree. Creates a new pattern entry if this is the first occurrence.
   *
   * @private
   * @param {string} signature - Pattern signature
   * @param {string[]} keys - Array of object keys
   * @param {Array<string>} path - Current path in the data tree
   */
  _recordPattern(signature, keys, path) {
    if (!this.patterns.has(signature)) {
      this.patterns.set(signature, {
        keys,
        count: 0,
        locations: [],
      });
    }

    const pattern = this.patterns.get(signature);
    pattern.count++;
    pattern.locations.push(path.join("."));
  }

  /**
   * Checks if an array contains uniform objects.
   *
   * An array is considered uniform if:
   * 1. All elements are non-null objects (not arrays)
   * 2. All objects have exactly the same keys (structure)
   *
   * @private
   * @param {Array} arr - Array to check
   * @returns {boolean} True if array contains uniform objects
   *
   * @example
   * _isUniformObjectArray([{id: 1, name: "A"}, {id: 2, name: "B"}]) → true
   * _isUniformObjectArray([{id: 1}, {name: "A"}]) → false
   * _isUniformObjectArray([1, 2, 3]) → false
   */
  _isUniformObjectArray(arr) {
    if (arr.length === 0) return false;

    // All must be non-null objects
    if (
      !arr.every(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      )
    ) {
      return false;
    }

    // All must have same keys
    const firstKeys = Object.keys(arr[0]).sort().join("|");
    return arr.every(
      (item) => Object.keys(item).sort().join("|") === firstKeys,
    );
  }

  /**
   * Returns statistics about detected patterns.
   *
   * Provides a summary of pattern detection results including:
   * - Total number of unique patterns found
   * - Number of patterns meeting frequency threshold
   * - Total pattern occurrences across all data
   * - Details for each frequent pattern
   *
   * @returns {{totalPatterns: number, frequentPatterns: number, totalOccurrences: number, details: Array}}
   *          Pattern detection statistics
   *
   * @example
   * const stats = detector.getStats();
   * // Returns:
   * // {
   * //   totalPatterns: 5,
   * //   frequentPatterns: 2,
   * //   totalOccurrences: 15,
   * //   details: [
   * //     {keys: ["id", "name"], count: 8, sample: "users"},
   * //     {keys: ["status", "value"], count: 3, sample: "config.items"}
   * //   ]
   * // }
   */
  getStats() {
    const stats = {
      totalPatterns: this.patterns.size,
      frequentPatterns: 0,
      totalOccurrences: 0,
      details: [],
    };

    for (const [signature, info] of this.patterns.entries()) {
      stats.totalOccurrences += info.count;

      if (info.count >= this.minOccurrences) {
        stats.frequentPatterns++;
        stats.details.push({
          keys: info.keys,
          count: info.count,
          sample: info.locations[0],
        });
      }
    }

    return stats;
  }
}
