/**
 * @fileoverview Reference AST Node for ASON 2.0
 *
 * Represents references to defined values ($var) or objects (&obj).
 *
 * @module ReferenceNode
 * @license MIT
 * @version 2.0.0
 */

import { ASTNode } from './ASTNode.js';

/**
 * AST node representing a reference.
 *
 * References point to values defined in the $def: section:
 * - $var: named variable reference
 * - &obj: object alias reference
 * - #N: numeric reference (legacy, deprecated)
 *
 * @class ReferenceNode
 * @extends ASTNode
 */
export class ReferenceNode extends ASTNode {
  /**
   * Creates a reference node.
   *
   * @constructor
   * @param {string} name - Reference name (with prefix: $var, &obj, #0)
   * @param {'var'|'object'|'numeric'} refType - Type of reference
   * @param {Object} [metadata={}] - Optional metadata
   *
   * @example
   * const ref = new ReferenceNode('$email', 'var');
   */
  constructor(name, refType, metadata = {}) {
    super('Reference', metadata);

    /** @type {string} Full reference name (with prefix) */
    this.name = name;

    /** @type {'var'|'object'|'numeric'} Reference type */
    this.refType = refType;

    /** @type {ASTNode|null} Resolved value (set during resolution) */
    this.resolved = null;

    /** @type {boolean} Whether reference has been resolved */
    this.isResolved = false;
  }

  /**
   * Gets the reference name without prefix.
   *
   * @returns {string} Name without prefix
   *
   * @example
   * new ReferenceNode('$email', 'var').getBaseName() // 'email'
   * new ReferenceNode('&obj0', 'object').getBaseName() // 'obj0'
   */
  getBaseName() {
    return this.name.substring(1); // Remove first character (prefix)
  }

  /**
   * Gets the reference prefix.
   *
   * @returns {string} Prefix character ($, &, or #)
   */
  getPrefix() {
    return this.name.charAt(0);
  }

  /**
   * Resolves this reference to a value.
   *
   * @param {ASTNode} value - Resolved value
   */
  resolve(value) {
    this.resolved = value;
    this.isResolved = true;
  }

  /**
   * Checks if this is a variable reference ($var).
   *
   * @returns {boolean} True if variable reference
   */
  isVariableRef() {
    return this.refType === 'var';
  }

  /**
   * Checks if this is an object reference (&obj).
   *
   * @returns {boolean} True if object reference
   */
  isObjectRef() {
    return this.refType === 'object';
  }

  /**
   * Checks if this is a numeric reference (#N).
   *
   * @returns {boolean} True if numeric reference
   */
  isNumericRef() {
    return this.refType === 'numeric';
  }

  accept(visitor) {
    return visitor.visitReference?.(this) ?? this.toValue();
  }

  /**
   * Converts reference to its resolved value.
   *
   * @throws {Error} If reference is not resolved
   * @returns {*} Resolved value
   */
  toValue() {
    if (!this.isResolved) {
      throw new Error(`Unresolved reference: ${this.name}`);
    }
    return this.resolved.toValue();
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    const status = this.isResolved ? ' (resolved)' : ' (unresolved)';
    return `${spaces}Reference(${this.name})${status}`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      refType: this.refType,
      isResolved: this.isResolved,
      resolved: this.isResolved ? this.resolved.toJSON() : null
    };
  }
}

/**
 * AST node representing a definition ($def: section).
 *
 * Contains all reference definitions for the document.
 *
 * @class DefinitionNode
 * @extends ASTNode
 */
export class DefinitionNode extends ASTNode {
  /**
   * Creates a definition node.
   *
   * @constructor
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(metadata = {}) {
    super('Definition', metadata);

    /** @type {Map<string, ASTNode>} Variable definitions ($var) */
    this.variables = new Map();

    /** @type {Map<string, ASTNode>} Object definitions (&obj) */
    this.objects = new Map();

    /** @type {Map<string, ASTNode>} Numeric definitions (#N) - legacy */
    this.numeric = new Map();
  }

  /**
   * Adds a variable definition.
   *
   * @param {string} name - Variable name (with $ prefix)
   * @param {ASTNode} value - Variable value
   */
  defineVariable(name, value) {
    this.variables.set(name, value);
  }

  /**
   * Adds an object definition.
   *
   * @param {string} name - Object name (with & prefix)
   * @param {ASTNode} value - Object value
   */
  defineObject(name, value) {
    this.objects.set(name, value);
  }

  /**
   * Adds a numeric definition.
   *
   * @param {string} name - Numeric name (with # prefix)
   * @param {ASTNode} value - Value
   */
  defineNumeric(name, value) {
    this.numeric.set(name, value);
  }

  /**
   * Looks up a reference by name.
   *
   * @param {string} name - Reference name (with prefix)
   * @returns {ASTNode|undefined} Defined value or undefined
   */
  lookup(name) {
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
   * Gets all definitions.
   *
   * @returns {Map<string, ASTNode>} All definitions
   */
  getAllDefinitions() {
    const all = new Map();
    for (const [k, v] of this.variables) all.set(k, v);
    for (const [k, v] of this.objects) all.set(k, v);
    for (const [k, v] of this.numeric) all.set(k, v);
    return all;
  }

  accept(visitor) {
    return visitor.visitDefinition?.(this) ?? this.toValue();
  }

  toValue() {
    // Definitions don't have a direct value representation
    return null;
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}Definition {\n`;

    if (this.variables.size > 0) {
      str += `${spaces}  Variables:\n`;
      for (const [name, value] of this.variables) {
        str += `${spaces}    ${name}: ${value.toString(indent + 2).trim()}\n`;
      }
    }

    if (this.objects.size > 0) {
      str += `${spaces}  Objects:\n`;
      for (const [name, value] of this.objects) {
        str += `${spaces}    ${name}: ${value.toString(indent + 2).trim()}\n`;
      }
    }

    str += `${spaces}}`;
    return str;
  }

  toJSON() {
    const vars = {};
    const objs = {};

    for (const [k, v] of this.variables) vars[k] = v.toJSON();
    for (const [k, v] of this.objects) objs[k] = v.toJSON();

    return {
      ...super.toJSON(),
      variables: vars,
      objects: objs
    };
  }
}
