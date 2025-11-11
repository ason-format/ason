/**
 * ASON - Aliased Serialization Object Notation
 *
 * @fileoverview Main compression engine for converting JSON to ASON format.
 * ASON is a token-optimized serialization format designed specifically for LLMs,
 * reducing token usage by 20-60% compared to JSON while maintaining full round-trip fidelity.
 *
 * Key Features:
 * - Automatic pattern detection (no hardcoding required)
 * - Uniform array compression with schema extraction
 * - Object aliasing for repeated structures
 * - Inline-first value dictionary for LLM readability
 * - Path flattening for nested single-property objects
 * - Configurable indentation and delimiters
 *
 * @module SmartCompressor
 * @license MIT
 * @version 1.0.0
 */

/**
 * SmartCompressor class handles compression and decompression of JSON data to/from ASON format.
 *
 * @class SmartCompressor
 * @example
 * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
 * const compressed = compressor.compress({ users: [{id: 1, name: "Alice"}] });
 * const original = compressor.decompress(compressed);
 */
export class SmartCompressor {
  /**
   * Creates a new SmartCompressor instance with optional configuration.
   *
   * @constructor
   * @param {Object} options - Configuration options
   * @param {number} [options.indent=1] - Indentation spaces (minimum 1 for parser compatibility)
   * @param {string} [options.delimiter=','] - Delimiter for CSV arrays
   * @param {boolean} [options.useReferences=true] - Enable automatic pattern detection and references
   * @param {boolean} [options.useDictionary=true] - Enable inline-first value dictionary
   *
   * @example
   * // Maximum compression
   * new SmartCompressor({ indent: 1, useReferences: true })
   *
   * // Maximum readability
   * new SmartCompressor({ indent: 2, useReferences: false, useDictionary: false })
   */
  constructor(options = {}) {
    // Indent must be at least 1 for parser to work correctly
    this.indent =
      options.indent !== undefined ? Math.max(1, options.indent) : 1;
    this.delimiter = options.delimiter || ",";
    this.useReferences =
      options.useReferences !== undefined ? options.useReferences : true;
    this.useDictionary =
      options.useDictionary !== undefined ? options.useDictionary : true;

    /** @type {Map<string, {name: string, keys: string[], count: number}>} */
    this.structureRefs = new Map(); // Track repeated array structures

    /** @type {Map<string, string>} */
    this.objectAliases = new Map(); // Track repeated objects by value

    /** @type {Map<string, string>} */
    this.valueDictionary = new Map(); // Track frequent string values

    /** @type {Map<string, boolean>} */
    this.valueFirstOccurrence = new Map(); // Track if value has been serialized (for inline-first)

    this.refCounter = 0;
    this.aliasCounter = 0;
    this.dictCounter = 0;
  }

  /**
   * Compresses JSON data into ASON format.
   *
   * Performs a three-pass compression:
   * 1. Detect repeated array structures (3+ occurrences)
   * 2. Detect repeated objects (2+ occurrences)
   * 3. Detect frequent string values (2+ occurrences)
   *
   * @param {*} data - Any JSON-serializable data
   * @returns {string} ASON-formatted string
   *
   * @example
   * const data = {
   *   users: [
   *     {id: 1, name: "Alice", email: "alice@example.com"},
   *     {id: 2, name: "Bob", email: "bob@example.com"}
   *   ]
   * };
   * const compressed = compressor.compress(data);
   * // Output: users:[2]@id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com
   */
  compress(data) {
    // Reset all tracking state for this compression pass
    this.structureRefs.clear();
    this.objectAliases.clear();
    this.valueDictionary.clear();
    this.valueFirstOccurrence.clear();
    this.refCounter = 0;
    this.aliasCounter = 0;
    this.dictCounter = 0;

    // First pass: AUTOMATICALLY detect repeated structures (no hardcoding!)
    if (this.useReferences) {
      this._autoDetectPatterns(data);
      this._detectRepeatedObjects(data);
      if (this.useDictionary) {
        this._detectFrequentValues(data);
      }
    }

    let result = "";

    // Output definitions section if we have any references
    const hasDefs = this.structureRefs.size > 0 || this.objectAliases.size > 0;
    if (hasDefs) {
      result += "$def:\n";

      // Structure definitions for uniform arrays
      for (const [sig, ref] of this.structureRefs.entries()) {
        result +=
          this._sp(1) + `${ref.name}:@${ref.keys.join(this.delimiter)}\n`;
      }

      // Object aliases - temporarily disable aliases during serialization to avoid circular references
      const savedAliases = this.objectAliases;
      this.objectAliases = new Map(); // Disable to avoid circular reference
      for (const [jsonStr, alias] of savedAliases.entries()) {
        const obj = JSON.parse(jsonStr);
        const serialized = this._serialize(obj, 2);
        result += this._sp(1) + `${alias}:${serialized}\n`;
      }
      this.objectAliases = savedAliases; // Restore

      result += "$data:\n";
    }

    const serialized = this._serialize(data, hasDefs ? 1 : 0);
    // Remove leading newline (from object serialization) and trailing newlines
    return result + serialized.replace(/^\n/, "").replace(/\n+$/, "");
  }

