/**
 * @fileoverview Lexer for ASON 2.0 format
 *
 * Tokenizes ASON 2.0 text into a stream of tokens for the parser.
 * Handles all ASON 2.0 syntax including sections, arrays, references, and values.
 *
 * @module Lexer
 * @license MIT
 * @version 2.0.0
 */

import { Token } from './Token.js';
import { TokenType } from './TokenType.js';

/**
 * Lexical analyzer (tokenizer) for ASON 2.0 format.
 *
 * Converts raw text into a stream of tokens that can be parsed.
 * Maintains position tracking for error reporting.
 *
 * @class Lexer
 *
 * @example
 * const lexer = new Lexer('@customer\n  name:John');
 * const tokens = lexer.tokenize();
 */
export class Lexer {
  /**
   * Creates a new Lexer instance.
   *
   * @constructor
   * @param {string} input - ASON 2.0 text to tokenize
   */
  constructor(input) {
    /** @type {string} Raw input text */
    this.input = input;

    /** @type {number} Current position in input (0-indexed) */
    this.pos = 0;

    /** @type {number} Current line number (1-indexed) */
    this.line = 1;

    /** @type {number} Current column number (1-indexed) */
    this.column = 1;

    /** @type {Token[]} Accumulated tokens */
    this.tokens = [];
  }

  /**
   * Gets the current character without consuming it.
   *
   * @returns {string|null} Current character or null if at end
   */
  peek() {
    return this.pos < this.input.length ? this.input[this.pos] : null;
  }

  /**
   * Gets a character at offset from current position.
   *
   * @param {number} offset - Offset from current position
   * @returns {string|null} Character at offset or null
   */
  peekAt(offset) {
    const targetPos = this.pos + offset;
    return targetPos < this.input.length ? this.input[targetPos] : null;
  }

  /**
   * Consumes and returns the current character, advancing position.
   *
   * @returns {string|null} Current character or null if at end
   */
  advance() {
    if (this.pos >= this.input.length) return null;

    const char = this.input[this.pos];
    this.pos++;

    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  }

  /**
   * Checks if current position is at end of input.
   *
   * @returns {boolean} True if at end of input
   */
  isAtEnd() {
    return this.pos >= this.input.length;
  }

  /**
   * Skips whitespace characters (spaces and tabs only, not newlines).
   *
   * @returns {number} Number of spaces skipped
   */
  skipWhitespace() {
    let count = 0;
    while (this.peek() === ' ' || this.peek() === '\t') {
      this.advance();
      count++;
    }
    return count;
  }

  /**
   * Checks if a character is a valid identifier start character.
   *
   * @param {string} char - Character to check
   * @returns {boolean} True if valid identifier start
   */
  isIdentifierStart(char) {
    if (!char) return false;
    return /[a-zA-Z_]/.test(char);
  }

  /**
   * Checks if a character is a valid identifier character.
   *
   * @param {string} char - Character to check
   * @returns {boolean} True if valid identifier character
   */
  isIdentifierChar(char) {
    if (!char) return false;
    return /[a-zA-Z0-9_]/.test(char);
  }

  /**
   * Checks if a character is a digit.
   *
   * @param {string} char - Character to check
   * @returns {boolean} True if digit
   */
  isDigit(char) {
    if (!char) return false;
    return /[0-9]/.test(char);
  }

  /**
   * Tokenizes the entire input.
   *
   * @returns {Token[]} Array of tokens
   */
  tokenize() {
    this.tokens = [];

    while (!this.isAtEnd()) {
      this.tokenizeNext();
    }

    // Add EOF token
    this.tokens.push(Token.eof(this.line, this.column));

    return this.tokens;
  }

