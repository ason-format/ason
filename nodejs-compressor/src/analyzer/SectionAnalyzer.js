/**
 * @fileoverview Section Analyzer for ASON 2.0
 *
 * Analyzes object structure to determine when to use @section vs dot notation.
 * Optimizes for token efficiency: uses @section only when it saves tokens.
 *
 * @module SectionAnalyzer
 * @license MIT
 * @version 2.0.0
 */

/**
 * Analyzes data structure for optimal section organization.
 *
 * @class SectionAnalyzer
 *
 * @example
 * const analyzer = new SectionAnalyzer({ minFieldsForSection: 3 });
 * const plan = analyzer.analyze(data);
 * // plan = { useSections: ['customer', 'order'], useDotNotation: ['metadata'] }
 */
export class SectionAnalyzer {
  /**
   * Creates a new SectionAnalyzer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.minFieldsForSection=3] - Minimum fields to use @section
   * @param {number} [options.maxDepth=3] - Maximum nesting depth to analyze
   */
  constructor(options = {}) {
    this.minFieldsForSection = options.minFieldsForSection ?? 3;
    this.maxDepth = options.maxDepth ?? 3;
  }

  /**
   * Analyzes data and creates section organization plan.
   *
   * @param {Object} data - Data to analyze
   * @returns {SectionPlan} Organization plan
   *
   * @example
   * analyze({
   *   customer: { name: 'John', email: 'j@ex.com', phone: '555-0123', tier: 'gold' },
   *   metadata: { source: 'web' }
   * })
   * // Returns:
   * // {
   * //   sections: [{ path: 'customer', fieldCount: 4, useSection: true }],
   * //   dotNotation: [{ path: 'metadata', fieldCount: 1, useSection: false }]
   * // }
   */
  analyze(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { sections: [], dotNotation: [] };
    }

    const analysis = [];

    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const info = this.analyzeObject(key, value, 1);
        analysis.push(info);
      }
    }

    // Separate sections from dot notation
    const sections = analysis.filter(a => a.useSection);
    const dotNotation = analysis.filter(a => !a.useSection);

    return { sections, dotNotation };
  }

  /**
   * Analyzes a single object to determine if it should be a section.
   *
   * @private
   * @param {string} path - Object path
   * @param {Object} obj - Object to analyze
   * @param {number} depth - Current depth
   * @returns {Object} Analysis result
   */
  analyzeObject(path, obj, depth) {
    const fieldCount = this.countLeafFields(obj);
    const tokenSavings = this.calculateSectionSavings(path, fieldCount);

    return {
      path,
      fieldCount,
      depth,
      useSection: tokenSavings > 0 && fieldCount >= this.minFieldsForSection,
      tokenSavings,
      hasNestedObjects: this.hasNestedObjects(obj)
    };
  }

  /**
   * Counts leaf (non-object) fields in an object tree.
   *
   * @private
   * @param {Object} obj - Object to count
   * @param {number} [depth=0] - Current depth
   * @returns {number} Leaf field count
   */
  countLeafFields(obj, depth = 0) {
    if (depth > this.maxDepth) return 0;

    let count = 0;

    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Nested object - recurse
        count += this.countLeafFields(value, depth + 1);
      } else {
        // Leaf field
        count++;
      }
    }

    return count;
  }

  /**
   * Checks if object has nested objects.
   *
   * @private
   * @param {Object} obj - Object to check
   * @returns {boolean} True if has nested objects
   */
  hasNestedObjects(obj) {
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates token savings of using @section vs dot notation.
   *
   * @private
   * @param {string} path - Section path
   * @param {number} fieldCount - Number of fields
   * @returns {number} Estimated token savings (positive = section saves tokens)
   *
   * @example
   * // For path='customer' with 4 fields:
   * // Dot notation: customer.name + customer.email + customer.phone + customer.tier
   * //   = (customer + . = ~3 tokens) * 4 fields = ~12 tokens for prefixes
   * // Section: @customer + newline = ~2 tokens overhead
   * // Savings: 12 - 2 = 10 tokens saved
   */
  calculateSectionSavings(path, fieldCount) {
    // Estimate tokens for path (rough: 1 token per 4 chars)
    const pathTokens = Math.ceil(path.length / 4);

    // Dot notation cost: (path + dot) per field
    const dotNotationCost = (pathTokens + 0.5) * fieldCount;

    // Section cost: @path + newline (overhead)
    const sectionCost = pathTokens + 1;

    // Savings = cost of dot notation - cost of section
    return dotNotationCost - sectionCost;
  }

  /**
   * Organizes data into sections based on analysis.
   *
   * @param {Object} data - Data to organize
   * @param {SectionPlan} plan - Organization plan from analyze()
   * @returns {Object} Organized data
   */
  organize(data, plan) {
    const organized = {
      sections: {},
      root: {}
    };

    // Paths that should be sections
    const sectionPaths = new Set(plan.sections.map(s => s.path));

    for (const [key, value] of Object.entries(data)) {
      if (sectionPaths.has(key)) {
        organized.sections[key] = value;
      } else {
        organized.root[key] = value;
      }
    }

    return organized;
  }

  /**
   * Flattens an object to dot notation.
   *
   * @param {Object} obj - Object to flatten
   * @param {string} [prefix=''] - Path prefix
   * @param {number} [maxDepth=3] - Maximum depth to flatten
   * @returns {Object} Flattened object
   *
   * @example
   * flattenToDotNotation({ user: { name: 'John', age: 30 } })
   * // Returns: { 'user.name': 'John', 'user.age': 30 }
   */
  flattenToDotNotation(obj, prefix = '', maxDepth = 3) {
    const result = {};

    const flatten = (current, path, depth) => {
      if (depth > maxDepth) {
        result[path] = current;
        return;
      }

      if (current && typeof current === 'object' && !Array.isArray(current)) {
        for (const [key, value] of Object.entries(current)) {
          const newPath = path ? `${path}.${key}` : key;
          flatten(value, newPath, depth + 1);
        }
      } else {
        result[path] = current;
      }
    };

    flatten(obj, prefix, 0);
    return result;
  }

  /**
   * Expands dot notation back to nested object.
   *
   * @param {Object} flat - Flattened object
   * @returns {Object} Nested object
   *
   * @example
   * expandDotNotation({ 'user.name': 'John', 'user.age': 30 })
   * // Returns: { user: { name: 'John', age: 30 } }
   */
  expandDotNotation(flat) {
    const result = {};

    for (const [path, value] of Object.entries(flat)) {
      const parts = path.split('.');
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;
    }

    return result;
  }

  /**
   * Gets statistics about section usage.
   *
   * @param {SectionPlan} plan - Organization plan
   * @returns {Object} Statistics
   */
  getStatistics(plan) {
    const totalSections = plan.sections.length + plan.dotNotation.length;
    const usingSections = plan.sections.length;
    const usingDotNotation = plan.dotNotation.length;

    const totalTokenSavings = plan.sections.reduce(
      (sum, s) => sum + s.tokenSavings,
      0
    );

    return {
      totalSections,
      usingSections,
      usingDotNotation,
      sectionPercentage: totalSections > 0
        ? (usingSections / totalSections) * 100
        : 0,
      estimatedTokenSavings: totalTokenSavings
    };
  }
}

/**
 * @typedef {Object} SectionPlan
 * @property {Array<Object>} sections - Sections to use @section for
 * @property {Array<Object>} dotNotation - Sections to use dot notation for
 */
