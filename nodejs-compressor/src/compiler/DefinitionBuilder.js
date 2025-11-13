/**
 * @fileoverview Definition Builder for ASON 2.0
 *
 * Builds the $def: section with variable and object references.
 * Organizes definitions for optimal readability and token efficiency.
 *
 * @module DefinitionBuilder
 * @license MIT
 * @version 2.0.0
 */

/**
 * Builds the $def: section for ASON 2.0 documents.
 *
 * @class DefinitionBuilder
 *
 * @example
 * const builder = new DefinitionBuilder();
 * builder.addVariable('$email', 'user@example.com');
 * builder.addObject('&address', { city: 'NYC', zip: '10001' });
 * const defSection = builder.build();
 */
export class DefinitionBuilder {
  /**
   * Creates a new DefinitionBuilder.
   *
   * @constructor
   */
  constructor() {
    /** @type {Map<string, *>} Variable definitions */
    this.variables = new Map();

    /** @type {Map<string, Object>} Object definitions */
    this.objects = new Map();

    /** @type {Map<string, *>} Numeric definitions (legacy) */
    this.numeric = new Map();
  }

  /**
   * Adds a variable definition.
   *
   * @param {string} name - Variable name (with $ prefix)
   * @param {*} value - Variable value
   * @returns {DefinitionBuilder} This builder (for chaining)
   *
   * @example
   * builder.addVariable('$email', 'user@example.com');
   */
  addVariable(name, value) {
    if (!name.startsWith('$')) {
      throw new Error(`Variable name must start with $: ${name}`);
    }
    this.variables.set(name, value);
    return this;
  }

  /**
   * Adds an object definition.
   *
   * @param {string} name - Object name (with & prefix)
   * @param {Object} value - Object value
   * @returns {DefinitionBuilder} This builder (for chaining)
   *
   * @example
   * builder.addObject('&address', { city: 'NYC', zip: '10001' });
   */
  addObject(name, value) {
    if (!name.startsWith('&')) {
      throw new Error(`Object name must start with &: ${name}`);
    }
    this.objects.set(name, value);
    return this;
  }

  /**
   * Adds a numeric definition (legacy).
   *
   * @param {string} name - Numeric name (with # prefix)
   * @param {*} value - Value
   * @returns {DefinitionBuilder} This builder (for chaining)
   */
  addNumeric(name, value) {
    if (!name.startsWith('#')) {
      throw new Error(`Numeric name must start with #: ${name}`);
    }
    this.numeric.set(name, value);
    return this;
  }

  /**
   * Adds definitions from a Map or object.
   *
   * @param {Map<string, *>|Object} definitions - Definitions to add
   * @returns {DefinitionBuilder} This builder (for chaining)
   *
   * @example
   * builder.addAll(new Map([['$email', 'user@ex.com'], ['$phone', '555-0123']]));
   */
  addAll(definitions) {
    const entries = definitions instanceof Map
      ? definitions.entries()
      : Object.entries(definitions);

    for (const [name, value] of entries) {
      if (name.startsWith('$')) {
        this.addVariable(name, value);
      } else if (name.startsWith('&')) {
        this.addObject(name, value);
      } else if (name.startsWith('#')) {
        this.addNumeric(name, value);
      }
    }

    return this;
  }

  /**
   * Checks if a definition exists.
   *
   * @param {string} name - Definition name
   * @returns {boolean} True if definition exists
   */
  has(name) {
    const prefix = name.charAt(0);

    if (prefix === '$') {
      return this.variables.has(name);
    } else if (prefix === '&') {
      return this.objects.has(name);
    } else if (prefix === '#') {
      return this.numeric.has(name);
    }

    return false;
  }

  /**
   * Gets a definition value.
   *
   * @param {string} name - Definition name
   * @returns {*} Definition value or undefined
   */
  get(name) {
    const prefix = name.charAt(0);

    if (prefix === '$') {
      return this.variables.get(name);
    } else if (prefix === '&') {
      return this.objects.get(name);
    } else if (prefix === '#') {
      return this.numeric.get(name);
    }

    return undefined;
  }

  /**
   * Removes a definition.
   *
   * @param {string} name - Definition name
   * @returns {boolean} True if definition was removed
   */
  remove(name) {
    const prefix = name.charAt(0);

    if (prefix === '$') {
      return this.variables.delete(name);
    } else if (prefix === '&') {
      return this.objects.delete(name);
    } else if (prefix === '#') {
      return this.numeric.delete(name);
    }

    return false;
  }

