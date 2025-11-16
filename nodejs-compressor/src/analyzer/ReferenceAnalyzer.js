/**
 * @fileoverview Reference Analyzer for ASON 2.0
 *
 * Analyzes JSON data to detect repeated values and creates semantic references ($var).
 * Replaces numeric references (#0, #1) with meaningful variable names.
 *
 * @module ReferenceAnalyzer
 * @license MIT
 * @version 2.0.0
 */

/**
 * Analyzes data for repeated values and generates references.
 *
 * @class ReferenceAnalyzer
 *
 * @example
 * const analyzer = new ReferenceAnalyzer({ minOccurrences: 2 });
 * const references = analyzer.analyze(data);
 * // references = { '$email': 'user@example.com', '$phone': '+1-555-0123' }
 */
export class ReferenceAnalyzer {
  /**
   * Creates a new ReferenceAnalyzer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.minOccurrences=2] - Minimum occurrences to create reference
   * @param {number} [options.minLength=5] - Minimum string length to consider
   * @param {number} [options.maxReferences=50] - Maximum number of references to create
   */
  constructor(options = {}) {
    this.minOccurrences = options.minOccurrences ?? 2;
    this.minLength = options.minLength ?? 5;
    this.maxReferences = options.maxReferences ?? 50;
  }

  /**
   * Analyzes data and generates reference map.
   *
   * @param {*} data - Data to analyze
   * @returns {Map<string, string>} Map of reference names to values
   *
   * @example
   * analyze({
   *   billing: { email: 'user@ex.com' },
   *   shipping: { email: 'user@ex.com' }
   * })
   * // Returns: Map { '$email' => 'user@ex.com' }
   */
  analyze(data) {
    // Collect all string values and their frequencies
    const valueCounts = new Map();
    const valueContext = new Map(); // Track where values appear

    this.collectValues(data, valueCounts, valueContext);

    // Calculate savings for each candidate
    const candidates = [];

    for (const [value, count] of valueCounts.entries()) {
      if (count < this.minOccurrences) continue;
      if (value.length < this.minLength) continue;

      // Skip values that start with ASON special characters
      // These would cause confusion when serialized as references
      if (value.startsWith('$') || value.startsWith('&') ||
          value.startsWith('#') || value.startsWith('@')) {
        continue;
      }

      // Calculate token savings
      const savings = this.calculateSavings(value, count);

      if (savings > 0) {
        candidates.push({
          value,
          count,
          savings,
          contexts: valueContext.get(value) || []
        });
      }
    }

    // Sort by savings (highest first)
    candidates.sort((a, b) => b.savings - a.savings);

    // Generate references for top candidates
    const references = new Map();
    const limit = Math.min(candidates.length, this.maxReferences);

    for (let i = 0; i < limit; i++) {
      const candidate = candidates[i];
      const refName = this.generateReferenceName(candidate, i);
      references.set(refName, candidate.value);
    }

    return references;
  }

