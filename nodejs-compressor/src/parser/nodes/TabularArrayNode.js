/**
 * @fileoverview Tabular Array AST Node for ASON 2.0
 *
 * Represents a tabular array with schema definition.
 * Format: @section [N]{field1,field2,...}
 *
 * @module TabularArrayNode
 * @license MIT
 * @version 2.0.0
 */

import { ASTNode, ArrayNode, ObjectNode } from './ASTNode.js';

/**
 * AST node representing a tabular array.
 *
 * Tabular arrays are compact representations of uniform data:
 * @users [2]{id,name,email}
 * 1|John|john@ex.com
 * 2|Jane|jane@ex.com
 *
 * @class TabularArrayNode
 * @extends ArrayNode
 */
export class TabularArrayNode extends ArrayNode {
  /**
   * Creates a tabular array node.
   *
   * @constructor
   * @param {string[]} schema - Field names (column schema)
   * @param {ObjectNode[]} rows - Array of row objects
   * @param {Object} [metadata={}] - Optional metadata
   *
   * @example
   * const tabular = new TabularArrayNode(
   *   ['id', 'name'],
   *   [
   *     new ObjectNode(new Map([['id', new PrimitiveNode(1)], ['name', new PrimitiveNode('John')]]))
   *   ]
   * );
   */
  constructor(schema = [], rows = [], metadata = {}) {
    super(rows, metadata);
    this.type = 'TabularArray';

    /** @type {string[]} Field names (schema) */
    this.schema = schema;

    /** @type {number|null} Expected row count (from [N] annotation) */
    this.expectedCount = metadata.expectedCount ?? null;
  }

  accept(visitor) {
    return visitor.visitTabularArray?.(this) ?? this.toValue();
  }

  /**
   * Validates that all rows conform to the schema.
   *
   * @returns {Object} Validation result
   * @returns {boolean} .valid - True if all rows are valid
   * @returns {string[]} .errors - Array of error messages
   */
  validate() {
    const errors = [];

    // Check row count if specified
    if (this.expectedCount !== null && this.elements.length !== this.expectedCount) {
      errors.push(
        `Expected ${this.expectedCount} rows, got ${this.elements.length}`
      );
    }

    // Check each row has all schema fields
    for (let i = 0; i < this.elements.length; i++) {
      const row = this.elements[i];

      if (!(row instanceof ObjectNode)) {
        errors.push(`Row ${i} is not an object`);
        continue;
      }

      // Check for missing required fields
      for (const field of this.schema) {
        if (!row.hasProperty(field)) {
          errors.push(`Row ${i} missing required field: ${field}`);
        }
      }

      // Warn about extra fields (not in schema)
      for (const [key] of row.properties) {
        if (!this.schema.includes(key)) {
          errors.push(`Row ${i} has unexpected field: ${key}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks if this tabular array has a uniform structure.
   *
   * @returns {boolean} True if all rows have exactly the schema fields
   */
  isUniform() {
    return this.elements.every(row =>
      row instanceof ObjectNode &&
      row.properties.size === this.schema.length &&
      this.schema.every(field => row.hasProperty(field))
    );
  }

  /**
   * Gets the actual row count.
   *
   * @returns {number} Number of rows
   */
  get rowCount() {
    return this.elements.length;
  }

  /**
   * Gets the field count (number of columns).
   *
   * @returns {number} Number of fields
   */
  get fieldCount() {
    return this.schema.length;
  }

  /**
   * Adds a row to the tabular array.
   *
   * @param {ObjectNode|Object} row - Row to add (ObjectNode or plain object)
   */
  addRow(row) {
    if (!(row instanceof ObjectNode)) {
      // Convert plain object to ObjectNode
      const objNode = new ObjectNode();
      for (const [key, value] of Object.entries(row)) {
        objNode.setProperty(key, value);
      }
      this.addElement(objNode);
    } else {
      this.addElement(row);
    }
  }

  /**
   * Gets a specific row.
   *
   * @param {number} index - Row index
   * @returns {ObjectNode|undefined} Row object or undefined
   */
  getRow(index) {
    return this.elements[index];
  }

  /**
   * Gets a specific cell value.
   *
   * @param {number} rowIndex - Row index
   * @param {string} field - Field name
   * @returns {*} Cell value or undefined
   */
  getCell(rowIndex, field) {
    const row = this.getRow(rowIndex);
    return row?.getProperty(field);
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}TabularArray [${this.rowCount}]{${this.schema.join(',')}} [\n`;
    for (const row of this.elements) {
      str += row.toString(indent + 1) + '\n';
    }
    str += `${spaces}]`;
    return str;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      schema: this.schema,
      expectedCount: this.expectedCount,
      rowCount: this.rowCount
    };
  }
}