  /**
   * Tokenizes the next token from current position.
   */
  tokenizeNext() {
    const char = this.peek();
    const startLine = this.line;
    const startColumn = this.column;

    // Newline
    if (char === '\n' || char === '\r') {
      this.tokenizeNewline();
      return;
    }

    // Whitespace (indentation at start of line)
    if (char === ' ' || char === '\t') {
      // Only create INDENT token at start of line
      if (this.column === 1 || this.tokens.length === 0 ||
          this.tokens[this.tokens.length - 1].type === TokenType.NEWLINE) {
        const spaces = this.skipWhitespace();
        if (spaces > 0) {
          this.tokens.push(Token.indent(spaces, startLine, startColumn));
        }
      } else {
        // Skip inline whitespace
        this.skipWhitespace();
      }
      return;
    }

    // Comment
    if (char === '#') {
      this.tokenizeComment();
      return;
    }

    // Section marker
    if (char === '@') {
      this.tokenizeSection();
      return;
    }

    // Colon
    if (char === ':') {
      this.advance();
      this.tokens.push(new Token(TokenType.COLON, ':', startLine, startColumn, 1));
      return;
    }

    // Pipe
    if (char === '|') {
      this.advance();
      this.tokens.push(new Token(TokenType.PIPE, '|', startLine, startColumn, 1));
      return;
    }

    // Number (including negative) - Check BEFORE dash to handle negative numbers
    if (this.isDigit(char) || (char === '-' && this.isDigit(this.peekAt(1)))) {
      this.tokenizeNumber();
      return;
    }

    // Dash (array item) - Only if not followed by digit (negative numbers handled above)
    if (char === '-') {
      this.advance();
      this.tokens.push(new Token(TokenType.DASH, '-', startLine, startColumn, 1));
      return;
    }

    // Left brace
    if (char === '{') {
      this.advance();
      this.tokens.push(new Token(TokenType.LBRACE, '{', startLine, startColumn, 1));
      return;
    }

    // Right brace
    if (char === '}') {
      this.advance();
      this.tokens.push(new Token(TokenType.RBRACE, '}', startLine, startColumn, 1));
      return;
    }

    // Left bracket
    if (char === '[') {
      this.advance();
      this.tokens.push(new Token(TokenType.LBRACKET, '[', startLine, startColumn, 1));
      return;
    }

    // Right bracket
    if (char === ']') {
      this.advance();
      this.tokens.push(new Token(TokenType.RBRACKET, ']', startLine, startColumn, 1));
      return;
    }

    // Comma
    if (char === ',') {
      this.advance();
      this.tokens.push(new Token(TokenType.COMMA, ',', startLine, startColumn, 1));
      return;
    }

    // Dot
    if (char === '.') {
      this.advance();
      this.tokens.push(new Token(TokenType.DOT, '.', startLine, startColumn, 1));
      return;
    }

    // Variable reference ($var)
    if (char === '$') {
      this.tokenizeReference('$', TokenType.VAR_REF);
      return;
    }

    // Object reference (&obj)
    if (char === '&') {
      this.tokenizeReference('&', TokenType.OBJ_REF);
      return;
    }

    // Quoted string
    if (char === '"' || char === "'") {
      this.tokenizeQuotedString(char);
      return;
    }

    // Identifier, keyword, or unquoted string
    if (this.isIdentifierStart(char)) {
      this.tokenizeIdentifierOrKeyword();
      return;
    }

    // Unknown character - skip it
    this.advance();
  }

  /**
   * Tokenizes a newline (handles \n, \r\n, \r).
   */
  tokenizeNewline() {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    if (this.peek() === '\r' && this.peekAt(1) === '\n') {
      value = this.advance() + this.advance();
    } else {
      value = this.advance();
    }

    this.tokens.push(new Token(TokenType.NEWLINE, value, startLine, startColumn, value.length));
  }

  /**
   * Tokenizes a comment (# or #| |#).
   */
  tokenizeComment() {
    const startLine = this.line;
    const startColumn = this.column;

    this.advance(); // consume #

    // Multi-line comment start #|
    if (this.peek() === '|') {
      this.advance(); // consume |
      this.tokens.push(new Token(TokenType.COMMENT_START, '#|', startLine, startColumn, 2));
      return;
    }

    // Single-line comment - consume until newline
    let value = '#';
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      value += this.advance();
    }

