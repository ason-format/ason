/**
 * @fileoverview Tabular Array Analyzer for ASON 2.0
 *
 * Analyzes arrays to detect uniform structures suitable for tabular format.
 * Determines when to use compact @section [N]{fields} format vs regular arrays.
 *
 * @module TabularAnalyzer
 * @license MIT
 * @version 2.0.0
 */

/**
 * Analyzes arrays for tabular optimization.
 *
 * @class TabularAnalyzer
 *
 * @example
 * const analyzer = new TabularAnalyzer({ minRows: 2, minUniformity: 0.8 });
 * const result = analyzer.analyze(arrayData);
 * if (result.isTabular) {
 *   console.log(`Schema: ${result.schema.join('|')}`);
 * }
 */
export class TabularAnalyzer {
  /**
   * Creates a new TabularAnalyzer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.minRows=2] - Minimum rows to use tabular format
   * @param {number} [options.minUniformity=0.8] - Minimum uniformity ratio (0-1)
   * @param {number} [options.maxFields=20] - Maximum fields for tabular format
   */
  constructor(options = {}) {
    this.minRows = options.minRows ?? 2;
    this.minUniformity = options.minUniformity ?? 0.8;
    this.maxFields = options.maxFields ?? 20;
  }

  /**
   * Analyzes an array to determine if it's suitable for tabular format.
   *
   * @param {Array} array - Array to analyze
   * @returns {TabularAnalysis} Analysis result
   *
   * @example
   * analyze([
   *   { id: 1, name: 'Alice', age: 25 },
   *   { id: 2, name: 'Bob', age: 30 },
   *   { id: 3, name: 'Charlie', age: 35 }
   * ])
   * // Returns: {
   * //   isTabular: true,
   * //   schema: ['id', 'name', 'age'],
   * //   rowCount: 3,
   * //   uniformity: 1.0
   * // }
   */
  analyze(array) {
    // Basic checks
    if (!Array.isArray(array) || array.length < this.minRows) {
      return { isTabular: false, reason: 'Too few rows' };
    }

    // Check if all elements are objects
    const allObjects = array.every(
      item => item && typeof item === 'object' && !Array.isArray(item)
    );

    if (!allObjects) {
      return { isTabular: false, reason: 'Not all objects' };
    }

    // Analyze key signatures
    const { schema, uniformity } = this.analyzeSchema(array);

    // Check uniformity threshold
    if (uniformity < this.minUniformity) {
      return {
        isTabular: false,
        reason: `Low uniformity: ${uniformity.toFixed(2)}`,
        schema,
        uniformity
      };
    }

    // Check field count
    if (schema.length > this.maxFields) {
      return {
        isTabular: false,
        reason: `Too many fields: ${schema.length}`,
        schema
      };
    }

    // Check if all values are primitive (no nested objects/arrays)
    const allPrimitive = this.areAllValuesPrimitive(array, schema);

    if (!allPrimitive) {
      return {
        isTabular: false,
        reason: 'Contains nested objects/arrays',
        schema
      };
    }

    // Calculate token savings
    const savings = this.calculateTokenSavings(array, schema);

    return {
      isTabular: true,
      schema,
      rowCount: array.length,
      fieldCount: schema.length,
      uniformity,
      tokenSavings: savings,
      estimatedTokens: this.estimateTabularTokens(array, schema)
    };
  }

  /**
   * Analyzes array schema and uniformity.
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @returns {Object} Schema analysis
   */
  analyzeSchema(array) {
    // Count key signature frequencies
    const signatureCounts = new Map();
    const signatureKeys = new Map(); // Maps signature to UNSORTED keys (preserves order)

    for (const item of array) {
      const originalKeys = Object.keys(item); // Preserve original order
      const sortedKeys = [...originalKeys].sort(); // Sort only for signature comparison
      const signature = sortedKeys.join('|');

      signatureCounts.set(signature, (signatureCounts.get(signature) || 0) + 1);

      // Store original keys (unsorted) for the first occurrence of this signature
      if (!signatureKeys.has(signature)) {
        signatureKeys.set(signature, originalKeys);
      }
    }

    // Find most common signature
    let maxCount = 0;
    let bestSignature = '';

    for (const [sig, count] of signatureCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestSignature = sig;
      }
    }

    const schema = signatureKeys.get(bestSignature) || [];
    const uniformity = maxCount / array.length;

