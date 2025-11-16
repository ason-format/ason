/**
 * @fileoverview Token types for ASON 2.0 Lexer
 *
 * Defines all token types used in the ASON 2.0 format specification.
 * Each token type represents a distinct syntactic element in the language.
 *
 * @module TokenType
 * @license MIT
 * @version 2.0.0
 */

/**
 * Enumeration of all ASON 2.0 token types.
 *
 * @enum {string}
 * @readonly
 */
export const TokenType = Object.freeze({
  // Structural delimiters
  /** Section marker: @section_name */
  SECTION: '@',

  /** Key-value separator: key:value */
  COLON: ':',

  /** Field separator in tabular arrays: value1|value2 */
  PIPE: '|',

  /** Array item marker (YAML-style): - item */
  DASH: '-',

  /** Line continuation */
  BACKSLASH: '\\',

  // Brackets and braces
  /** Object start: { */
  LBRACE: '{',

  /** Object end: } */
  RBRACE: '}',

  /** Array start or count indicator: [ */
  LBRACKET: '[',

  /** Array end: ] */
  RBRACKET: ']',

  // References
  /** Named variable reference: $var_name */
  VAR_REF: '$',

  /** Object alias reference: &obj0 */
  OBJ_REF: '&',

  /** Numeric reference (legacy, deprecated): #0 */
  NUM_REF: '#',

  // Reserved keywords
  /** Definitions section: $def: */
  DEF_KEYWORD: '$def:',

  /** Data section: $data: */
  DATA_KEYWORD: '$data:',

  // Value types
  /** String value (quoted or unquoted) */
  STRING: 'STRING',

  /** Numeric value: 123, 45.67, -3.14 */
  NUMBER: 'NUMBER',

  /** Boolean value: true, false */
  BOOLEAN: 'BOOLEAN',

  /** Null value: null */
  NULL: 'NULL',

  /** Identifier (key name or reference name) */
  IDENTIFIER: 'IDENTIFIER',

  // Whitespace and formatting
  /** Newline character(s): \n, \r\n, \r */
  NEWLINE: 'NEWLINE',

  /** Indentation (spaces or tabs) */
  INDENT: 'INDENT',

  /** Whitespace within a line */
  WHITESPACE: 'WHITESPACE',

  // Comments
  /** Single-line comment: # comment */
  COMMENT: 'COMMENT',

  /** Multi-line comment start: #| */
  COMMENT_START: 'COMMENT_START',

  /** Multi-line comment end: |# */
  COMMENT_END: 'COMMENT_END',

  // Special markers
  /** Array count and schema marker: [N]{fields} */
  ARRAY_MARKER: 'ARRAY_MARKER',

  /** Schema definition marker: :schema{} */
  SCHEMA_MARKER: 'SCHEMA_MARKER',

  /** Dot for path notation: a.b.c */
  DOT: '.',

  /** Comma (for inline arrays/objects) */
  COMMA: ',',

  // Control
  /** End of file */
  EOF: 'EOF',

  /** Unknown/error token */
  ERROR: 'ERROR'
});

/**
 * Helper function to check if a token type represents a value.
 *
 * @param {string} type - Token type to check
 * @returns {boolean} True if token type represents a value
 *
 * @example
 * isValueType(TokenType.STRING) // true
 * isValueType(TokenType.NUMBER) // true
 * isValueType(TokenType.COLON) // false
 */
export function isValueType(type) {
  return [
    TokenType.STRING,
    TokenType.NUMBER,
    TokenType.BOOLEAN,
    TokenType.NULL,
    TokenType.IDENTIFIER
  ].includes(type);
}

/**
 * Helper function to check if a token type represents a reference.
 *
 * @param {string} type - Token type to check
 * @returns {boolean} True if token type represents a reference
 *
 * @example
 * isReferenceType(TokenType.VAR_REF) // true
 * isReferenceType(TokenType.OBJ_REF) // true
 * isReferenceType(TokenType.STRING) // false
 */
export function isReferenceType(type) {
  return [
    TokenType.VAR_REF,
    TokenType.OBJ_REF,
    TokenType.NUM_REF
  ].includes(type);
}

/**
 * Helper function to check if a token type represents a bracket.
 *
 * @param {string} type - Token type to check
 * @returns {boolean} True if token type is a bracket
 */
export function isBracketType(type) {
  return [
    TokenType.LBRACE,
    TokenType.RBRACE,
    TokenType.LBRACKET,
    TokenType.RBRACKET
  ].includes(type);
}

/**
 * Helper function to check if a token should be ignored during parsing.
 *
 * @param {string} type - Token type to check
 * @returns {boolean} True if token should be ignored
 */
export function isIgnorableType(type) {
  return [
    TokenType.COMMENT,
    TokenType.COMMENT_START,
    TokenType.COMMENT_END,
    TokenType.WHITESPACE
  ].includes(type);
}

/**
 * Get a human-readable name for a token type.
 *
 * @param {string} type - Token type
 * @returns {string} Human-readable name
 *
 * @example
 * getTokenTypeName(TokenType.VAR_REF) // "variable reference ($)"
 * getTokenTypeName(TokenType.COLON) // "colon (:)"
 */
export function getTokenTypeName(type) {
  const names = {
    [TokenType.SECTION]: 'section marker (@)',
    [TokenType.COLON]: 'colon (:)',
    [TokenType.PIPE]: 'pipe (|)',
    [TokenType.DASH]: 'dash (-)',
    [TokenType.VAR_REF]: 'variable reference ($)',
    [TokenType.OBJ_REF]: 'object reference (&)',
    [TokenType.NUM_REF]: 'numeric reference (#)',
    [TokenType.LBRACE]: 'left brace ({)',
    [TokenType.RBRACE]: 'right brace (})',
    [TokenType.LBRACKET]: 'left bracket ([)',
    [TokenType.RBRACKET]: 'right bracket (])',
    [TokenType.DOT]: 'dot (.)',
    [TokenType.COMMA]: 'comma (,)',
    [TokenType.STRING]: 'string',
    [TokenType.NUMBER]: 'number',
    [TokenType.BOOLEAN]: 'boolean',
    [TokenType.NULL]: 'null',
    [TokenType.IDENTIFIER]: 'identifier',
    [TokenType.NEWLINE]: 'newline',
    [TokenType.EOF]: 'end of file'
  };

  return names[type] || type;
}