  /**
   * Recursively collects string values from data.
   *
   * @private
   * @param {*} data - Data to scan
   * @param {Map<string, number>} valueCounts - Accumulator for value counts
   * @param {Map<string, string[]>} valueContext - Accumulator for value contexts
   * @param {string} [path=''] - Current path in data tree
   */
  collectValues(data, valueCounts, valueContext, path = '') {
    if (typeof data === 'string') {
      if (data.length >= this.minLength) {
        valueCounts.set(data, (valueCounts.get(data) || 0) + 1);

        if (!valueContext.has(data)) {
          valueContext.set(data, []);
        }
        valueContext.get(data).push(path);
      }
    } else if (Array.isArray(data)) {
      data.forEach((item, i) => {
        this.collectValues(item, valueCounts, valueContext, `${path}[${i}]`);
      });
    } else if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        const newPath = path ? `${path}.${key}` : key;
        this.collectValues(value, valueCounts, valueContext, newPath);
      }
    }
  }

  /**
   * Calculates token savings for creating a reference.
   *
   * @private
   * @param {string} value - String value
   * @param {number} count - Number of occurrences
   * @returns {number} Estimated token savings
   */
  calculateSavings(value, count) {
    // Estimate tokens (rough approximation: 1 token per 4 characters)
    const valueTokens = Math.ceil(value.length / 4);

    // Reference name tokens (e.g., "$email" ~= 2 tokens)
    const refTokens = 2;

    // Total original: value repeated count times
    const originalTokens = valueTokens * count;

    // With reference: value once + ref name * count
    const withRefTokens = valueTokens + (refTokens * count);

    return originalTokens - withRefTokens;
  }

  /**
   * Generates a semantic reference name based on context.
   *
   * @private
   * @param {Object} candidate - Candidate object
   * @param {string} candidate.value - String value
   * @param {string[]} candidate.contexts - Context paths where value appears
   * @param {number} fallbackIndex - Fallback index if no good name found
   * @returns {string} Reference name (with $ prefix)
   */
  generateReferenceName(candidate, fallbackIndex) {
    const { value, contexts } = candidate;

    // Try to infer name from context
    const inferredName = this.inferNameFromContext(contexts);
    if (inferredName) {
      return '$' + inferredName;
    }

    // Try to infer from value content
    const contentName = this.inferNameFromValue(value);
    if (contentName) {
      return '$' + contentName;
    }

    // Fallback to indexed name
    return '$val' + fallbackIndex;
  }

  /**
   * Infers a variable name from usage contexts.
   *
   * @private
   * @param {string[]} contexts - Context paths
   * @returns {string|null} Inferred name or null
   *
   * @example
   * inferNameFromContext(['billing.email', 'shipping.email'])
   * // Returns: 'email'
   */
  inferNameFromContext(contexts) {
    if (contexts.length === 0) return null;

    // Extract last part of each path
    const parts = contexts.map(ctx => {
      const segments = ctx.split(/[\.\[\]]/);
      return segments.filter(s => s && s !== '').pop();
    });

    // Find most common part
    const frequency = new Map();
    for (const part of parts) {
      if (part && /^[a-zA-Z]/.test(part)) {
        frequency.set(part, (frequency.get(part) || 0) + 1);
      }
    }

    if (frequency.size === 0) return null;

    // Return most frequent
    let maxCount = 0;
    let bestName = null;

    for (const [name, count] of frequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestName = name;
      }
    }

    return bestName;
  }

  /**
   * Infers a variable name from value content.
   *
   * @private
   * @param {string} value - String value
   * @returns {string|null} Inferred name or null
   *
   * @example
   * inferNameFromValue('user@example.com') // 'email'
   * inferNameFromValue('+1-555-0123') // 'phone'
   * inferNameFromValue('https://api.example.com') // 'url'
   */
  inferNameFromValue(value) {
    // Email pattern
    if (/@/.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }

    // Phone pattern
    if (/^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10) {
      return 'phone';
    }

    // URL pattern
    if (/^https?:\/\//.test(value)) {
      return 'url';
    }

    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'id';
    }

    // Date pattern
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }

    return null;
  }

  /**
   * Replaces values in data with reference placeholders.
   *
   * @param {*} data - Data to process
   * @param {Map<string, string>} references - Reference map
   * @returns {*} Data with references replaced
   */
  replaceWithReferences(data, references) {
    // Create reverse map: value -> ref name
    const valueToRef = new Map();
    for (const [refName, value] of references.entries()) {
      valueToRef.set(value, refName);
    }

    return this.replaceRecursive(data, valueToRef);
  }

  /**
   * Recursively replaces values with references.
   *
   * @private
   * @param {*} data - Data to process
   * @param {Map<string, string>} valueToRef - Value to reference name map
   * @returns {*} Processed data
   */
  replaceRecursive(data, valueToRef) {
    if (typeof data === 'string') {
      return valueToRef.get(data) || data;
    } else if (Array.isArray(data)) {
      return data.map(item => this.replaceRecursive(item, valueToRef));
    } else if (data && typeof data === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.replaceRecursive(value, valueToRef);
      }
      return result;
    }

    return data;
  }
}
