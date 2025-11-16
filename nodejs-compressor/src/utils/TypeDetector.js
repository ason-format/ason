/**
 * @fileoverview Type Detector utility for ASON 2.0
 *
 * Provides utilities for detecting and validating data types.
 *
 * @module TypeDetector
 * @license MIT
 * @version 2.0.0
 */

/**
 * Type detection utilities.
 *
 * @class TypeDetector
 */
export class TypeDetector {
  /**
   * Checks if value is a primitive type.
   *
   * @static
   * @param {*} value - Value to check
   * @returns {boolean} True if primitive
   */
  static isPrimitive(value) {
    return value === null ||
           value === undefined ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
  }

  /**
   * Checks if value is a plain object (not array, not null).
   *
   * @static
   * @param {*} value - Value to check
   * @returns {boolean} True if plain object
   */
  static isPlainObject(value) {
    return value !== null &&
           typeof value === 'object' &&
           !Array.isArray(value) &&
           Object.prototype.toString.call(value) === '[object Object]';
  }

  /**
   * Checks if array contains only primitive values.
   *
   * @static
   * @param {Array} arr - Array to check
   * @returns {boolean} True if all primitives
   */
  static isArrayOfPrimitives(arr) {
    return Array.isArray(arr) && arr.every(item => this.isPrimitive(item));
  }

  /**
   * Checks if array contains only objects.
   *
   * @static
   * @param {Array} arr - Array to check
   * @returns {boolean} True if all objects
   */
  static isArrayOfObjects(arr) {
    return Array.isArray(arr) && arr.every(item => this.isPlainObject(item));
  }

  /**
   * Gets the JavaScript type of a value.
   *
   * @static
   * @param {*} value - Value to check
   * @returns {string} Type name
   */
  static getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Infers ASON type from JavaScript value.
   *
   * @static
   * @param {*} value - Value to infer type for
   * @returns {string} ASON type
   */
  static inferASONType(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float';
    }
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (this.isPlainObject(value)) return 'object';
    return 'unknown';
  }
}