  /**
   * Clears all definitions.
   *
   * @returns {DefinitionBuilder} This builder (for chaining)
   */
  clear() {
    this.variables.clear();
    this.objects.clear();
    this.numeric.clear();
    return this;
  }

  /**
   * Gets all definitions as a single Map.
   *
   * @returns {Map<string, *>} All definitions
   */
  getAll() {
    const all = new Map();

    for (const [k, v] of this.variables) all.set(k, v);
    for (const [k, v] of this.objects) all.set(k, v);
    for (const [k, v] of this.numeric) all.set(k, v);

    return all;
  }

  /**
   * Gets the number of definitions.
   *
   * @returns {number} Total number of definitions
   */
  size() {
    return this.variables.size + this.objects.size + this.numeric.size;
  }

  /**
   * Checks if there are no definitions.
   *
   * @returns {boolean} True if empty
   */
  isEmpty() {
    return this.size() === 0;
  }

  /**
   * Sorts definitions by a custom comparator.
   *
   * @param {Function} comparator - Comparison function
   * @returns {DefinitionBuilder} This builder (for chaining)
   *
   * @example
   * // Sort by name alphabetically
   * builder.sort((a, b) => a[0].localeCompare(b[0]));
   */
  sort(comparator) {
    const sortMap = (map) => {
      const entries = Array.from(map.entries());
      entries.sort(comparator);
      map.clear();
      for (const [k, v] of entries) {
        map.set(k, v);
      }
    };

    sortMap(this.variables);
    sortMap(this.objects);
    sortMap(this.numeric);

    return this;
  }

  /**
   * Sorts definitions alphabetically by name.
   *
   * @returns {DefinitionBuilder} This builder (for chaining)
   */
  sortAlphabetically() {
    return this.sort((a, b) => a[0].localeCompare(b[0]));
  }

  /**
   * Sorts definitions by usage frequency (requires usage data).
   *
   * @param {Map<string, number>} usageCounts - Usage count per definition
   * @returns {DefinitionBuilder} This builder (for chaining)
   */
  sortByUsage(usageCounts) {
    return this.sort((a, b) => {
      const countA = usageCounts.get(a[0]) || 0;
      const countB = usageCounts.get(b[0]) || 0;
      return countB - countA; // Descending
    });
  }

  /**
   * Optimizes definitions by removing unused ones.
   *
   * @param {Set<string>} usedRefs - Set of used reference names
   * @returns {DefinitionBuilder} This builder (for chaining)
   */
  removeUnused(usedRefs) {
    for (const name of this.variables.keys()) {
      if (!usedRefs.has(name)) {
        this.variables.delete(name);
      }
    }

    for (const name of this.objects.keys()) {
      if (!usedRefs.has(name)) {
        this.objects.delete(name);
      }
    }

    for (const name of this.numeric.keys()) {
      if (!usedRefs.has(name)) {
        this.numeric.delete(name);
      }
    }

    return this;
  }

  /**
   * Converts definitions to a plain object.
   *
   * @returns {Object} Plain object representation
   */
  toObject() {
    const obj = {};

    for (const [k, v] of this.getAll()) {
      obj[k] = v;
    }

    return obj;
  }

  /**
   * Creates a DefinitionBuilder from a plain object or Map.
   *
   * @static
   * @param {Map<string, *>|Object} definitions - Definitions
   * @returns {DefinitionBuilder} New builder
   */
  static from(definitions) {
    const builder = new DefinitionBuilder();
    builder.addAll(definitions);
    return builder;
  }

  /**
   * Merges multiple definition builders.
   *
   * @static
   * @param {...DefinitionBuilder} builders - Builders to merge
   * @returns {DefinitionBuilder} Merged builder
   */
  static merge(...builders) {
    const merged = new DefinitionBuilder();

    for (const builder of builders) {
      for (const [k, v] of builder.variables) {
        merged.addVariable(k, v);
      }
      for (const [k, v] of builder.objects) {
        merged.addObject(k, v);
      }
      for (const [k, v] of builder.numeric) {
        merged.addNumeric(k, v);
      }
    }

    return merged;
  }
}
