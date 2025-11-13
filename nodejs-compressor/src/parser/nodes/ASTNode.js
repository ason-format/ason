/**
 * @fileoverview Base AST Node class for ASON 2.0
 *
 * Abstract base class for all Abstract Syntax Tree nodes.
 * Provides common functionality for traversal, serialization, and debugging.
 *
 * @module ASTNode
 * @license MIT
 * @version 2.0.0
 */

/**
 * Base class for all AST nodes.
 *
 * @abstract
 * @class ASTNode
 */
export class ASTNode {
  /**
   * Creates a new AST node.
   *
   * @constructor
   * @param {string} type - Node type identifier
   * @param {Object} [metadata={}] - Optional metadata (line, column, etc.)
   */
  constructor(type, metadata = {}) {
    /** @type {string} Node type identifier */
    this.type = type;

    /** @type {Object} Metadata (position, comments, etc.) */
    this.metadata = metadata;
  }

  /**
   * Accepts a visitor for the visitor pattern.
   *
   * @abstract
   * @param {Object} visitor - Visitor object with visit methods
   * @returns {*} Result of visit operation
   */
  accept(visitor) {
    throw new Error('accept() must be implemented by subclass');
  }

  /**
   * Converts this node to a plain JavaScript value.
   *
   * @abstract
   * @returns {*} JavaScript representation
   */
  toValue() {
    throw new Error('toValue() must be implemented by subclass');
  }

  /**
   * Creates a debug-friendly string representation.
   *
   * @param {number} [indent=0] - Indentation level
   * @returns {string} String representation
   */
  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    return `${spaces}${this.type}`;
  }

  /**
   * Converts node to JSON (for debugging/serialization).
   *
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      type: this.type,
      ...this.metadata
    };
  }
}

/**
 * AST node for primitive values (string, number, boolean, null).
 *
 * @class PrimitiveNode
 * @extends ASTNode
 */
export class PrimitiveNode extends ASTNode {
  /**
   * Creates a primitive value node.
   *
   * @constructor
   * @param {*} value - Primitive value
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(value, metadata = {}) {
    super('Primitive', metadata);
    this.value = value;
  }

  accept(visitor) {
    return visitor.visitPrimitive?.(this) ?? this.toValue();
  }

  toValue() {
    return this.value;
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    const displayValue = typeof this.value === 'string'
      ? `"${this.value}"`
      : String(this.value);
    return `${spaces}Primitive(${displayValue})`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value
    };
  }
}

/**
 * AST node for objects (key-value pairs).
 *
 * @class ObjectNode
 * @extends ASTNode
 */
export class ObjectNode extends ASTNode {
  /**
   * Creates an object node.
   *
   * @constructor
   * @param {Map<string, ASTNode>} properties - Object properties
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(properties = new Map(), metadata = {}) {
    super('Object', metadata);
    this.properties = properties;
  }

  accept(visitor) {
    return visitor.visitObject?.(this) ?? this.toValue();
  }

  toValue() {
    const obj = {};
    for (const [key, valueNode] of this.properties.entries()) {
      obj[key] = valueNode.toValue();
    }
    return obj;
  }

  /**
   * Sets a property on this object.
   *
   * @param {string} key - Property key
   * @param {ASTNode} value - Property value node
   */
  setProperty(key, value) {
    this.properties.set(key, value);
  }

  /**
   * Gets a property from this object.
   *
   * @param {string} key - Property key
   * @returns {ASTNode|undefined} Property value node
   */
  getProperty(key) {
    return this.properties.get(key);
  }

  /**
   * Checks if object has a property.
   *
   * @param {string} key - Property key
   * @returns {boolean} True if property exists
   */
  hasProperty(key) {
    return this.properties.has(key);
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}Object {\n`;
    for (const [key, value] of this.properties.entries()) {
      str += `${spaces}  ${key}: ${value.toString(indent + 1).trim()}\n`;
    }
    str += `${spaces}}`;
    return str;
  }

  toJSON() {
    const props = {};
    for (const [key, value] of this.properties.entries()) {
      props[key] = value.toJSON();
    }
    return {
      ...super.toJSON(),
      properties: props
    };
  }
}

/**
 * AST node for arrays.
 *
 * @class ArrayNode
 * @extends ASTNode
 */
export class ArrayNode extends ASTNode {
  /**
   * Creates an array node.
   *
   * @constructor
   * @param {ASTNode[]} elements - Array elements
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(elements = [], metadata = {}) {
    super('Array', metadata);
    this.elements = elements;
  }

  accept(visitor) {
    return visitor.visitArray?.(this) ?? this.toValue();
  }

  toValue() {
    return this.elements.map(el => el.toValue());
  }

  /**
   * Adds an element to the array.
   *
   * @param {ASTNode} element - Element to add
   */
  addElement(element) {
    this.elements.push(element);
  }

  /**
   * Gets the array length.
   *
   * @returns {number} Number of elements
   */
  get length() {
    return this.elements.length;
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    if (this.elements.length === 0) return `${spaces}Array []`;

    let str = `${spaces}Array [\n`;
    for (const el of this.elements) {
      str += el.toString(indent + 1) + '\n';
    }
    str += `${spaces}]`;
    return str;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      elements: this.elements.map(el => el.toJSON())
    };
  }
}
