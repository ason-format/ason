/**
 * @fileoverview ASON 2.0 Serializer
 *
 * Converts JavaScript data structures into ASON 2.0 format string.
 * Uses analysis from ReferenceAnalyzer, SectionAnalyzer, and TabularAnalyzer
 * to generate optimized output.
 *
 * @module Serializer
 * @license MIT
 * @version 2.0.0
 */

/**
 * Serializes data to ASON 2.0 format.
 *
 * @class Serializer
 *
 * @example
 * const serializer = new Serializer({ indent: 2 });
 * const ason = serializer.serialize(data, references, sectionPlan, tabularArrays);
 */
export class Serializer {
  /**
   * Creates a new Serializer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.indent=1] - Spaces per indentation level
   * @param {string} [options.delimiter='|'] - Field delimiter for tabular arrays
   */
  constructor(options = {}) {
    this.indent = Math.max(1, options.indent ?? 1);
    this.delimiter = options.delimiter ?? '|';
  }

  /**
   * Serializes data to ASON 2.0 format.
   *
   * @param {*} data - Data to serialize
   * @param {Map<string, *>} [references=new Map()] - Reference definitions
   * @param {Object} [sectionPlan=null] - Section organization plan
   * @param {Map<string, Object>} [tabularArrays=new Map()] - Tabular array info
   * @returns {string} ASON 2.0 formatted string
   */
  serialize(data, references = new Map(), sectionPlan = null, tabularArrays = new Map()) {
    this.references = references;
    this.sectionPlan = sectionPlan;
    this.tabularArrays = tabularArrays;

    // Create reverse reference map (value → reference name)
    this.valueToRef = new Map();
    for (const [refName, value] of references.entries()) {
      this.valueToRef.set(this.normalizeValue(value), refName);
    }

    let output = '';

    // Serialize $def: section if we have references
    if (references.size > 0) {
      output += this.serializeDefinitions(references);
      output += '\n';
    }

    // Serialize data
    const dataStr = this.serializeValue(data, 0, '');

    // Wrap in $data: if we have definitions
    if (references.size > 0) {
      output += '$data:\n';
      output += dataStr;
    } else {
      output += dataStr;
    }

    // Clean up trailing newlines
    return output.replace(/\n+$/, '');
  }

  /**
   * Serializes the $def: section.
   *
   * @private
   * @param {Map<string, *>} references - Reference map
   * @returns {string} Serialized definitions
   */
  serializeDefinitions(references) {
    let output = '$def:\n';

    for (const [refName, value] of references.entries()) {
      // Don't use serializeValue here as it would treat values as references
      // Instead, directly serialize the actual value
      const valueStr = this.serializeDefinitionValue(value);
      output += this._sp(1) + refName + ':' + valueStr + '\n';
    }

    return output;
  }

  /**
   * Serializes a value for the $def: section (no reference lookups).
   *
   * @private
   * @param {*} value - Value to serialize
   * @returns {string} Serialized value
   */
  serializeDefinitionValue(value) {
    // Null
    if (value === null || value === undefined) {
      return 'null';
    }

    // Boolean
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    // Number
    if (typeof value === 'number') {
      return String(value);
    }

    // String
    if (typeof value === 'string') {
      return this.serializeString(value);
    }

    // For objects/arrays, use normal serialization (but won't be common in definitions)
    return JSON.stringify(value);
  }

  /**
   * Serializes a value (dispatches to appropriate serializer).
   *
   * @private
   * @param {*} value - Value to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path in data tree
   * @returns {string} Serialized value
   */
  serializeValue(value, level, path) {
    // Check if this value is a reference
    const refName = this.valueToRef.get(this.normalizeValue(value));
    if (refName && typeof value === 'string') {
      return refName;
    }

    // Null
    if (value === null || value === undefined) {
      return 'null';
    }

    // Boolean
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    // Number
    if (typeof value === 'number') {
      return String(value);
    }

    // String
    if (typeof value === 'string') {
      return this.serializeString(value);
    }

    // Array
    if (Array.isArray(value)) {
      // Check if this array should be tabular
      const tabularInfo = this.tabularArrays.get(path);
      if (tabularInfo && tabularInfo.isTabular) {
        return this.serializeTabularArray(value, tabularInfo, level);
      }

      return this.serializeArray(value, level, path);
    }

    // Object
    if (typeof value === 'object') {
      return this.serializeObject(value, level, path);
    }

    return String(value);
  }