    return { schema, uniformity };
  }

  /**
   * Checks if all values in array are primitive (suitable for tabular).
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @param {string[]} schema - Field names
   * @returns {boolean} True if all primitive
   */
  areAllValuesPrimitive(array, schema) {
    return array.every(obj =>
      schema.every(field => {
        const value = obj[field];
        return value === null ||
               value === undefined ||
               typeof value === 'string' ||
               typeof value === 'number' ||
               typeof value === 'boolean';
      })
    );
  }

  /**
   * Calculates token savings of using tabular format.
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @param {string[]} schema - Field names
   * @returns {number} Estimated token savings
   */
  calculateTokenSavings(array, schema) {
    // Regular JSON format tokens
    const jsonTokens = this.estimateJSONTokens(array);

    // Tabular ASON format tokens
    const tabularTokens = this.estimateTabularTokens(array, schema);

    return jsonTokens - tabularTokens;
  }

  /**
   * Estimates tokens for JSON array format.
   *
   * @private
   * @param {Array<Object>} array - Array
   * @returns {number} Estimated tokens
   */
  estimateJSONTokens(array) {
    const json = JSON.stringify(array);
    // Rough estimate: 1 token per 4 characters
    return Math.ceil(json.length / 4);
  }

  /**
   * Estimates tokens for ASON tabular format.
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @param {string[]} schema - Field names
   * @returns {number} Estimated tokens
   */
  estimateTabularTokens(array, schema) {
    // Schema line: [N]{field1,field2,...}
    const schemaStr = `[${array.length}]{${schema.join(',')}}`;
    let tokens = Math.ceil(schemaStr.length / 4);

    // Data rows: val1|val2|val3
    for (const obj of array) {
      const rowValues = schema.map(field => String(obj[field] ?? ''));
      const rowStr = rowValues.join('|');
      tokens += Math.ceil(rowStr.length / 4);
    }

    return tokens;
  }

  /**
   * Finds all arrays in data recursively.
   *
   * @param {*} data - Data to scan
   * @param {string} [path=''] - Current path
   * @returns {Array<Object>} Array locations and metadata
   *
   * @example
   * findArrays({
   *   users: [{ id: 1 }, { id: 2 }],
   *   nested: { items: [{ x: 1 }] }
   * })
   * // Returns: [
   * //   { path: 'users', array: [...], analysis: {...} },
   * //   { path: 'nested.items', array: [...], analysis: {...} }
   * // ]
   */
  findArrays(data, path = '') {
    const arrays = [];

    if (Array.isArray(data)) {
      const analysis = this.analyze(data);
      arrays.push({ path, array: data, analysis });
    } else if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        const newPath = path ? `${path}.${key}` : key;
        arrays.push(...this.findArrays(value, newPath));
      }
    }

    return arrays;
  }

  /**
   * Filters arrays suitable for tabular format.
   *
   * @param {Array<Object>} arrayInfos - Array information from findArrays()
   * @returns {Array<Object>} Filtered tabular-suitable arrays
   */
  filterTabular(arrayInfos) {
    return arrayInfos.filter(info => info.analysis.isTabular);
  }

  /**
   * Gets statistics about tabular optimization potential.
   *
   * @param {*} data - Data to analyze
   * @returns {Object} Statistics
   */
  getStatistics(data) {
    const allArrays = this.findArrays(data);
    const tabularArrays = this.filterTabular(allArrays);

    const totalTokenSavings = tabularArrays.reduce(
      (sum, info) => sum + info.analysis.tokenSavings,
      0
    );

    return {
      totalArrays: allArrays.length,
      tabularArrays: tabularArrays.length,
      tabularPercentage: allArrays.length > 0
        ? (tabularArrays.length / allArrays.length) * 100
        : 0,
      estimatedTokenSavings: totalTokenSavings,
      arrayPaths: tabularArrays.map(info => info.path)
    };
  }
}

/**
 * @typedef {Object} TabularAnalysis
 * @property {boolean} isTabular - Whether array is suitable for tabular format
 * @property {string} [reason] - Reason if not tabular
 * @property {string[]} [schema] - Field names (schema)
 * @property {number} [rowCount] - Number of rows
 * @property {number} [fieldCount] - Number of fields
 * @property {number} [uniformity] - Uniformity ratio (0-1)
 * @property {number} [tokenSavings] - Estimated token savings
 * @property {number} [estimatedTokens] - Estimated tokens for tabular format
 */