    this.tokens.push(new Token(TokenType.COMMENT, value, startLine, startColumn, value.length));
  }

  /**
   * Tokenizes a section marker (@section_name).
   */
  tokenizeSection() {
    const startLine = this.line;
    const startColumn = this.column;

    this.advance(); // consume @

    // Read section name (identifier)
    let name = '';
    while (this.isIdentifierChar(this.peek()) || this.peek() === '.') {
      name += this.advance();
    }

    const value = '@' + name;
    this.tokens.push(new Token(TokenType.SECTION, value, startLine, startColumn, value.length));
  }

  /**
   * Tokenizes a reference ($var or &obj).
   *
   * @param {string} prefix - Reference prefix ($ or &)
   * @param {string} type - Token type
   */
  tokenizeReference(prefix, type) {
    const startLine = this.line;
    const startColumn = this.column;

    this.advance(); // consume prefix

    // Check for keywords like $def: or $data:
    if (prefix === '$') {
      const remaining = this.input.substring(this.pos, this.pos + 5);
      if (remaining.startsWith('def:')) {
        this.advance(); this.advance(); this.advance(); this.advance(); // consume 'def:'
        this.tokens.push(new Token(TokenType.DEF_KEYWORD, '$def:', startLine, startColumn, 5));
        return;
      }
      if (remaining.startsWith('data:')) {
        this.advance(); this.advance(); this.advance(); this.advance(); this.advance(); // consume 'data:'
        this.tokens.push(new Token(TokenType.DATA_KEYWORD, '$data:', startLine, startColumn, 6));
        return;
      }
    }

    // Read reference name
    let name = '';
    while (this.isIdentifierChar(this.peek())) {
      name += this.advance();
    }

    const value = prefix + name;
    this.tokens.push(new Token(type, value, startLine, startColumn, value.length));
  }

  /**
   * Tokenizes a quoted string (supports " and ').
   *
   * @param {string} quote - Quote character (" or ')
   */
  tokenizeQuotedString(quote) {
    const startLine = this.line;
    const startColumn = this.column;

    this.advance(); // consume opening quote

    let value = '';
    let escaped = false;

    while (!this.isAtEnd()) {
      const char = this.peek();

      if (escaped) {
        value += this.advance();
        escaped = false;
      } else if (char === '\\') {
        value += this.advance();
        escaped = true;
      } else if (char === quote) {
        this.advance(); // consume closing quote
        break;
      } else {
        value += this.advance();
      }
    }

    // Return the value WITH quotes so parser can distinguish quoted vs unquoted
    const fullValue = quote + value + quote;
    this.tokens.push(new Token(TokenType.STRING, fullValue, startLine, startColumn, fullValue.length));
  }

  /**
   * Tokenizes a number (integer or float, including negative).
   */
  tokenizeNumber() {
    const startLine = this.line;
    const startColumn = this.column;

    let value = '';

    // Handle negative sign
    if (this.peek() === '-') {
      value += this.advance();
    }

    // Read digits
    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Read decimal part
    if (this.peek() === '.' && this.isDigit(this.peekAt(1))) {
      value += this.advance(); // consume .
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    // Read scientific notation (e.g., 1.5e10, 2e-3)
    // Only consume 'e'/'E' if followed by digits (optionally preceded by +/-)
    if (this.peek() === 'e' || this.peek() === 'E') {
      const nextChar = this.peekAt(1);
      const hasSign = nextChar === '+' || nextChar === '-';
      const charAfterSign = hasSign ? this.peekAt(2) : nextChar;

      // Only treat as scientific notation if there's a digit after e/E (and optional sign)
      if (this.isDigit(charAfterSign)) {
        value += this.advance(); // consume 'e' or 'E'
        if (hasSign) {
          value += this.advance(); // consume '+' or '-'
        }
        while (this.isDigit(this.peek())) {
          value += this.advance();
        }
      }
    }

    this.tokens.push(new Token(TokenType.NUMBER, value, startLine, startColumn, value.length));
  }

  /**
   * Tokenizes an identifier, keyword, or unquoted string value.
   */
  tokenizeIdentifierOrKeyword() {
    const startLine = this.line;
    const startColumn = this.column;

    let value = '';

    // Read identifier characters
    while (this.isIdentifierChar(this.peek()) || this.peek() === '.') {
      value += this.advance();
    }

    // Check for keywords (true, false, null)
    if (value === 'true' || value === 'false') {
      this.tokens.push(new Token(TokenType.BOOLEAN, value, startLine, startColumn, value.length));
      return;
    }

    if (value === 'null') {
      this.tokens.push(new Token(TokenType.NULL, value, startLine, startColumn, value.length));
      return;
    }

    // Otherwise it's an identifier or unquoted string
    this.tokens.push(new Token(TokenType.IDENTIFIER, value, startLine, startColumn, value.length));
  }

  /**
   * Filters out ignorable tokens (comments, whitespace).
   *
   * @param {Token[]} tokens - Tokens to filter
   * @returns {Token[]} Filtered tokens
   */
  static filterIgnorable(tokens) {
    return tokens.filter(token =>
      token.type !== TokenType.COMMENT &&
      token.type !== TokenType.COMMENT_START &&
      token.type !== TokenType.COMMENT_END
    );
  }
}