  /**
   * Serializes a string value.
   *
   * @private
   * @param {string} str - String to serialize
   * @returns {string} Serialized string
   */
  serializeString(str) {
    // Escape strings that need quoting
    if (this.needsQuotes(str)) {
      return JSON.stringify(str);
    }
    return str;
  }

  /**
   * Checks if a string needs quotes.
   *
   * @private
   * @param {string} str - String to check
   * @returns {boolean} True if needs quotes
   */
  needsQuotes(str) {
    // Quote if empty
    if (str === '') return true;

    // Quote reserved keywords
    if (str === 'null' || str === 'true' || str === 'false') return true;

    // Quote if starts with digit
    if (/^-?\d/.test(str)) return true;

    // Quote if starts with ASON special characters or slash
    if (/^[@$&#\[\{\/]/.test(str)) return true;

    // Quote if contains special characters
    if (/[\n\r\t|:\s\-\.\,\{\}\[\]"\/]/.test(str)) return true;

    // Quote if it's reserved syntax
    if (str === '[]' || str === '{}') return true;

    // Quote if contains non-ASCII characters (Unicode, emoji, etc)
    if (!/^[\x20-\x7E]*$/.test(str)) return true;

    return false;
  }

  /**
   * Serializes an array.
   *
   * @private
   * @param {Array} arr - Array to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized array
   */
  serializeArray(arr, level, path) {
    if (arr.length === 0) return '[]';

    // Check if all elements are primitives
    const allPrimitive = arr.every(item =>
      item === null ||
      typeof item !== 'object'
    );

    if (allPrimitive) {
      // Inline array: [val1,val2,val3]
      const items = arr.map(item => this.serializeValue(item, level, path));
      return '[' + items.join(',') + ']';
    }

    // Multi-line array with - prefix
    let output = '\n';
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const itemPath = `${path}[${i}]`;
      const itemStr = this.serializeValue(item, level + 1, itemPath);

      output += this._sp(level) + '-';

      if (itemStr.startsWith('\n')) {
        // Multi-line object/array: keep newline after dash
        output += itemStr;
      } else {
        // Inline value: add space after dash
        output += ' ' + itemStr;
      }

      output += '\n';
    }

    return output.trimEnd();
  }

  /**
   * Serializes a tabular array.
   *
   * @private
   * @param {Array<Object>} arr - Array of objects
   * @param {Object} tabularInfo - Tabular analysis info
   * @param {number} level - Indentation level
   * @returns {string} Serialized tabular array
   */
  serializeTabularArray(arr, tabularInfo, level) {
    const { schema } = tabularInfo;

    // Schema line: [N]{field1,field2,...}
    let output = `[${arr.length}]{${schema.join(',')}}`;
    output += '\n';

    // Data rows
    for (const obj of arr) {
      const values = schema.map(field => {
        const value = obj[field];
        return this.serializeTabularValue(value);
      });

      output += this._sp(level) + values.join(this.delimiter) + '\n';
    }

    return output.trimEnd();
  }

  /**
   * Serializes a value for tabular context (CSV-like).
   *
   * @private
   * @param {*} value - Value to serialize
   * @returns {string} Serialized value
   */
  serializeTabularValue(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);

    if (typeof value === 'string') {
      // Check for reference
      const refName = this.valueToRef.get(value);
      if (refName) return refName;

      // Quote if contains delimiter or special chars
      if (
        value.includes(this.delimiter) ||
        value.includes('\n') ||
        value.includes('"') ||
        this.needsQuotes(value)
      ) {
        return JSON.stringify(value);
      }
      return value;
    }

    // Complex types in tabular context
    return JSON.stringify(value);
  }

  /**
   * Serializes an object.
   *
   * @private
   * @param {Object} obj - Object to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized object
   */
  serializeObject(obj, level, path) {
    if (Object.keys(obj).length === 0) return '{}';

    // Check if this should be sections
    const useSections = this.sectionPlan && level === 0;

    if (useSections) {
      return this.serializeWithSections(obj, level, path);
    }

    // Regular object serialization
    let output = level === 0 ? '' : '\n';

    for (const [key, value] of Object.entries(obj)) {
      const valuePath = path ? `${path}.${key}` : key;

      // Check if value should be tabular
      const tabularInfo = this.tabularArrays.get(valuePath);
      const isTabular = tabularInfo?.isTabular;

      output += this._sp(level);

      // Escape key if needed
      const serializedKey = this.needsQuotes(key) ? JSON.stringify(key) : key;
      output += serializedKey + ':';

      if (isTabular && Array.isArray(value)) {
        output += this.serializeTabularArray(value, tabularInfo, level + 1);
      } else {
        const valueStr = this.serializeValue(value, level + 1, valuePath);

        if (valueStr.startsWith('\n')) {
          output += valueStr;
        } else {
          output += valueStr;
        }
      }

      output += '\n';
    }

    return output.trimEnd();
  }

  /**
   * Serializes object with section organization.
   *
   * @private
   * @param {Object} obj - Object to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized object with sections
   */
  serializeWithSections(obj, level, path) {
    let output = '';

    const { sections, dotNotation } = this.sectionPlan;
    const sectionPaths = new Set(sections.map(s => s.path));

    // Serialize sections
    for (const [key, value] of Object.entries(obj)) {
      if (sectionPaths.has(key)) {
        output += this.serializeSection(key, value, level, path);
        output += '\n\n';
      }
    }

    // Serialize dot notation fields
    for (const [key, value] of Object.entries(obj)) {
      if (!sectionPaths.has(key)) {
        const valuePath = path ? `${path}.${key}` : key;
        const flatKey = this.needsQuotes(key) ? JSON.stringify(key) : key;

        // Flatten if object
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const flattened = this.flattenObject(value, key);
          for (const [flatKey, flatValue] of Object.entries(flattened)) {
            output += flatKey + ':' + this.serializeValue(flatValue, level, valuePath) + '\n';
          }
        } else {
          output += flatKey + ':' + this.serializeValue(value, level, valuePath) + '\n';
        }
      }
    }

    return output.trimEnd();
  }

  /**
   * Serializes a section.
   *
   * @private
   * @param {string} name - Section name
   * @param {*} value - Section value
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized section
   */
  serializeSection(name, value, level, path) {
    const valuePath = path ? `${path}.${name}` : name;

    // Check if section value is tabular array
    const tabularInfo = this.tabularArrays.get(valuePath);

    let output = '@' + name;

    if (tabularInfo?.isTabular && Array.isArray(value)) {
      // @section [N]{fields}
      output += ' ' + this.serializeTabularArray(value, tabularInfo, level + 1);
    } else if (Array.isArray(value)) {
      // @section with array
      output += '\n' + this.serializeArray(value, level + 1, valuePath);
    } else if (value && typeof value === 'object') {
      // @section with object properties
      output += '\n';
      for (const [key, val] of Object.entries(value)) {
        const keyPath = `${valuePath}.${key}`;
        const serializedKey = this.needsQuotes(key) ? JSON.stringify(key) : key;
        const serializedValue = this.serializeValue(val, level + 2, keyPath);

        output += this._sp(level + 1) + serializedKey + ':' + serializedValue + '\n';
      }
      output = output.trimEnd();
    } else {
      // Section with primitive value
      output += ':' + this.serializeValue(value, level, valuePath);
    }

    return output;
  }

  /**
   * Flattens an object to dot notation.
   *
   * @private
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Key prefix
   * @returns {Object} Flattened object
   */
  flattenObject(obj, prefix) {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}.${key}`;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }

    return result;
  }

  /**
   * Normalizes a value for comparison (for reference matching).
   *
   * @private
   * @param {*} value - Value to normalize
   * @returns {string} Normalized value
   */
  normalizeValue(value) {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  /**
   * Generates indentation string.
   *
   * @private
   * @param {number} level - Indentation level
   * @returns {string} Indentation spaces
   */
  _sp(level) {
    return ' '.repeat(this.indent * level);
  }
}
