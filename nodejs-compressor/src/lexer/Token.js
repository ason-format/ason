/**
 * @fileoverview Token class for ASON 2.0 Lexer
 *
 * Represents a single lexical token in the ASON 2.0 format.
 * Tokens are the atomic units produced by the lexer and consumed by the parser.
 *
 * @module Token
 * @license MIT
 * @version 2.0.0
 */

import { TokenType, getTokenTypeName } from './TokenType.js';

/**
 * Represents a single lexical token.
 *
 * @class Token
 *
 * @property {string} type - Token type from TokenType enum
 * @property {string} value - Raw string value of the token
 * @property {number} line - Line number where token appears (1-indexed)
 * @property {number} column - Column number where token starts (1-indexed)
 * @property {number} length - Length of the token in characters
 *
 * @example
 * const token = new Token(TokenType.STRING, 'hello', 1, 5);
 * console.log(token.toString()); // "STRING 'hello' at 1:5"
 */
export class Token {
  /**
   * Creates a new Token instance.
   *
   * @constructor
   * @param {string} type - Token type (from TokenType enum)
   * @param {string} value - Raw string value
   * @param {number} line - Line number (1-indexed)
   * @param {number} column - Column number (1-indexed)
   * @param {number} [length] - Length in characters (defaults to value.length)
   */
  constructor(type, value, line, column, length = value.length) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
    this.length = length;
  }

  /**
   * Checks if this token is of a specific type.
   *
   * @param {string|string[]} types - Token type(s) to check against
   * @returns {boolean} True if token matches any of the given types
   *
   * @example
   * token.is(TokenType.STRING) // true if token is a string
   * token.is([TokenType.STRING, TokenType.NUMBER]) // true if string or number
   */
  is(types) {
    if (Array.isArray(types)) {
      return types.includes(this.type);
    }
    return this.type === types;
  }

  /**
   * Checks if this token is NOT of a specific type.
   *
   * @param {string|string[]} types - Token type(s) to check against
   * @returns {boolean} True if token doesn't match any of the given types
   *
   * @example
   * token.isNot(TokenType.EOF) // true if not end of file
   */
  isNot(types) {
    return !this.is(types);
  }

  /**
   * Gets the end column of this token.
   *
   * @returns {number} Column number where token ends
   *
   * @example
   * const token = new Token(TokenType.STRING, 'hello', 1, 5);
   * token.endColumn() // 10 (5 + 5)
   */
  endColumn() {
    return this.column + this.length;
  }

  /**
   * Gets a human-readable position string.
   *
   * @returns {string} Position in format "line:column"
   *
   * @example
   * token.position() // "1:5"
   */
  position() {
    return `${this.line}:${this.column}`;
  }

  /**
   * Creates a debug-friendly string representation.
   *
   * @returns {string} String representation of the token
   *
   * @example
   * token.toString() // "STRING 'hello' at 1:5"
   */
  toString() {
    const typeName = getTokenTypeName(this.type);
    const displayValue = this.value.length > 20
      ? this.value.substring(0, 17) + '...'
      : this.value;

    return `${typeName} '${displayValue}' at ${this.position()}`;
  }

  /**
   * Creates a shallow copy of this token.
   *
   * @returns {Token} New token with same properties
   */
  clone() {
    return new Token(this.type, this.value, this.line, this.column, this.length);
  }

  /**
   * Checks if this token equals another token (by value and type).
   *
   * @param {Token} other - Token to compare with
   * @returns {boolean} True if tokens are equal
   */
  equals(other) {
    return other instanceof Token &&
           this.type === other.type &&
           this.value === other.value;
  }

  /**
   * Converts token to a simple object (useful for debugging/serialization).
   *
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      type: this.type,
      value: this.value,
      line: this.line,
      column: this.column,
      length: this.length
    };
  }

  /**
   * Creates a token from a plain object.
   *
   * @static
   * @param {Object} obj - Plain object with token properties
   * @returns {Token} New Token instance
   */
  static fromObject(obj) {
    return new Token(obj.type, obj.value, obj.line, obj.column, obj.length);
  }

  /**
   * Creates an EOF (end of file) token.
   *
   * @static
   * @param {number} line - Line number where EOF occurs
   * @param {number} column - Column number where EOF occurs
   * @returns {Token} EOF token
   */
  static eof(line, column) {
    return new Token(TokenType.EOF, '', line, column, 0);
  }

  /**
   * Creates an error token with a message.
   *
   * @static
   * @param {string} message - Error message
   * @param {number} line - Line number where error occurs
   * @param {number} column - Column number where error occurs
   * @returns {Token} Error token
   */
  static error(message, line, column) {
    return new Token(TokenType.ERROR, message, line, column, message.length);
  }

  /**
   * Creates a newline token.
   *
   * @static
   * @param {number} line - Line number
   * @param {number} column - Column number
   * @param {string} [value='\n'] - Newline character(s)
   * @returns {Token} Newline token
   */
  static newline(line, column, value = '\n') {
    return new Token(TokenType.NEWLINE, value, line, column, value.length);
  }

  /**
   * Creates an indent token.
   *
   * @static
   * @param {number} spaces - Number of spaces/indentation
   * @param {number} line - Line number
   * @param {number} column - Column number (usually 1)
   * @returns {Token} Indent token
   */
  static indent(spaces, line, column = 1) {
    const value = ' '.repeat(spaces);
    return new Token(TokenType.INDENT, value, line, column, spaces);
  }
}