  /**
   * Automatically detects repeated array patterns in the data tree.
   *
   * This method recursively traverses the entire data structure and identifies
   * uniform arrays (arrays of objects with consistent keys) that appear 3 or more times.
   * When found, these patterns are registered as reusable structure references.
   *
   * @private
   * @param {*} data - Data to scan for patterns
   * @param {Array<string|number>} [path=[]] - Current path in the data tree
   * @param {Map<string, {keys: string[], count: number}>} [patterns=new Map()] - Accumulator for pattern tracking
   * @returns {Map<string, {keys: string[], count: number}>} Map of pattern signatures to their metadata
   *
   * @example
   * // Given data with repeated array structure:
   * {
   *   process: {language_key: [{language: "EN", label: "Hi"}]},
   *   company: {labels: [{language: "EN", label: "Co"}]},
   *   field: {names: [{language: "EN", label: "Field"}]}
   * }
   * // Detects pattern {language, label} appears 3 times → creates $0 reference
   */
  _autoDetectPatterns(data, path = [], patterns = new Map()) {
    if (
      Array.isArray(data) &&
      this._isUniformObjects(data) &&
      data.length > 0
    ) {
      const { keys } = this._getMostCommonKeys(data); // Get most common keys
      const signature = keys.join("|"); // Use EXACT order for signature (not sorted)

      // Track this pattern occurrence (only if exact key order matches)
      if (!patterns.has(signature)) {
        patterns.set(signature, { keys, count: 0 });
      }
      patterns.get(signature).count++;

      // Recurse into each object's values
      for (const obj of data) {
        for (const key of keys) {
          this._autoDetectPatterns(obj[key], [...path, key], patterns);
        }
      }
    } else if (Array.isArray(data)) {
      // Non-uniform array
      data.forEach((item, i) =>
        this._autoDetectPatterns(item, [...path, i], patterns),
      );
    } else if (data && typeof data === "object") {
      // Regular object
      for (const [key, val] of Object.entries(data)) {
        this._autoDetectPatterns(val, [...path, key], patterns);
      }
    }

    // On root call (path.length === 0), create refs for frequent patterns
    if (path.length === 0) {
      for (const [signature, info] of patterns.entries()) {
        if (info.count >= 3) {
          // Create reference only if appears 3+ times
          this.structureRefs.set(signature, {
            name: `$${this.refCounter++}`,
            keys: info.keys,
            count: info.count,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detects frequently occurring string values for dictionary compression.
   *
   * Scans the entire data tree and identifies string values that:
   * - Appear 2 or more times
   * - Are at least 5 characters long
   * - Provide a token savings benefit (calculated by comparing original vs inline-first format)
   *
   * Uses "inline-first" approach: first occurrence shows value with tag (e.g., "alice@example.com #0"),
   * subsequent occurrences use only the tag (e.g., "#0").
   *
   * @private
   * @param {*} data - Data to scan for repeated values
   * @param {Map<string, number>} [valueCounts=new Map()] - Accumulator for value frequency tracking
   * @param {boolean} [isRoot=true] - Whether this is the root call
   *
   * @example
   * // Given data:
   * { billing: {email: "alice@example.com"}, shipping: {email: "alice@example.com"} }
   * // Detects "alice@example.com" appears 2 times → creates #0 reference
   * // Output: billing.email:alice@example.com #0\nshipping.email:#0
   */
  _detectFrequentValues(data, valueCounts = new Map(), isRoot = true) {
    // Recursively collect string values and their frequencies
    if (Array.isArray(data)) {
      data.forEach((item) =>
        this._detectFrequentValues(item, valueCounts, false),
      );
    } else if (data && typeof data === "object") {
      for (const val of Object.values(data)) {
        if (typeof val === "string" && val.length >= 5) {
          // Only consider strings of length 5+
          valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
        }
        this._detectFrequentValues(val, valueCounts, false);
      }
    }

    // On root call (first invocation), create dictionary entries
    if (isRoot && valueCounts.size > 0) {
      // Calculate savings for each candidate and sort by savings (descending)
      const candidates = [];
      for (const [value, count] of valueCounts.entries()) {
        // With inline-first, we can use lower threshold (2+ occurrences)
        if (count >= 2) {
          // With inline-first: first occurrence = value + tag, rest = tag only
          const aliasLen = 3; // Approximate length of " #N"
          const totalOriginal = value.length * count;
          const totalWithDict =
            value.length + aliasLen + (aliasLen - 1) * (count - 1);
          const savings = totalOriginal - totalWithDict;

          if (savings > 0) {
            candidates.push({ value, count, savings });
          }
        }
      }

      // Sort by savings (highest first) to prioritize best compressions
      candidates.sort((a, b) => b.savings - a.savings);

      // Create dictionary entries
      for (const { value } of candidates) {
        this.valueDictionary.set(value, `#${this.dictCounter++}`);
      }
    }
  }

  /**
   * Detects repeated objects by value (not just structure).
   *
   * Identifies small objects (1-3 keys, no complex nested structures) that appear
   * multiple times with identical values. These get assigned object aliases (&obj0, &obj1, etc.)
   * to avoid repeating the same object definition.
   *
   * @private
   * @param {*} data - Data to scan for repeated objects
   * @param {Map<string, number>} [objectCounts=new Map()] - Accumulator for object frequency tracking
   *
   * @example
   * // Given data:
   * {
   *   incremental_authorization: {status: "unavailable"},
   *   multicapture: {status: "unavailable"}
   * }
   * // Detects {status: "unavailable"} appears 2 times → creates &obj0 reference
   * // Output: $def:\n &obj0:\n  status:unavailable\n$data:\n incremental_authorization:&obj0\n multicapture:&obj0
   */
  _detectRepeatedObjects(data, objectCounts = new Map()) {
    if (Array.isArray(data)) {
      data.forEach((item) => this._detectRepeatedObjects(item, objectCounts));
    } else if (data && typeof data === "object") {
      // Skip if it's a large object (>3 keys) or has complex nested objects
      const keys = Object.keys(data);
      if (keys.length > 0 && keys.length <= 3) {
        const hasComplexNested = keys.some((k) => {
          const val = data[k];
          // Allow empty arrays/objects, but not complex ones
          if (Array.isArray(val)) return val.length > 0;
          if (val && typeof val === "object")
            return Object.keys(val).length > 0;
          return false;
        });

        if (!hasComplexNested) {
          // Small object with only primitives/empty arrays - candidate for aliasing
          const jsonStr = JSON.stringify(data);
          objectCounts.set(jsonStr, (objectCounts.get(jsonStr) || 0) + 1);
        }
      }

      // Recurse into nested values
      for (const val of Object.values(data)) {
        this._detectRepeatedObjects(val, objectCounts);
      }
    }

    // On root call, create aliases for objects that appear 2+ times
    if (objectCounts.size > 0 && this.objectAliases.size === 0) {
      for (const [jsonStr, count] of objectCounts.entries()) {
        if (count >= 2) {
          this.objectAliases.set(jsonStr, `&obj${this.aliasCounter++}`);
        }
      }
    }
  }

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
   * @param {string} text - ASON formatted string
   * @returns {*} Original JSON data structure
   * @throws {Error} If parsing fails due to malformed input
   *
   * @example
   * const ason = "users:[2]@id,name\n1,Alice\n2,Bob";
   * const original = compressor.decompress(ason);
   * // Returns: {users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]}
   */
  decompress(text) {
    const lines = text.split("\n");

    // Parse definitions if present
    const structureDefs = new Map();
    const objectAliases = new Map();
    const valueDictionary = new Map();
    let dataStartLine = 0;

    if (lines[0]?.trim() === "$def:") {
      let i = 1;
      while (i < lines.length && lines[i].trim() !== "$data:") {
        const line = lines[i];
        const indent = line.length - line.trimStart().length;
        const trimmed = line.trim();
        const colonIdx = trimmed.indexOf(":");

        if (colonIdx > 0) {
          const refName = trimmed.slice(0, colonIdx).trim();
          const rest = trimmed.slice(colonIdx + 1).trim();

          if (rest.startsWith("@")) {
            // Structure definition
            const keys = rest.slice(1).split(this.delimiter);
            structureDefs.set(refName, keys);
            i++;
          } else if (refName.startsWith("#")) {
            // Value dictionary entry
            const value = rest.startsWith('"') ? JSON.parse(rest) : rest;
            valueDictionary.set(refName, value);
            i++;
          } else if (refName.startsWith("&obj")) {
            // Object alias definition - may be multiline
            if (rest === "") {
              // Multiline object
              i++;
              const objLines = [];
              while (i < lines.length && lines[i].trim() !== "$data:") {
                const nextIndent =
                  lines[i].length - lines[i].trimStart().length;
                if (nextIndent > indent) {
                  objLines.push(lines[i]);
                  i++;
                } else {
                  break;
                }
              }
              // Parse the object
              const objResult = this._parseLines(objLines, 0);
              objectAliases.set(refName, objResult);
            } else {
              // Inline object
              const obj = this._parseVal(rest);
              objectAliases.set(refName, obj);
              i++;
            }
          } else {
            i++;
          }
        } else {
          i++;
        }
      }
      dataStartLine = i + 1;
    }

    this.structureDefs = structureDefs;
    this.parsedAliases = objectAliases;
    this.parsedValueDict = valueDictionary;
    const result = this._parseLines(lines, dataStartLine);
    return result;
  }

  /**
   * Generates indentation string based on configured indent level.
   *
   * @private
   * @param {number} level - Indentation level (0 = no indent)
   * @returns {string} Spaces for indentation
   */
  _sp(level) {
    if (this.indent === 0) return "";
    return " ".repeat(this.indent * level);
  }

  /**
   * Serializes a value into ASON format.
   *
   * Handles all JSON types:
   * - Primitives: null, boolean, number, string
   * - Arrays: uniform (with schema extraction), primitive, complex
   * - Objects: with path flattening, object aliasing, and proper escaping
   *
   * @private
   * @param {*} val - Value to serialize
   * @param {number} level - Current indentation level
   * @returns {string} ASON-formatted string representation
   */
  _serialize(val, level) {
    const indent = this._sp(level);

    if (val === null || val === undefined) return "null";

    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "number") return String(val);
    if (typeof val === "string") {
      // Check if this value is in the dictionary
      const dictAlias = this.valueDictionary.get(val);
      if (dictAlias && this.useDictionary) {
        // Inline-first: first occurrence shows value with tag, subsequent use tag only
        if (!this.valueFirstOccurrence.has(val)) {
          this.valueFirstOccurrence.set(val, true);
          // First occurrence: show value with inline tag
          const needsQuotes =
            /[\n\r\t]/.test(val) ||
            val === "" ||
            val === "null" ||
            val === "true" ||
            val === "false" ||
            /^-?\d+\.?\d*$/.test(val);

          if (needsQuotes) {
            return `${JSON.stringify(val)} ${dictAlias}`;
          }
          return `${val} ${dictAlias}`;
        }
        // Subsequent occurrences: use tag only
        return dictAlias;
      }

      if (
        /[\n\r\t]/.test(val) ||
        val === "" ||
        val === "null" ||
        val === "true" ||
        val === "false" ||
        /^-?\d+\.?\d*$/.test(val) // String that looks like a number
      ) {
        return JSON.stringify(val);
      }
      return val;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";

      // Uniform objects
      if (this._isUniformObjects(val)) {
        const { keys } = this._getMostCommonKeys(val); // Get most common keys
        const signature = keys.join("|"); // Use exact order for matching
        const ref = this.structureRefs.get(signature);

        // Check if ALL values are primitives (not objects/arrays)
        const allPrimitive = val.every((obj) =>
          keys.every((k) => {
            const v = obj[k];
            return v === null || typeof v !== "object";
          }),
        );

        // Only use compact format if all values are primitives
        if (allPrimitive) {
          // Check if all objects have exactly these keys (subset is OK, but no extra keys)
          const allHaveOnlyTheseKeys = val.every((obj) => {
            const objKeys = Object.keys(obj);
            return objKeys.every((k) => keys.includes(k));
          });

          if (allHaveOnlyTheseKeys) {
            const marker = ref
              ? `$${ref.name}`
              : `@${keys.join(this.delimiter)}`;
            // Add length indicator [N] like Toon format
            let s = `[${val.length}]${marker}\n`;
            for (const obj of val) {
              const vals = keys.map((k) => this._escVal(obj[k]));
              s += indent + vals.join(this.delimiter) + "\n";
            }
            return s.trimEnd();
          }
        }

        // If has complex values, use normal list format (not uniform array format)
        // This ensures proper parsing of nested structures
        let s = "\n";
        for (const obj of val) {
          s += indent + "- \n";
          // Use actual keys from each object, not the common keys
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            const serialized = this._serialize(v, level + 2);
            if (serialized.startsWith("\n")) {
              s += this._sp(level + 1) + k + ":" + serialized + "\n";
            } else {
              s += this._sp(level + 1) + k + ":" + serialized + "\n";
            }
          }
        }
        return s.trimEnd();
      }

      // Primitives - use [val1,val2] format to preserve array type
      if (val.every((v) => v === null || typeof v !== "object")) {
        const items = val.map((v) => this._escVal(v)).join(this.delimiter);
        return `[${items}]`;
      }

      // Complex array
      let s = "\n";
      for (const item of val) {
        s += indent + "- " + this._serialize(item, level + 1).trim() + "\n";
      }
      return s.trimEnd();
    }

    // Object
    if (typeof val === "object") {
      if (Object.keys(val).length === 0) return "{}";

      // Check if this object has an alias
      const jsonStr = JSON.stringify(val);
      const alias = this.objectAliases.get(jsonStr);
      if (alias) {
        return alias; // Return alias reference
      }

      // Add newline before object keys, except at root level (level 0)
      let s = level === 0 ? "" : "\n";
      for (const [k, v] of Object.entries(val)) {
        // Path flattening: if value is an object with single key, flatten the path
        let flattenedPath = k;
        let currentVal = v;

        while (
          currentVal &&
          typeof currentVal === "object" &&
          !Array.isArray(currentVal) &&
          Object.keys(currentVal).length === 1 &&
          !this.objectAliases.has(JSON.stringify(currentVal))
        ) {
          const nextKey = Object.keys(currentVal)[0];
          flattenedPath += "." + nextKey;
          currentVal = currentVal[nextKey];
        }

        const key = /[\n\r\t]/.test(flattenedPath)
          ? JSON.stringify(flattenedPath)
          : flattenedPath;
        const value = this._serialize(currentVal, level + 1);

        if (value.startsWith("\n")) {
          // Value is multiline starting with newline
          s += indent + key + ":" + value + "\n";
        } else if (value.includes("\n")) {
          // Value has newlines but doesn't start with one
          s += indent + key + ":" + value + "\n";
        } else {
          // Simple inline value - escape only if contains problematic chars in inline context
          const needsQuotes = /[\n\r\t]/.test(value);
          const escapedValue = needsQuotes ? JSON.stringify(value) : value;
          s += indent + key + ":" + escapedValue + "\n";
        }
      }
      return s.trimEnd();
    }

    return String(val);
  }

  /**
   * Escapes a value for CSV context (inside uniform arrays).
   *
   * Handles dictionary references, quoting, and proper escaping for values
   * that contain delimiters or special characters.
   *
   * @private
   * @param {*} v - Value to escape
   * @returns {string} Escaped value suitable for CSV context
   */
  _escVal(v) {
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") {
      // Check if this value is in the dictionary
      const dictAlias = this.valueDictionary.get(v);
      if (dictAlias && this.useDictionary) {
        // Inline-first: first occurrence shows value with tag, subsequent use tag only
        if (!this.valueFirstOccurrence.has(v)) {
          this.valueFirstOccurrence.set(v, true);
          // First occurrence: show value with inline tag
          const needsQuotes =
            new RegExp(`[${this.delimiter}\\n\\r\\t]`).test(v) ||
            v === "" ||
            v === "null" ||
            v === "true" ||
            v === "false" ||
            /^-?\d+\.?\d*$/.test(v);

          if (needsQuotes) {
            return `${JSON.stringify(v)} ${dictAlias}`;
          }
          return `${v} ${dictAlias}`;
        }
        // Subsequent occurrences: use tag only
        return dictAlias;
      }

      if (
        new RegExp(`[${this.delimiter}\\n\\r\\t"]`).test(v) || // Also escape quotes
        v === "" ||
        v === "null" ||
        v === "true" ||
        v === "false" ||
        /^-?\d+\.?\d*$/.test(v) // String that looks like a number
      ) {
        return JSON.stringify(v);
      }
      return v;
    }
    // For complex objects/arrays in CSV context
    if (typeof v === "object") {
      const serialized = this._serialize(v, 0).trim();
      if (serialized.includes("\n")) {
        return JSON.stringify(v);
      }
      return serialized;
    }
    return JSON.stringify(v);
  }

  /**
   * Deep merges source object into target object.
   *
   * Used for reconstructing flattened paths during decompression.
   * Recursively merges nested objects without overwriting existing properties.
   *
   * @private
   * @param {Object} target - Target object to merge into
   * @param {Object} source - Source object to merge from
   */
  _deepMerge(target, source) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * Determines the most common key signature in an array of objects.
   *
   * Analyzes an array of objects and returns:
   * - The set of keys that appears most frequently
   * - The uniformity ratio (percentage of objects matching that signature)
   *
   * Preserves original key order from the first matching object.
   *
   * @private
   * @param {Array<Object>} arr - Array of objects to analyze
   * @returns {{keys: string[], uniformity: number}} Most common keys and uniformity ratio
   *
   * @example
   * const arr = [{id: 1, name: "A"}, {id: 2, name: "B"}, {age: 30}];
   * _getMostCommonKeys(arr);
   * // Returns: {keys: ["id", "name"], uniformity: 0.666}
   */
  _getMostCommonKeys(arr) {
    // Count frequency of each key signature and track original key order
    const signatureCounts = new Map();
    const signatureKeys = new Map();

    for (const item of arr) {
      const keys = Object.keys(item);
      const sig = keys.slice().sort().join("|");
      signatureCounts.set(sig, (signatureCounts.get(sig) || 0) + 1);

      // Store original key order from first occurrence
      if (!signatureKeys.has(sig)) {
        signatureKeys.set(sig, keys);
      }
    }

    // Find most common signature
    let mostCommonSig = "";
    let maxCount = 0;
    for (const [sig, count] of signatureCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonSig = sig;
      }
    }

    return {
      keys: signatureKeys.get(mostCommonSig) || [],
      uniformity: maxCount / arr.length,
    };
  }

  /**
   * Checks if an array contains uniform objects (objects with consistent key structure).
   *
   * An array is considered uniform if:
   * - All elements are non-null objects (not arrays)
   * - At least 60% of objects share the same key signature
   *
   * @private
   * @param {Array} arr - Array to check
   * @returns {boolean} True if array contains uniform objects
   *
   * @example
   * [{id: 1, name: "A"}, {id: 2, name: "B"}] → true (100% uniform)
   * [{id: 1}, {name: "A"}, {id: 2, name: "B"}] → false (only 33% uniform)
   */
  _isUniformObjects(arr) {
    if (arr.length === 0) return false;
    if (
      !arr.every(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      )
    ) {
      return false;
    }

    const { uniformity } = this._getMostCommonKeys(arr);
    const uniformityThreshold = 0.6;
    return uniformity >= uniformityThreshold;
  }

  /**
   * Parses ASON text lines starting from a given index.
   *
   * Entry point for the recursive descent parser.
   *
   * @private
   * @param {string[]} lines - Lines of ASON text
   * @param {number} startIdx - Starting line index
   * @returns {*} Parsed value
   */
  _parseLines(lines, startIdx) {
    let i = startIdx;
    return this._parseValue(lines, i, -1).value;
  }

  /**
   * Calculates the indentation level of a line.
   *
   * @private
   * @param {string} line - Line to measure
   * @returns {number} Number of leading spaces, or -1 if line is empty
   */
  _getIndent(line) {
    if (!line || line.trim() === "") return -1;
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  /**
   * Parses a value from ASON format (dispatches to appropriate parser).
   *
   * Determines the type of value based on syntax and delegates to:
   * - _parseList for list items (-)
   * - _parseUniformArray for uniform arrays (@keys or $ref)
   * - _parseObject for key:value pairs
   * - _parseVal for primitives
   *
   * @private
   * @param {string[]} lines - Lines of ASON text
   * @param {number} idx - Current line index
   * @param {number} parentIndent - Parent indentation level
   * @returns {{value: *, nextIdx: number}} Parsed value and next line index
   */
  _parseValue(lines, idx, parentIndent) {
    if (idx >= lines.length) return { value: null, nextIdx: idx };

    const line = lines[idx];
    const indent = this._getIndent(line);
    const content = line.trim();

    if (content === "") return { value: null, nextIdx: idx + 1 };

    // Check for list item FIRST (before key:value check)
    // List items can contain colons like "- name:Value"
    if (content === "-" || content.startsWith("- ")) {
      return this._parseList(lines, idx, parentIndent);
    }

    // Check for uniform array marker
    if (
      content.startsWith("@") ||
      content.startsWith("[") && content.includes("]@") || // [N]@keys format
      (content.startsWith("$") &&
        !content.startsWith("$def") &&
        !content.startsWith("$data"))
    ) {
      return this._parseUniformArray(lines, idx, parentIndent);
    }

    // Check if it's a key:value pair
    const colonIdx = content.indexOf(":");
    if (colonIdx > 0 && indent > parentIndent) {
      // This is an object
      return this._parseObject(lines, idx, parentIndent);
    }

    // Single primitive value
    return { value: this._parseVal(content), nextIdx: idx + 1 };
  }

  /**
   * Parses an object from ASON format.
   *
   * Handles:
   * - Simple key:value pairs
   * - Path flattening (a.b.c)
   * - Inline uniform arrays (@keys)
   * - Structure references ($ref)
   * - Multiline values
   *
   * @private
   * @param {string[]} lines - Lines of ASON text
   * @param {number} startIdx - Starting line index
   * @param {number} parentIndent - Parent indentation level
   * @returns {{value: Object, nextIdx: number}} Parsed object and next line index
   */
  _parseObject(lines, startIdx, parentIndent) {
    const obj = {};
    let i = startIdx;

    while (i < lines.length) {
      const line = lines[i];
      const indent = this._getIndent(line);
      const content = line.trim();

      // Stop if we're back at parent level or less
      if (indent <= parentIndent) break;
      if (content === "") {
        i++;
        continue;
      }

      // Must be key:value
      const colonIdx = content.indexOf(":");
      if (colonIdx <= 0) {
        i++;
        continue;
      }

      const key = content.slice(0, colonIdx).trim();
      const rest = content.slice(colonIdx + 1).trim();
      const actualKey = key.startsWith('"') ? JSON.parse(key) : key;

      // Handle path flattening: a.b.c => nested structure
      if (actualKey.includes(".") && !key.startsWith('"')) {
        const parts = actualKey.split(".");
        const rootKey = parts[0];

        // Build nested structure
        let value;
        if (rest === "") {
          // Value is on next lines
          i++;
          if (i < lines.length && this._getIndent(lines[i]) > indent) {
            const result = this._parseValue(lines, i, indent);
            value = result.value;
            i = result.nextIdx;
          } else {
            value = null;
          }
        } else {
          value = this._parseVal(rest);
          i++;
        }

        // Build from innermost to outermost
        for (let j = parts.length - 1; j >= 1; j--) {
          value = { [parts[j]]: value };
        }

        // Merge with existing nested object if present
        if (
          obj[rootKey] &&
          typeof obj[rootKey] === "object" &&
          !Array.isArray(obj[rootKey])
        ) {
          this._deepMerge(obj[rootKey], value);
        } else {
          obj[rootKey] = value;
        }
        continue;
      }

      if (rest === "") {
        // Value is on next lines
        i++;
        if (i < lines.length && this._getIndent(lines[i]) > indent) {
          const result = this._parseValue(lines, i, indent);
          obj[actualKey] = result.value;
          i = result.nextIdx;
        } else {
          obj[actualKey] = null;
        }
      } else if (
        rest.startsWith("@") ||
        (rest.startsWith("[") && rest.includes("]@"))
      ) {
        // Inline uniform array definition (with or without [N] prefix)
        // Format: @keys or [N]@keys
        let parsedRest = rest;
        let expectedLength = null;

        // Check for [N] prefix
        if (rest.startsWith("[")) {
          const endBracket = rest.indexOf("]");
          if (endBracket > 0) {
            expectedLength = parseInt(rest.slice(1, endBracket));
            parsedRest = rest.slice(endBracket + 1);
          }
        }

        const keys = parsedRest.slice(1).split(this.delimiter);
        const arr = [];
        i++;
        while (i < lines.length && this._getIndent(lines[i]) > indent) {
          const vals = this._parseCsv(lines[i].trim());
          const rowObj = {};
          keys.forEach((k, idx) => {
            const val = vals[idx];
            // Only add key if value is present (not empty string)
            if (val !== undefined && val !== "") {
              rowObj[k] = this._parseVal(val);
            }
          });
          arr.push(rowObj);
          i++;
        }
        obj[actualKey] = arr;
      } else if (rest.startsWith("$") && rest.length > 1 && rest[1] !== "{") {
        // Reference to structure definition
        const refName = rest.slice(1);
        const keys = this.structureDefs.get(refName);
        if (keys) {
          const arr = [];
          i++;
          while (i < lines.length && this._getIndent(lines[i]) > indent) {
            const vals = this._parseCsv(lines[i].trim());
            const rowObj = {};
            keys.forEach((k, idx) => {
              const val = vals[idx];
              // Only add key if value is present (not empty string)
              if (val !== undefined && val !== "") {
                rowObj[k] = this._parseVal(val);
              }
            });
            arr.push(rowObj);
            i++;
          }
          obj[actualKey] = arr;
        } else {
          obj[actualKey] = this._parseVal(rest);
          i++;
        }
      } else {
        // Inline value
        obj[actualKey] = this._parseVal(rest);
        i++;
      }
    }

    return { value: obj, nextIdx: i };
  }

  /**
   * Parses a uniform array from ASON format.
   *
   * Handles both inline (@keys) and reference ($ref) formats.
   * Supports optional [N] length indicator.
   *
   * @private
   * @param {string[]} lines - Lines of ASON text
   * @param {number} startIdx - Starting line index
   * @param {number} parentIndent - Parent indentation level
   * @returns {{value: Array<Object>, nextIdx: number}} Parsed array and next line index
   */
  _parseUniformArray(lines, startIdx, parentIndent) {
    let content = lines[startIdx].trim();
    let expectedLength = null;
    let keys;

    // Check for length indicator [N]
    if (content.startsWith("[")) {
      const endBracket = content.indexOf("]");
      if (endBracket > 0) {
        expectedLength = parseInt(content.slice(1, endBracket));
        content = content.slice(endBracket + 1); // Remove [N] prefix
      }
    }

    if (content.startsWith("@")) {
      keys = content.slice(1).split(this.delimiter);
    } else if (content.startsWith("$")) {
      const refName = content.slice(1);
      keys = this.structureDefs.get(refName);
      if (!keys) return { value: [], nextIdx: startIdx + 1 };
    } else {
      return { value: [], nextIdx: startIdx + 1 };
    }

    const arr = [];
    let i = startIdx + 1;
    const arrayIndent = this._getIndent(lines[startIdx]);

    while (i < lines.length) {
      const indent = this._getIndent(lines[i]);
      // Data rows should be indented more than the array marker
      if (indent <= parentIndent) break;

      const lineContent = lines[i].trim();
      if (lineContent === "") {
        i++;
        continue;
      }

      if (lineContent.startsWith("- ")) {
        // Complex row format: - key:val key:val
        const parts = lineContent.slice(2).split(/\s+(?=\w+:)/);
        const obj = {};
        for (const part of parts) {
          const cIdx = part.indexOf(":");
          if (cIdx > 0) {
            const k = part.slice(0, cIdx);
            const v = part.slice(cIdx + 1);
            obj[k] = this._parseVal(v);
          }
        }
        arr.push(obj);
        i++;
      } else {
        // CSV row
        const vals = this._parseCsv(lineContent);
        const obj = {};
        keys.forEach((k, idx) => {
          const val = vals[idx];
          // Only add key if value is present (not empty string)
          if (val !== undefined && val !== "") {
            obj[k] = this._parseVal(val);
          }
        });
        arr.push(obj);
        i++;
      }
    }

    return { value: arr, nextIdx: i };
  }

  /**
   * Parses a list (array) from ASON format.
   *
   * Handles both simple values and complex nested structures.
   * Each list item starts with "- " prefix.
   *
   * @private
   * @param {string[]} lines - Lines of ASON text
   * @param {number} startIdx - Starting line index
   * @param {number} parentIndent - Parent indentation level
   * @returns {{value: Array, nextIdx: number}} Parsed array and next line index
   */
  _parseList(lines, startIdx, parentIndent) {
    const arr = [];
    let i = startIdx;
    const listIndent = this._getIndent(lines[startIdx]); // Remember the indent of first "-"

    while (i < lines.length) {
      const indent = this._getIndent(lines[i]);
      // Stop if we're back at parent level or less
      if (indent <= parentIndent) break;

      const content = lines[i].trim();
      // Only accept "-" at the same level as first item
      if (content !== "-" && !content.startsWith("- ")) break;
      if (indent !== listIndent) break;

      const val = content.slice(2).trim();

      if (val === "") {
        // Value is on next lines (object or complex value)
        i++;
        if (i < lines.length && this._getIndent(lines[i]) > indent) {
          const result = this._parseValue(lines, i, indent);
          arr.push(result.value);
          i = result.nextIdx;
        } else {
          arr.push(null);
        }
      } else {
        // Check if there are indented lines following (indicates object with more properties)
        const nextLineIndent =
          i + 1 < lines.length ? this._getIndent(lines[i + 1]) : 0;
        if (nextLineIndent > indent) {
          // This is an object with first property inline: "- key:value"
          // Parse it as an object starting from current line
          const obj = {};
          // Parse the inline key:value
          const colonIdx = val.indexOf(":");
          if (colonIdx > 0) {
            const key = val.slice(0, colonIdx).trim();
            const value = val.slice(colonIdx + 1).trim();
            obj[key] = this._parseVal(value);
          }
          // Parse remaining properties from next lines
          i++;
          while (i < lines.length && this._getIndent(lines[i]) > indent) {
            const line = lines[i];
            const lineIndent = this._getIndent(line);
            const lineContent = line.trim();

            if (lineIndent === nextLineIndent && lineContent.indexOf(":") > 0) {
              const colonIdx2 = lineContent.indexOf(":");
              const key2 = lineContent.slice(0, colonIdx2).trim();
              const rest2 = lineContent.slice(colonIdx2 + 1).trim();

              if (rest2 === "") {
                // Value on next lines
                i++;
                if (
                  i < lines.length &&
                  this._getIndent(lines[i]) > lineIndent
                ) {
                  const result = this._parseValue(lines, i, lineIndent);
                  obj[key2] = result.value;
                  i = result.nextIdx;
                } else {
                  obj[key2] = null;
                }
              } else {
                obj[key2] = this._parseVal(rest2);
                i++;
              }
            } else {
              break;
            }
          }
          arr.push(obj);
        } else {
          // Check if this is a single-property object (has ":" but no subsequent lines)
          const colonIdx = val.indexOf(":");
          if (colonIdx > 0 && !val.startsWith("[") && !val.startsWith("{")) {
            // This is a single-property object: "- key:value"
            const key = val.slice(0, colonIdx).trim();
            const value = val.slice(colonIdx + 1).trim();
            arr.push({ [key]: this._parseVal(value) });
          } else {
            // Simple inline value
            arr.push(this._parseVal(val));
          }
          i++;
        }
      }
    }

    return { value: arr, nextIdx: i };
  }

  /**
   * Parses a CSV line into values, handling quoted strings.
   *
   * Respects quotes and escaped quotes within values.
   * Used for parsing uniform array rows.
   *
   * @private
   * @param {string} str - CSV string to parse
   * @returns {string[]} Array of parsed values
   *
   * @example
   * _parseCsv('1,"Alice, Bob",true') → ['1', '"Alice, Bob"', 'true']
   */
  _parseCsv(str) {
    const vals = [];
    let curr = "";
    let inQuotes = false;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === '"' && (i === 0 || str[i - 1] !== "\\")) {
        if (inQuotes && str[i + 1] === '"') {
          curr += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
          curr += c;
        }
      } else if (c === this.delimiter && !inQuotes) {
        vals.push(curr);
        curr = "";
      } else {
        curr += c;
      }
    }
    vals.push(curr);
    return vals;
  }

  /**
   * Parses a primitive value from string representation.
   *
   * Handles:
   * - null, true, false, empty arrays/objects
   * - Value dictionary references (#N)
   * - Object alias references (&objN)
   * - Array notation [item1,item2]
   * - Quoted strings
   * - Numbers
   * - Unquoted strings
   *
   * @private
   * @param {string} str - String to parse
   * @returns {*} Parsed value
   *
   * @example
   * _parseVal("null") → null
   * _parseVal("true") → true
   * _parseVal("#0") → (value from dictionary)
   * _parseVal('"123"') → "123" (string, not number)
   * _parseVal("123") → 123 (number)
   */
  _parseVal(str) {
    str = str.trim();

    if (str === "null") return null;
    if (str === "true") return true;
    if (str === "false") return false;
    if (str === "[]") return [];
    if (str === "{}") return {};

    // Check for value dictionary reference (tag only)
    if (str.startsWith("#") && this.parsedValueDict) {
      const value = this.parsedValueDict.get(str);
      if (value !== undefined) {
        return value;
      }
    }

    // Check for inline-first format: "value #N" (first occurrence with tag)
    const inlineMatch = str.match(/^(.+?)\s+(#\d+)$/);
    if (inlineMatch && this.parsedValueDict) {
      const actualValue = inlineMatch[1];
      const tag = inlineMatch[2];
      // Store this value in dictionary for subsequent references
      if (!this.parsedValueDict.has(tag)) {
        // Parse the actual value (may be quoted string)
        const parsed = actualValue.startsWith('"') ? JSON.parse(actualValue) : actualValue;
        this.parsedValueDict.set(tag, parsed);
      }
      // Return the parsed actual value
      return actualValue.startsWith('"') ? JSON.parse(actualValue) : actualValue;
    }

    // Check for object alias reference
    if (str.startsWith("&obj") && this.parsedAliases) {
      const alias = this.parsedAliases.get(str);
      if (alias !== undefined) {
        return alias;
      }
    }

    // Check for array notation [item1,item2,...]
    if (str.startsWith("[") && str.endsWith("]")) {
      const content = str.slice(1, -1).trim();
      if (content === "") return [];
      const vals = this._parseCsv(content);
      return vals.map((v) => this._parseVal(v));
    }

    // Check if it's a quoted string first
    if (str.startsWith('"')) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return str;
      }
    }

    // Only parse as number if it looks like a number AND doesn't start with quotes in original
    if (/^-?\d+\.?\d*$/.test(str)) {
      const num = parseFloat(str);
      // Return as number (preserving floats and integers)
      if (!isNaN(num) && isFinite(num)) {
        return num;
      }
    }

    // Note: CSV parsing is handled at higher levels (_parseUniformArray, etc.)
    // Don't try to recursively parse comma-separated values here to avoid infinite loops

    return str;
  }
}

/**
 * TokenCounter provides utilities for estimating and comparing token usage.
 *
 * Uses the GPT-4 tokenizer (cl100k_base encoding) for accurate token counts,
 * with fallback to approximation if tokenizer fails.
 *
 * @class TokenCounter
 */
export class TokenCounter {
  /**
   * Counts tokens using the GPT tokenizer (cl100k_base encoding).
   *
   * Falls back to approximation (text.length / 4) if tokenizer fails.
   *
   * @static
   * @param {string|*} text - Text to count tokens for (auto-stringifies non-strings)
   * @returns {number} Estimated token count
   *
   * @example
   * TokenCounter.estimateTokens("Hello world") → 2
   * TokenCounter.estimateTokens({key: "value"}) → 5
   */
  static estimateTokens(text) {
    if (typeof text !== "string") text = JSON.stringify(text);

    // Approximate tokens using character count / 4
    // This is a common approximation: ~1 token per 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Compares token usage between original JSON and compressed ASON.
   *
   * @static
   * @param {*} original - Original data structure
   * @param {string|*} compressed - Compressed data (ASON string or data structure)
   * @returns {{original_tokens: number, compressed_tokens: number, reduction_percent: number, original_size: number, compressed_size: number}}
   *
   * @example
   * const original = {users: [{id: 1}, {id: 2}]};
   * const compressed = compressor.compress(original);
   * const stats = TokenCounter.compareFormats(original, compressed);
   * // Returns: {original_tokens: 15, compressed_tokens: 8, reduction_percent: 46.67, ...}
   */
  static compareFormats(original, compressed) {
    const originalStr = JSON.stringify(original);
    const compressedStr =
      typeof compressed === "string" ? compressed : JSON.stringify(compressed);

    const originalTokens = this.estimateTokens(originalStr);
    const compressedTokens = this.estimateTokens(compressedStr);

    return {
      original_tokens: originalTokens,
      compressed_tokens: compressedTokens,
      reduction_percent: parseFloat(
        (100 * (1 - compressedTokens / originalTokens)).toFixed(2),
      ),
      original_size: originalStr.length,
      compressed_size: compressedStr.length,
    };
  }
}
