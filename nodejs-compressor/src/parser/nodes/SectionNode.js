/**
 * @fileoverview Section AST Node for ASON 2.0
 *
 * Represents a section (@section_name) in ASON 2.0 format.
 * Sections are organizational units that create nested objects.
 *
 * @module SectionNode
 * @license MIT
 * @version 2.0.0
 */

import { ASTNode, ObjectNode } from './ASTNode.js';

/**
 * AST node representing a section (@section_name).
 *
 * Sections create nested objects in the output:
 * @customer
 *   name:John
 * becomes: { customer: { name: "John" } }
 *
 * @class SectionNode
 * @extends ASTNode
 */
export class SectionNode extends ASTNode {
  /**
   * Creates a section node.
   *
   * @constructor
   * @param {string} name - Section name (without @ prefix)
   * @param {ObjectNode} content - Section content (object node)
   * @param {Object} [metadata={}] - Optional metadata
   *
   * @example
   * const section = new SectionNode('customer', new ObjectNode());
   * section.content.setProperty('name', new PrimitiveNode('John'));
   */
  constructor(name, content = new ObjectNode(), metadata = {}) {
    super('Section', metadata);

    /** @type {string} Section name (e.g., 'customer', 'order.items') */
    this.name = name;

    /** @type {ObjectNode} Section content */
    this.content = content;
  }

  accept(visitor) {
    return visitor.visitSection?.(this) ?? this.toValue();
  }

  /**
   * Converts section to a nested object.
   *
   * Handles dot notation in section names:
   * - 'customer' → { customer: {...} }
   * - 'order.items' → { order: { items: {...} } }
   *
   * @returns {Object} Nested object
   */
  toValue() {
    const value = this.content.toValue();

    // Handle nested section names (e.g., 'order.items')
    if (this.name.includes('.')) {
      const parts = this.name.split('.');
      let result = value;

      // Build from innermost to outermost
      for (let i = parts.length - 1; i >= 0; i--) {
        result = { [parts[i]]: result };
      }

      return result;
    }

    // Simple section
    return { [this.name]: value };
  }

  /**
   * Gets the root key of this section.
   *
   * For 'order.items', returns 'order'.
   * For 'customer', returns 'customer'.
   *
   * @returns {string} Root key
   */
  getRootKey() {
    return this.name.split('.')[0];
  }

  /**
   * Gets the path parts of this section.
   *
   * For 'order.items.pricing', returns ['order', 'items', 'pricing'].
   *
   * @returns {string[]} Path parts
   */
  getPathParts() {
    return this.name.split('.');
  }

  /**
   * Checks if this is a nested section (has dots).
   *
   * @returns {boolean} True if nested
   */
  isNested() {
    return this.name.includes('.');
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}Section(@${this.name}) {\n`;
    str += this.content.toString(indent + 1) + '\n';
    str += `${spaces}}`;
    return str;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      content: this.content.toJSON()
    };
  }
}
