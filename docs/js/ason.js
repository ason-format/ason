// src/lexer/TokenType.js
var TokenType = Object.freeze({
  // Structural delimiters
  /** Section marker: @section_name */
  SECTION: "@",
  /** Key-value separator: key:value */
  COLON: ":",
  /** Field separator in tabular arrays: value1|value2 */
  PIPE: "|",
  /** Array item marker (YAML-style): - item */
  DASH: "-",
  /** Line continuation */
  BACKSLASH: "\\",
  // Brackets and braces
  /** Object start: { */
  LBRACE: "{",
  /** Object end: } */
  RBRACE: "}",
  /** Array start or count indicator: [ */
  LBRACKET: "[",
  /** Array end: ] */
  RBRACKET: "]",
  // References
  /** Named variable reference: $var_name */
  VAR_REF: "$",
  /** Object alias reference: &obj0 */
  OBJ_REF: "&",
  /** Numeric reference (legacy, deprecated): #0 */
  NUM_REF: "#",
  // Reserved keywords
  /** Definitions section: $def: */
  DEF_KEYWORD: "$def:",
  /** Data section: $data: */
  DATA_KEYWORD: "$data:",
  // Value types
  /** String value (quoted or unquoted) */
  STRING: "STRING",
  /** Numeric value: 123, 45.67, -3.14 */
  NUMBER: "NUMBER",
  /** Boolean value: true, false */
  BOOLEAN: "BOOLEAN",
  /** Null value: null */
  NULL: "NULL",
  /** Identifier (key name or reference name) */
  IDENTIFIER: "IDENTIFIER",
  // Whitespace and formatting
  /** Newline character(s): \n, \r\n, \r */
  NEWLINE: "NEWLINE",
  /** Indentation (spaces or tabs) */
  INDENT: "INDENT",
  /** Whitespace within a line */
  WHITESPACE: "WHITESPACE",
  // Comments
  /** Single-line comment: # comment */
  COMMENT: "COMMENT",
  /** Multi-line comment start: #| */
  COMMENT_START: "COMMENT_START",
  /** Multi-line comment end: |# */
  COMMENT_END: "COMMENT_END",
  // Special markers
  /** Array count and schema marker: [N]{fields} */
  ARRAY_MARKER: "ARRAY_MARKER",
  /** Schema definition marker: :schema{} */
  SCHEMA_MARKER: "SCHEMA_MARKER",
  /** Dot for path notation: a.b.c */
  DOT: ".",
  /** Comma (for inline arrays/objects) */
  COMMA: ",",
  // Control
  /** End of file */
  EOF: "EOF",
  /** Unknown/error token */
  ERROR: "ERROR"
});
function getTokenTypeName(type) {
  const names = {
    [TokenType.SECTION]: "section marker (@)",
    [TokenType.COLON]: "colon (:)",
    [TokenType.PIPE]: "pipe (|)",
    [TokenType.DASH]: "dash (-)",
    [TokenType.VAR_REF]: "variable reference ($)",
    [TokenType.OBJ_REF]: "object reference (&)",
    [TokenType.NUM_REF]: "numeric reference (#)",
    [TokenType.LBRACE]: "left brace ({)",
    [TokenType.RBRACE]: "right brace (})",
    [TokenType.LBRACKET]: "left bracket ([)",
    [TokenType.RBRACKET]: "right bracket (])",
    [TokenType.DOT]: "dot (.)",
    [TokenType.COMMA]: "comma (,)",
    [TokenType.STRING]: "string",
    [TokenType.NUMBER]: "number",
    [TokenType.BOOLEAN]: "boolean",
    [TokenType.NULL]: "null",
    [TokenType.IDENTIFIER]: "identifier",
    [TokenType.NEWLINE]: "newline",
    [TokenType.EOF]: "end of file"
  };
  return names[type] || type;
}

// src/lexer/Token.js
var Token = class _Token {
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
    const displayValue = this.value.length > 20 ? this.value.substring(0, 17) + "..." : this.value;
    return `${typeName} '${displayValue}' at ${this.position()}`;
  }
  /**
   * Creates a shallow copy of this token.
   *
   * @returns {Token} New token with same properties
   */
  clone() {
    return new _Token(this.type, this.value, this.line, this.column, this.length);
  }
  /**
   * Checks if this token equals another token (by value and type).
   *
   * @param {Token} other - Token to compare with
   * @returns {boolean} True if tokens are equal
   */
  equals(other) {
    return other instanceof _Token && this.type === other.type && this.value === other.value;
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
    return new _Token(obj.type, obj.value, obj.line, obj.column, obj.length);
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
    return new _Token(TokenType.EOF, "", line, column, 0);
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
    return new _Token(TokenType.ERROR, message, line, column, message.length);
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
  static newline(line, column, value = "\n") {
    return new _Token(TokenType.NEWLINE, value, line, column, value.length);
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
    const value = " ".repeat(spaces);
    return new _Token(TokenType.INDENT, value, line, column, spaces);
  }
};

// src/lexer/Lexer.js
var Lexer = class {
  /**
   * Creates a new Lexer instance.
   *
   * @constructor
   * @param {string} input - ASON 2.0 text to tokenize
   */
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
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
    if (char === "\n") {
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
    while (this.peek() === " " || this.peek() === "	") {
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
    if (char === "\n" || char === "\r") {
      this.tokenizeNewline();
      return;
    }
    if (char === " " || char === "	") {
      if (this.column === 1 || this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type === TokenType.NEWLINE) {
        const spaces = this.skipWhitespace();
        if (spaces > 0) {
          this.tokens.push(Token.indent(spaces, startLine, startColumn));
        }
      } else {
        this.skipWhitespace();
      }
      return;
    }
    if (char === "#") {
      this.tokenizeComment();
      return;
    }
    if (char === "@") {
      this.tokenizeSection();
      return;
    }
    if (char === ":") {
      this.advance();
      this.tokens.push(new Token(TokenType.COLON, ":", startLine, startColumn, 1));
      return;
    }
    if (char === "|") {
      this.advance();
      this.tokens.push(new Token(TokenType.PIPE, "|", startLine, startColumn, 1));
      return;
    }
    if (this.isDigit(char) || char === "-" && this.isDigit(this.peekAt(1))) {
      this.tokenizeNumber();
      return;
    }
    if (char === "-") {
      this.advance();
      this.tokens.push(new Token(TokenType.DASH, "-", startLine, startColumn, 1));
      return;
    }
    if (char === "{") {
      this.advance();
      this.tokens.push(new Token(TokenType.LBRACE, "{", startLine, startColumn, 1));
      return;
    }
    if (char === "}") {
      this.advance();
      this.tokens.push(new Token(TokenType.RBRACE, "}", startLine, startColumn, 1));
      return;
    }
    if (char === "[") {
      this.advance();
      this.tokens.push(new Token(TokenType.LBRACKET, "[", startLine, startColumn, 1));
      return;
    }
    if (char === "]") {
      this.advance();
      this.tokens.push(new Token(TokenType.RBRACKET, "]", startLine, startColumn, 1));
      return;
    }
    if (char === ",") {
      this.advance();
      this.tokens.push(new Token(TokenType.COMMA, ",", startLine, startColumn, 1));
      return;
    }
    if (char === ".") {
      this.advance();
      this.tokens.push(new Token(TokenType.DOT, ".", startLine, startColumn, 1));
      return;
    }
    if (char === "$") {
      this.tokenizeReference("$", TokenType.VAR_REF);
      return;
    }
    if (char === "&") {
      this.tokenizeReference("&", TokenType.OBJ_REF);
      return;
    }
    if (char === '"' || char === "'") {
      this.tokenizeQuotedString(char);
      return;
    }
    if (this.isIdentifierStart(char)) {
      this.tokenizeIdentifierOrKeyword();
      return;
    }
    this.advance();
  }
  /**
   * Tokenizes a newline (handles \n, \r\n, \r).
   */
  tokenizeNewline() {
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";
    if (this.peek() === "\r" && this.peekAt(1) === "\n") {
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
    this.advance();
    if (this.peek() === "|") {
      this.advance();
      this.tokens.push(new Token(TokenType.COMMENT_START, "#|", startLine, startColumn, 2));
      return;
    }
    let value = "#";
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
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
    this.advance();
    let name = "";
    while (this.isIdentifierChar(this.peek()) || this.peek() === ".") {
      name += this.advance();
    }
    const value = "@" + name;
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
    this.advance();
    if (prefix === "$") {
      const remaining = this.input.substring(this.pos, this.pos + 5);
      if (remaining.startsWith("def:")) {
        this.advance();
        this.advance();
        this.advance();
        this.advance();
        this.tokens.push(new Token(TokenType.DEF_KEYWORD, "$def:", startLine, startColumn, 5));
        return;
      }
      if (remaining.startsWith("data:")) {
        this.advance();
        this.advance();
        this.advance();
        this.advance();
        this.advance();
        this.tokens.push(new Token(TokenType.DATA_KEYWORD, "$data:", startLine, startColumn, 6));
        return;
      }
    }
    let name = "";
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
    this.advance();
    let value = "";
    let escaped = false;
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (escaped) {
        value += this.advance();
        escaped = false;
      } else if (char === "\\") {
        value += this.advance();
        escaped = true;
      } else if (char === quote) {
        this.advance();
        break;
      } else {
        value += this.advance();
      }
    }
    const fullValue = quote + value + quote;
    this.tokens.push(new Token(TokenType.STRING, fullValue, startLine, startColumn, fullValue.length));
  }
  /**
   * Tokenizes a number (integer or float, including negative).
   */
  tokenizeNumber() {
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";
    if (this.peek() === "-") {
      value += this.advance();
    }
    while (this.isDigit(this.peek())) {
      value += this.advance();
    }
    if (this.peek() === "." && this.isDigit(this.peekAt(1))) {
      value += this.advance();
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    if (this.peek() === "e" || this.peek() === "E") {
      const nextChar = this.peekAt(1);
      const hasSign = nextChar === "+" || nextChar === "-";
      const charAfterSign = hasSign ? this.peekAt(2) : nextChar;
      if (this.isDigit(charAfterSign)) {
        value += this.advance();
        if (hasSign) {
          value += this.advance();
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
    let value = "";
    while (this.isIdentifierChar(this.peek()) || this.peek() === ".") {
      value += this.advance();
    }
    if (value === "true" || value === "false") {
      this.tokens.push(new Token(TokenType.BOOLEAN, value, startLine, startColumn, value.length));
      return;
    }
    if (value === "null") {
      this.tokens.push(new Token(TokenType.NULL, value, startLine, startColumn, value.length));
      return;
    }
    this.tokens.push(new Token(TokenType.IDENTIFIER, value, startLine, startColumn, value.length));
  }
  /**
   * Filters out ignorable tokens (comments, whitespace).
   *
   * @param {Token[]} tokens - Tokens to filter
   * @returns {Token[]} Filtered tokens
   */
  static filterIgnorable(tokens) {
    return tokens.filter(
      (token) => token.type !== TokenType.COMMENT && token.type !== TokenType.COMMENT_START && token.type !== TokenType.COMMENT_END
    );
  }
};

// src/parser/nodes/ASTNode.js
var ASTNode = class {
  /**
   * Creates a new AST node.
   *
   * @constructor
   * @param {string} type - Node type identifier
   * @param {Object} [metadata={}] - Optional metadata (line, column, etc.)
   */
  constructor(type, metadata = {}) {
    this.type = type;
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
    throw new Error("accept() must be implemented by subclass");
  }
  /**
   * Converts this node to a plain JavaScript value.
   *
   * @abstract
   * @returns {*} JavaScript representation
   */
  toValue() {
    throw new Error("toValue() must be implemented by subclass");
  }
  /**
   * Creates a debug-friendly string representation.
   *
   * @param {number} [indent=0] - Indentation level
   * @returns {string} String representation
   */
  toString(indent = 0) {
    const spaces = "  ".repeat(indent);
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
};
var PrimitiveNode = class extends ASTNode {
  /**
   * Creates a primitive value node.
   *
   * @constructor
   * @param {*} value - Primitive value
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(value, metadata = {}) {
    super("Primitive", metadata);
    this.value = value;
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitPrimitive) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
  }
  toValue() {
    return this.value;
  }
  toString(indent = 0) {
    const spaces = "  ".repeat(indent);
    const displayValue = typeof this.value === "string" ? `"${this.value}"` : String(this.value);
    return `${spaces}Primitive(${displayValue})`;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value
    };
  }
};
var ObjectNode = class extends ASTNode {
  /**
   * Creates an object node.
   *
   * @constructor
   * @param {Map<string, ASTNode>} properties - Object properties
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(properties = /* @__PURE__ */ new Map(), metadata = {}) {
    super("Object", metadata);
    this.properties = properties;
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitObject) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
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
    const spaces = "  ".repeat(indent);
    let str = `${spaces}Object {
`;
    for (const [key, value] of this.properties.entries()) {
      str += `${spaces}  ${key}: ${value.toString(indent + 1).trim()}
`;
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
};
var ArrayNode = class extends ASTNode {
  /**
   * Creates an array node.
   *
   * @constructor
   * @param {ASTNode[]} elements - Array elements
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(elements = [], metadata = {}) {
    super("Array", metadata);
    this.elements = elements;
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitArray) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
  }
  toValue() {
    return this.elements.map((el) => el.toValue());
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
    const spaces = "  ".repeat(indent);
    if (this.elements.length === 0) return `${spaces}Array []`;
    let str = `${spaces}Array [
`;
    for (const el of this.elements) {
      str += el.toString(indent + 1) + "\n";
    }
    str += `${spaces}]`;
    return str;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      elements: this.elements.map((el) => el.toJSON())
    };
  }
};

// src/parser/nodes/SectionNode.js
var SectionNode = class extends ASTNode {
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
    super("Section", metadata);
    this.name = name;
    this.content = content;
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitSection) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
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
    if (this.name.includes(".")) {
      const parts = this.name.split(".");
      let result = value;
      for (let i = parts.length - 1; i >= 0; i--) {
        result = { [parts[i]]: result };
      }
      return result;
    }
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
    return this.name.split(".")[0];
  }
  /**
   * Gets the path parts of this section.
   *
   * For 'order.items.pricing', returns ['order', 'items', 'pricing'].
   *
   * @returns {string[]} Path parts
   */
  getPathParts() {
    return this.name.split(".");
  }
  /**
   * Checks if this is a nested section (has dots).
   *
   * @returns {boolean} True if nested
   */
  isNested() {
    return this.name.includes(".");
  }
  toString(indent = 0) {
    const spaces = "  ".repeat(indent);
    let str = `${spaces}Section(@${this.name}) {
`;
    str += this.content.toString(indent + 1) + "\n";
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
};

// src/parser/nodes/TabularArrayNode.js
var TabularArrayNode = class extends ArrayNode {
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
    this.type = "TabularArray";
    this.schema = schema;
    this.expectedCount = metadata.expectedCount ?? null;
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitTabularArray) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
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
    if (this.expectedCount !== null && this.elements.length !== this.expectedCount) {
      errors.push(
        `Expected ${this.expectedCount} rows, got ${this.elements.length}`
      );
    }
    for (let i = 0; i < this.elements.length; i++) {
      const row = this.elements[i];
      if (!(row instanceof ObjectNode)) {
        errors.push(`Row ${i} is not an object`);
        continue;
      }
      for (const field of this.schema) {
        if (!row.hasProperty(field)) {
          errors.push(`Row ${i} missing required field: ${field}`);
        }
      }
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
    return this.elements.every(
      (row) => row instanceof ObjectNode && row.properties.size === this.schema.length && this.schema.every((field) => row.hasProperty(field))
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
    return row == null ? void 0 : row.getProperty(field);
  }
  toString(indent = 0) {
    const spaces = "  ".repeat(indent);
    let str = `${spaces}TabularArray [${this.rowCount}]{${this.schema.join(",")}} [
`;
    for (const row of this.elements) {
      str += row.toString(indent + 1) + "\n";
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
};

// src/parser/nodes/ReferenceNode.js
var ReferenceNode = class extends ASTNode {
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
    super("Reference", metadata);
    this.name = name;
    this.refType = refType;
    this.resolved = null;
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
    return this.name.substring(1);
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
    return this.refType === "var";
  }
  /**
   * Checks if this is an object reference (&obj).
   *
   * @returns {boolean} True if object reference
   */
  isObjectRef() {
    return this.refType === "object";
  }
  /**
   * Checks if this is a numeric reference (#N).
   *
   * @returns {boolean} True if numeric reference
   */
  isNumericRef() {
    return this.refType === "numeric";
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitReference) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
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
    const spaces = "  ".repeat(indent);
    const status = this.isResolved ? " (resolved)" : " (unresolved)";
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
};
var DefinitionNode = class extends ASTNode {
  /**
   * Creates a definition node.
   *
   * @constructor
   * @param {Object} [metadata={}] - Optional metadata
   */
  constructor(metadata = {}) {
    super("Definition", metadata);
    this.variables = /* @__PURE__ */ new Map();
    this.objects = /* @__PURE__ */ new Map();
    this.numeric = /* @__PURE__ */ new Map();
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
    if (prefix === "$") {
      return this.variables.get(name);
    } else if (prefix === "&") {
      return this.objects.get(name);
    } else if (prefix === "#") {
      return this.numeric.get(name);
    }
    return void 0;
  }
  /**
   * Gets all definitions.
   *
   * @returns {Map<string, ASTNode>} All definitions
   */
  getAllDefinitions() {
    const all = /* @__PURE__ */ new Map();
    for (const [k, v] of this.variables) all.set(k, v);
    for (const [k, v] of this.objects) all.set(k, v);
    for (const [k, v] of this.numeric) all.set(k, v);
    return all;
  }
  accept(visitor) {
    var _a;
    return ((_a = visitor.visitDefinition) == null ? void 0 : _a.call(visitor, this)) ?? this.toValue();
  }
  toValue() {
    return null;
  }
  toString(indent = 0) {
    const spaces = "  ".repeat(indent);
    let str = `${spaces}Definition {
`;
    if (this.variables.size > 0) {
      str += `${spaces}  Variables:
`;
      for (const [name, value] of this.variables) {
        str += `${spaces}    ${name}: ${value.toString(indent + 2).trim()}
`;
      }
    }
    if (this.objects.size > 0) {
      str += `${spaces}  Objects:
`;
      for (const [name, value] of this.objects) {
        str += `${spaces}    ${name}: ${value.toString(indent + 2).trim()}
`;
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
};

// src/parser/Parser.js
var Parser = class {
  /**
   * Creates a new Parser instance.
   *
   * @constructor
   * @param {Token[]} tokens - Array of tokens from lexer
   */
  constructor(tokens) {
    this.tokens = tokens.filter(
      (t) => t.type !== TokenType.COMMENT && t.type !== TokenType.COMMENT_START && t.type !== TokenType.COMMENT_END
    );
    this.pos = 0;
    this.definitions = new DefinitionNode();
  }
  /**
   * Gets the current token without consuming it.
   *
   * @returns {Token} Current token
   */
  peek() {
    return this.tokens[this.pos];
  }
  /**
   * Gets a token at offset from current position.
   *
   * @param {number} offset - Offset from current position
   * @returns {Token|undefined} Token at offset
   */
  peekAt(offset) {
    return this.tokens[this.pos + offset];
  }
  /**
   * Consumes and returns the current token.
   *
   * @returns {Token} Current token
   */
  advance() {
    return this.tokens[this.pos++];
  }
  /**
   * Checks if we're at end of tokens.
   *
   * @returns {boolean} True if at end
   */
  isAtEnd() {
    return this.pos >= this.tokens.length || this.peek().type === TokenType.EOF;
  }
  /**
   * Checks if current token matches expected type(s).
   *
   * @param {string|string[]} types - Expected token type(s)
   * @returns {boolean} True if matches
   */
  check(types) {
    if (this.isAtEnd()) return false;
    return this.peek().is(types);
  }
  /**
   * Consumes token if it matches expected type.
   *
   * @param {string|string[]} types - Expected token type(s)
   * @returns {Token|null} Consumed token or null
   */
  match(types) {
    if (this.check(types)) {
      return this.advance();
    }
    return null;
  }
  /**
   * Expects a token of specific type, throws if not found.
   *
   * @param {string} type - Expected token type
   * @param {string} [message] - Custom error message
   * @returns {Token} Consumed token
   * @throws {Error} If token doesn't match
   */
  expect(type, message) {
    if (!this.check(type)) {
      const token = this.peek();
      throw new Error(
        message || `Expected ${type}, got ${token.type} at ${token.position()}`
      );
    }
    return this.advance();
  }
  /**
   * Skips whitespace and newline tokens.
   */
  skipWhitespace() {
    while (this.check([TokenType.NEWLINE, TokenType.INDENT])) {
      this.advance();
    }
  }
  /**
   * Parses the entire ASON document.
   *
   * @returns {ASTNode} Root AST node (object, array, or primitive)
   */
  parse() {
    this.skipWhitespace();
    if (this.check(TokenType.DEF_KEYWORD)) {
      this.parseDefinitions();
      this.skipWhitespace();
    }
    if (this.check(TokenType.DATA_KEYWORD)) {
      this.advance();
      this.skipWhitespace();
    }
    if (this.check([TokenType.LBRACKET, TokenType.LBRACE]) || this.isAtEnd() === false && !this.check([TokenType.SECTION, TokenType.IDENTIFIER])) {
      const nextToken = this.peek();
      const isInlineValue = nextToken && (nextToken.type === TokenType.LBRACKET || nextToken.type === TokenType.LBRACE || nextToken.type === TokenType.NUMBER || nextToken.type === TokenType.STRING || nextToken.type === TokenType.BOOLEAN || nextToken.type === TokenType.NULL);
      if (isInlineValue) {
        const value = this.parseValue();
        this.resolveReferences(value);
        return value;
      }
    }
    const root = this.parseDocument();
    this.resolveReferences(root);
    return root;
  }
  /**
   * Parses the $def: section.
   */
  parseDefinitions() {
    this.expect(TokenType.DEF_KEYWORD);
    this.skipWhitespace();
    const baseIndent = this.getIndentLevel();
    while (!this.isAtEnd() && !this.check(TokenType.DATA_KEYWORD)) {
      const currentIndent = this.getIndentLevel();
      if (currentIndent < baseIndent) break;
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      if (this.check([TokenType.VAR_REF, TokenType.OBJ_REF, TokenType.NUM_REF])) {
        const refToken = this.advance();
        this.expect(TokenType.COLON);
        const value = this.parseValue();
        if (refToken.type === TokenType.VAR_REF) {
          this.definitions.defineVariable(refToken.value, value);
        } else if (refToken.type === TokenType.OBJ_REF) {
          this.definitions.defineObject(refToken.value, value);
        } else if (refToken.type === TokenType.NUM_REF) {
          this.definitions.defineNumeric(refToken.value, value);
        }
        this.skipWhitespace();
      } else {
        this.skipLine();
      }
    }
  }
  /**
   * Parses the document content (sections and root properties).
   *
   * @returns {ObjectNode} Document root
   */
  parseDocument() {
    const root = new ObjectNode();
    const sections = [];
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;
      if (this.check(TokenType.SECTION)) {
        const section = this.parseSection();
        sections.push(section);
      } else if (this.check(TokenType.IDENTIFIER)) {
        const [key, value] = this.parseKeyValue();
        this.setNestedProperty(root, key, value);
        this.skipWhitespace();
      } else {
        this.advance();
      }
    }
    for (const section of sections) {
      this.mergeSectionIntoRoot(root, section);
    }
    return root;
  }
  /**
   * Merges a section node into the root object.
   *
   * @param {ObjectNode} root - Root object
   * @param {SectionNode} section - Section to merge
   */
  mergeSectionIntoRoot(root, section) {
    const path = section.name;
    const content = section.content;
    if (path.includes(".")) {
      this.setNestedProperty(root, path, content);
    } else {
      root.setProperty(path, content);
    }
  }
  /**
   * Parses a section (@section_name).
   *
   * @returns {SectionNode} Section node
   */
  parseSection() {
    const sectionToken = this.expect(TokenType.SECTION);
    const sectionName = sectionToken.value.substring(1);
    this.skipWhitespace();
    if (this.check(TokenType.LBRACKET)) {
      const tabular = this.parseTabularArray();
      const section = new SectionNode(sectionName, new ObjectNode());
      const wrapper = new ObjectNode();
      return new SectionNode(sectionName, tabular);
    }
    const content = new ObjectNode();
    let baseIndent = null;
    while (!this.isAtEnd()) {
      if (this.check(TokenType.SECTION)) {
        break;
      }
      const currentIndent = this.getIndentLevel();
      if (baseIndent === null && currentIndent > 0) {
        baseIndent = currentIndent;
      }
      if (baseIndent !== null && currentIndent < baseIndent) {
        break;
      }
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      if (baseIndent !== null && currentIndent === 0) {
        break;
      }
      if (this.check(TokenType.INDENT)) {
        this.advance();
      }
      if (this.check(TokenType.IDENTIFIER)) {
        const [key, value] = this.parseKeyValue();
        this.setNestedProperty(content, key, value);
        if (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      } else {
        break;
      }
    }
    return new SectionNode(sectionName, content);
  }
  /**
   * Parses a tabular array: [N]{field1,field2,...}
   *
   * @returns {TabularArrayNode} Tabular array node
   */
  parseTabularArray() {
    this.expect(TokenType.LBRACKET);
    const countToken = this.expect(TokenType.NUMBER);
    const expectedCount = parseInt(countToken.value);
    this.expect(TokenType.RBRACKET);
    this.expect(TokenType.LBRACE);
    const fields = [];
    while (!this.check(TokenType.RBRACE)) {
      const field = this.expect(TokenType.IDENTIFIER);
      fields.push(field.value);
      if (this.check(TokenType.COMMA)) {
        this.advance();
      }
    }
    this.expect(TokenType.RBRACE);
    this.skipWhitespace();
    const rows = [];
    const baseIndent = this.getIndentLevel();
    while (!this.isAtEnd() && !this.check(TokenType.SECTION)) {
      const currentIndent = this.getIndentLevel();
      if (currentIndent < baseIndent) break;
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      const row = this.parseTabularRow(fields);
      if (row) {
        rows.push(row);
      }
      this.skipWhitespace();
    }
    return new TabularArrayNode(fields, rows, { expectedCount });
  }
  /**
   * Parses a single tabular row.
   *
   * @param {string[]} fields - Field names
   * @returns {ObjectNode|null} Row object or null
   */
  parseTabularRow(fields) {
    const values = [];
    while (!this.isAtEnd() && !this.check(TokenType.NEWLINE) && !this.check(TokenType.SECTION)) {
      const value = this.parseValue();
      values.push(value);
      if (this.check(TokenType.PIPE)) {
        this.advance();
      } else {
        break;
      }
    }
    if (values.length === 0) return null;
    const row = new ObjectNode();
    for (let i = 0; i < fields.length; i++) {
      row.setProperty(fields[i], values[i] || new PrimitiveNode(null));
    }
    return row;
  }
  /**
   * Parses a key:value pair.
   *
   * @returns {[string, ASTNode]} Key and value
   */
  parseKeyValue() {
    let key = "";
    if (this.check(TokenType.STRING)) {
      const keyToken = this.advance();
      key = this.parseString(keyToken.value);
    } else {
      while (this.check(TokenType.IDENTIFIER) || this.check(TokenType.DOT)) {
        const token = this.advance();
        key += token.value;
      }
    }
    this.expect(TokenType.COLON);
    const value = this.parseValue();
    return [key, value];
  }
  /**
   * Parses a value (primitive, object, array, or reference).
   *
   * @returns {ASTNode} Parsed value
   */
  parseValue() {
    if (this.check([TokenType.VAR_REF, TokenType.OBJ_REF, TokenType.NUM_REF])) {
      const refToken = this.advance();
      const refType = refToken.type === TokenType.VAR_REF ? "var" : refToken.type === TokenType.OBJ_REF ? "object" : "numeric";
      return new ReferenceNode(refToken.value, refType);
    }
    if (this.check(TokenType.LBRACE)) {
      return this.parseInlineObject();
    }
    if (this.check(TokenType.LBRACKET)) {
      const nextToken = this.peekAt(1);
      const followingToken = this.peekAt(2);
      const afterThat = this.peekAt(3);
      if (nextToken && nextToken.type === TokenType.NUMBER && followingToken && followingToken.type === TokenType.RBRACKET && afterThat && afterThat.type === TokenType.LBRACE) {
        return this.parseTabularArray();
      }
      return this.parseInlineArray();
    }
    if (this.check(TokenType.DASH)) {
      return this.parseList();
    }
    if (this.check(TokenType.NEWLINE)) {
      const currentIndent = this.getIndentLevel();
      const nextToken = this.peekAt(1);
      if (nextToken && nextToken.type === TokenType.DASH) {
        this.advance();
        return this.parseList();
      }
      if (nextToken && nextToken.type === TokenType.INDENT) {
        const tokenAfterIndent = this.peekAt(2);
        if (tokenAfterIndent && tokenAfterIndent.type === TokenType.DASH) {
          this.advance();
          return this.parseList();
        }
        this.advance();
        return this.parseNestedObject();
      }
      return new PrimitiveNode(null);
    }
    if (this.check(TokenType.NULL)) {
      this.advance();
      return new PrimitiveNode(null);
    }
    if (this.check(TokenType.BOOLEAN)) {
      const token = this.advance();
      return new PrimitiveNode(token.value === "true");
    }
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return new PrimitiveNode(parseFloat(token.value));
    }
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return new PrimitiveNode(this.parseString(token.value));
    }
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.advance();
      return new PrimitiveNode(token.value);
    }
    return new PrimitiveNode(null);
  }
  /**
   * Parses a nested object indicated by indentation.
   * Called when we see key:\n with indented content below.
   *
   * @returns {ObjectNode} Nested object
   */
  parseNestedObject() {
    const obj = new ObjectNode();
    const baseIndent = this.getIndentLevel();
    while (!this.isAtEnd()) {
      const currentIndent = this.getIndentLevel();
      if (currentIndent < baseIndent) {
        break;
      }
      if (this.check(TokenType.SECTION)) {
        break;
      }
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      if (currentIndent === 0 && baseIndent > 0) {
        break;
      }
      if (this.check(TokenType.INDENT)) {
        this.advance();
      }
      if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
        const [key, value] = this.parseKeyValue();
        obj.setProperty(key, value);
        if (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      } else {
        break;
      }
    }
    return obj;
  }
  /**
   * Parses an inline object: {key:value,key2:value2}
   *
   * @returns {ObjectNode} Object node
   */
  parseInlineObject() {
    this.expect(TokenType.LBRACE);
    const obj = new ObjectNode();
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const [key, value] = this.parseKeyValue();
      obj.setProperty(key, value);
      if (this.check(TokenType.COMMA)) {
        this.advance();
      }
    }
    this.expect(TokenType.RBRACE);
    return obj;
  }
  /**
   * Parses an inline array: [val1,val2,val3]
   *
   * @returns {ArrayNode} Array node
   */
  parseInlineArray() {
    this.expect(TokenType.LBRACKET);
    const arr = new ArrayNode();
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      const value = this.parseValue();
      arr.addElement(value);
      if (this.check(TokenType.COMMA)) {
        this.advance();
      }
    }
    this.expect(TokenType.RBRACKET);
    return arr;
  }
  /**
   * Parses a YAML-style list.
   *
   * @returns {ArrayNode} Array node
   */
  parseList() {
    const arr = new ArrayNode();
    const baseIndent = this.getIndentLevel();
    while (!this.isAtEnd()) {
      const currentIndent = this.getIndentLevel();
      if (currentIndent < baseIndent) break;
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      if (this.check(TokenType.INDENT)) {
        if (currentIndent === baseIndent) {
          this.advance();
        } else if (currentIndent < baseIndent) {
          break;
        }
      }
      if (this.check(TokenType.DASH)) {
        this.advance();
        const value = this.parseValue();
        arr.addElement(value);
        if (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      } else {
        break;
      }
    }
    return arr;
  }
  /**
   * Parses a string value (removes quotes if quoted).
   *
   * @param {string} str - String with or without quotes
   * @returns {string} Parsed string
   */
  parseString(str) {
    if (str.startsWith('"') && str.endsWith('"') || str.startsWith("'") && str.endsWith("'")) {
      const content = str.slice(1, -1);
      return JSON.parse('"' + content + '"');
    }
    return str;
  }
  /**
   * Gets current indentation level.
   *
   * @returns {number} Indentation level (spaces)
   */
  getIndentLevel() {
    if (this.check(TokenType.INDENT)) {
      return this.peek().value.length;
    }
    return 0;
  }
  /**
   * Skips to the next line.
   */
  skipLine() {
    while (!this.isAtEnd() && !this.check(TokenType.NEWLINE)) {
      this.advance();
    }
    if (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
  }
  /**
   * Sets a nested property in an object using dot notation.
   *
   * @param {ObjectNode} obj - Object to set property on
   * @param {string} path - Property path (e.g., "user.address.city")
   * @param {ASTNode} value - Value to set
   */
  setNestedProperty(obj, path, value) {
    const parts = path.split(".");
    if (parts.length === 1) {
      obj.setProperty(path, value);
      return;
    }
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.hasProperty(part)) {
        current.setProperty(part, new ObjectNode());
      }
      const next = current.getProperty(part);
      if (!(next instanceof ObjectNode)) {
        const newObj = new ObjectNode();
        current.setProperty(part, newObj);
        current = newObj;
      } else {
        current = next;
      }
    }
    current.setProperty(parts[parts.length - 1], value);
  }
  /**
   * Resolves all references in the AST.
   *
   * @param {ASTNode} node - Node to resolve
   */
  resolveReferences(node) {
    if (node instanceof ReferenceNode) {
      const resolved = this.definitions.lookup(node.name);
      if (resolved) {
        node.resolve(resolved);
      } else {
        console.warn(`Unresolved reference: ${node.name}`);
      }
    } else if (node instanceof ObjectNode) {
      for (const [, value] of node.properties) {
        this.resolveReferences(value);
      }
    } else if (node instanceof ArrayNode || node instanceof TabularArrayNode) {
      for (const element of node.elements) {
        this.resolveReferences(element);
      }
    } else if (node instanceof SectionNode) {
      this.resolveReferences(node.content);
    }
  }
  /**
   * Deep merges source object into target object.
   *
   * @param {ObjectNode} target - Target object
   * @param {ObjectNode} source - Source object
   */
  deepMerge(target, source) {
    for (const [key, value] of source.properties) {
      if (target.hasProperty(key)) {
        const existing = target.getProperty(key);
        if (existing instanceof ObjectNode && value instanceof ObjectNode) {
          this.deepMerge(existing, value);
        } else {
          target.setProperty(key, value);
        }
      } else {
        target.setProperty(key, value);
      }
    }
  }
  /**
   * Converts a plain object to ObjectNode recursively.
   *
   * @param {Object} obj - Plain object
   * @returns {ObjectNode} Object node
   */
  objectToNode(obj) {
    const node = new ObjectNode();
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        node.setProperty(key, this.objectToNode(value));
      } else if (Array.isArray(value)) {
        const arr = new ArrayNode();
        for (const item of value) {
          if (item && typeof item === "object") {
            arr.addElement(this.objectToNode(item));
          } else {
            arr.addElement(new PrimitiveNode(item));
          }
        }
        node.setProperty(key, arr);
      } else {
        node.setProperty(key, new PrimitiveNode(value));
      }
    }
    return node;
  }
};

// src/analyzer/ReferenceAnalyzer.js
var ReferenceAnalyzer = class {
  /**
   * Creates a new ReferenceAnalyzer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.minOccurrences=2] - Minimum occurrences to create reference
   * @param {number} [options.minLength=5] - Minimum string length to consider
   * @param {number} [options.maxReferences=50] - Maximum number of references to create
   */
  constructor(options = {}) {
    this.minOccurrences = options.minOccurrences ?? 2;
    this.minLength = options.minLength ?? 5;
    this.maxReferences = options.maxReferences ?? 50;
  }
  /**
   * Analyzes data and generates reference map.
   *
   * @param {*} data - Data to analyze
   * @returns {Map<string, string>} Map of reference names to values
   *
   * @example
   * analyze({
   *   billing: { email: 'user@ex.com' },
   *   shipping: { email: 'user@ex.com' }
   * })
   * // Returns: Map { '$email' => 'user@ex.com' }
   */
  analyze(data) {
    const valueCounts = /* @__PURE__ */ new Map();
    const valueContext = /* @__PURE__ */ new Map();
    this.collectValues(data, valueCounts, valueContext);
    const candidates = [];
    for (const [value, count] of valueCounts.entries()) {
      if (count < this.minOccurrences) continue;
      if (value.length < this.minLength) continue;
      if (value.startsWith("$") || value.startsWith("&") || value.startsWith("#") || value.startsWith("@")) {
        continue;
      }
      const savings = this.calculateSavings(value, count);
      if (savings > 0) {
        candidates.push({
          value,
          count,
          savings,
          contexts: valueContext.get(value) || []
        });
      }
    }
    candidates.sort((a, b) => b.savings - a.savings);
    const references = /* @__PURE__ */ new Map();
    const limit = Math.min(candidates.length, this.maxReferences);
    for (let i = 0; i < limit; i++) {
      const candidate = candidates[i];
      const refName = this.generateReferenceName(candidate, i);
      references.set(refName, candidate.value);
    }
    return references;
  }
  /**
   * Recursively collects string values from data.
   *
   * @private
   * @param {*} data - Data to scan
   * @param {Map<string, number>} valueCounts - Accumulator for value counts
   * @param {Map<string, string[]>} valueContext - Accumulator for value contexts
   * @param {string} [path=''] - Current path in data tree
   */
  collectValues(data, valueCounts, valueContext, path = "") {
    if (typeof data === "string") {
      if (data.length >= this.minLength) {
        valueCounts.set(data, (valueCounts.get(data) || 0) + 1);
        if (!valueContext.has(data)) {
          valueContext.set(data, []);
        }
        valueContext.get(data).push(path);
      }
    } else if (Array.isArray(data)) {
      data.forEach((item, i) => {
        this.collectValues(item, valueCounts, valueContext, `${path}[${i}]`);
      });
    } else if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        const newPath = path ? `${path}.${key}` : key;
        this.collectValues(value, valueCounts, valueContext, newPath);
      }
    }
  }
  /**
   * Calculates token savings for creating a reference.
   *
   * @private
   * @param {string} value - String value
   * @param {number} count - Number of occurrences
   * @returns {number} Estimated token savings
   */
  calculateSavings(value, count) {
    const valueTokens = Math.ceil(value.length / 4);
    const refTokens = 2;
    const originalTokens = valueTokens * count;
    const withRefTokens = valueTokens + refTokens * count;
    return originalTokens - withRefTokens;
  }
  /**
   * Generates a semantic reference name based on context.
   *
   * @private
   * @param {Object} candidate - Candidate object
   * @param {string} candidate.value - String value
   * @param {string[]} candidate.contexts - Context paths where value appears
   * @param {number} fallbackIndex - Fallback index if no good name found
   * @returns {string} Reference name (with $ prefix)
   */
  generateReferenceName(candidate, fallbackIndex) {
    const { value, contexts } = candidate;
    const inferredName = this.inferNameFromContext(contexts);
    if (inferredName) {
      return "$" + inferredName;
    }
    const contentName = this.inferNameFromValue(value);
    if (contentName) {
      return "$" + contentName;
    }
    return "$val" + fallbackIndex;
  }
  /**
   * Infers a variable name from usage contexts.
   *
   * @private
   * @param {string[]} contexts - Context paths
   * @returns {string|null} Inferred name or null
   *
   * @example
   * inferNameFromContext(['billing.email', 'shipping.email'])
   * // Returns: 'email'
   */
  inferNameFromContext(contexts) {
    if (contexts.length === 0) return null;
    const parts = contexts.map((ctx) => {
      const segments = ctx.split(/[\.\[\]]/);
      return segments.filter((s) => s && s !== "").pop();
    });
    const frequency = /* @__PURE__ */ new Map();
    for (const part of parts) {
      if (part && /^[a-zA-Z]/.test(part)) {
        frequency.set(part, (frequency.get(part) || 0) + 1);
      }
    }
    if (frequency.size === 0) return null;
    let maxCount = 0;
    let bestName = null;
    for (const [name, count] of frequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestName = name;
      }
    }
    return bestName;
  }
  /**
   * Infers a variable name from value content.
   *
   * @private
   * @param {string} value - String value
   * @returns {string|null} Inferred name or null
   *
   * @example
   * inferNameFromValue('user@example.com') // 'email'
   * inferNameFromValue('+1-555-0123') // 'phone'
   * inferNameFromValue('https://api.example.com') // 'url'
   */
  inferNameFromValue(value) {
    if (/@/.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "email";
    }
    if (/^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, "").length >= 10) {
      return "phone";
    }
    if (/^https?:\/\//.test(value)) {
      return "url";
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return "id";
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return "date";
    }
    return null;
  }
  /**
   * Replaces values in data with reference placeholders.
   *
   * @param {*} data - Data to process
   * @param {Map<string, string>} references - Reference map
   * @returns {*} Data with references replaced
   */
  replaceWithReferences(data, references) {
    const valueToRef = /* @__PURE__ */ new Map();
    for (const [refName, value] of references.entries()) {
      valueToRef.set(value, refName);
    }
    return this.replaceRecursive(data, valueToRef);
  }
  /**
   * Recursively replaces values with references.
   *
   * @private
   * @param {*} data - Data to process
   * @param {Map<string, string>} valueToRef - Value to reference name map
   * @returns {*} Processed data
   */
  replaceRecursive(data, valueToRef) {
    if (typeof data === "string") {
      return valueToRef.get(data) || data;
    } else if (Array.isArray(data)) {
      return data.map((item) => this.replaceRecursive(item, valueToRef));
    } else if (data && typeof data === "object") {
      const result = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.replaceRecursive(value, valueToRef);
      }
      return result;
    }
    return data;
  }
};

// src/analyzer/SectionAnalyzer.js
var SectionAnalyzer = class {
  /**
   * Creates a new SectionAnalyzer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.minFieldsForSection=3] - Minimum fields to use @section
   * @param {number} [options.maxDepth=3] - Maximum nesting depth to analyze
   */
  constructor(options = {}) {
    this.minFieldsForSection = options.minFieldsForSection ?? 3;
    this.maxDepth = options.maxDepth ?? 3;
  }
  /**
   * Analyzes data and creates section organization plan.
   *
   * @param {Object} data - Data to analyze
   * @returns {SectionPlan} Organization plan
   *
   * @example
   * analyze({
   *   customer: { name: 'John', email: 'j@ex.com', phone: '555-0123', tier: 'gold' },
   *   metadata: { source: 'web' }
   * })
   * // Returns:
   * // {
   * //   sections: [{ path: 'customer', fieldCount: 4, useSection: true }],
   * //   dotNotation: [{ path: 'metadata', fieldCount: 1, useSection: false }]
   * // }
   */
  analyze(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { sections: [], dotNotation: [] };
    }
    const analysis = [];
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const info = this.analyzeObject(key, value, 1);
        analysis.push(info);
      }
    }
    const sections = analysis.filter((a) => a.useSection);
    const dotNotation = analysis.filter((a) => !a.useSection);
    return { sections, dotNotation };
  }
  /**
   * Analyzes a single object to determine if it should be a section.
   *
   * @private
   * @param {string} path - Object path
   * @param {Object} obj - Object to analyze
   * @param {number} depth - Current depth
   * @returns {Object} Analysis result
   */
  analyzeObject(path, obj, depth) {
    const fieldCount = this.countLeafFields(obj);
    const tokenSavings = this.calculateSectionSavings(path, fieldCount);
    return {
      path,
      fieldCount,
      depth,
      useSection: tokenSavings > 0 && fieldCount >= this.minFieldsForSection,
      tokenSavings,
      hasNestedObjects: this.hasNestedObjects(obj)
    };
  }
  /**
   * Counts leaf (non-object) fields in an object tree.
   *
   * @private
   * @param {Object} obj - Object to count
   * @param {number} [depth=0] - Current depth
   * @returns {number} Leaf field count
   */
  countLeafFields(obj, depth = 0) {
    if (depth > this.maxDepth) return 0;
    let count = 0;
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        count += this.countLeafFields(value, depth + 1);
      } else {
        count++;
      }
    }
    return count;
  }
  /**
   * Checks if object has nested objects.
   *
   * @private
   * @param {Object} obj - Object to check
   * @returns {boolean} True if has nested objects
   */
  hasNestedObjects(obj) {
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Calculates token savings of using @section vs dot notation.
   *
   * @private
   * @param {string} path - Section path
   * @param {number} fieldCount - Number of fields
   * @returns {number} Estimated token savings (positive = section saves tokens)
   *
   * @example
   * // For path='customer' with 4 fields:
   * // Dot notation: customer.name + customer.email + customer.phone + customer.tier
   * //   = (customer + . = ~3 tokens) * 4 fields = ~12 tokens for prefixes
   * // Section: @customer + newline = ~2 tokens overhead
   * // Savings: 12 - 2 = 10 tokens saved
   */
  calculateSectionSavings(path, fieldCount) {
    const pathTokens = Math.ceil(path.length / 4);
    const dotNotationCost = (pathTokens + 0.5) * fieldCount;
    const sectionCost = pathTokens + 1;
    return dotNotationCost - sectionCost;
  }
  /**
   * Organizes data into sections based on analysis.
   *
   * @param {Object} data - Data to organize
   * @param {SectionPlan} plan - Organization plan from analyze()
   * @returns {Object} Organized data
   */
  organize(data, plan) {
    const organized = {
      sections: {},
      root: {}
    };
    const sectionPaths = new Set(plan.sections.map((s) => s.path));
    for (const [key, value] of Object.entries(data)) {
      if (sectionPaths.has(key)) {
        organized.sections[key] = value;
      } else {
        organized.root[key] = value;
      }
    }
    return organized;
  }
  /**
   * Flattens an object to dot notation.
   *
   * @param {Object} obj - Object to flatten
   * @param {string} [prefix=''] - Path prefix
   * @param {number} [maxDepth=3] - Maximum depth to flatten
   * @returns {Object} Flattened object
   *
   * @example
   * flattenToDotNotation({ user: { name: 'John', age: 30 } })
   * // Returns: { 'user.name': 'John', 'user.age': 30 }
   */
  flattenToDotNotation(obj, prefix = "", maxDepth = 3) {
    const result = {};
    const flatten = (current, path, depth) => {
      if (depth > maxDepth) {
        result[path] = current;
        return;
      }
      if (current && typeof current === "object" && !Array.isArray(current)) {
        for (const [key, value] of Object.entries(current)) {
          const newPath = path ? `${path}.${key}` : key;
          flatten(value, newPath, depth + 1);
        }
      } else {
        result[path] = current;
      }
    };
    flatten(obj, prefix, 0);
    return result;
  }
  /**
   * Expands dot notation back to nested object.
   *
   * @param {Object} flat - Flattened object
   * @returns {Object} Nested object
   *
   * @example
   * expandDotNotation({ 'user.name': 'John', 'user.age': 30 })
   * // Returns: { user: { name: 'John', age: 30 } }
   */
  expandDotNotation(flat) {
    const result = {};
    for (const [path, value] of Object.entries(flat)) {
      const parts = path.split(".");
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
    }
    return result;
  }
  /**
   * Gets statistics about section usage.
   *
   * @param {SectionPlan} plan - Organization plan
   * @returns {Object} Statistics
   */
  getStatistics(plan) {
    const totalSections = plan.sections.length + plan.dotNotation.length;
    const usingSections = plan.sections.length;
    const usingDotNotation = plan.dotNotation.length;
    const totalTokenSavings = plan.sections.reduce(
      (sum, s) => sum + s.tokenSavings,
      0
    );
    return {
      totalSections,
      usingSections,
      usingDotNotation,
      sectionPercentage: totalSections > 0 ? usingSections / totalSections * 100 : 0,
      estimatedTokenSavings: totalTokenSavings
    };
  }
};

// src/analyzer/TabularAnalyzer.js
var TabularAnalyzer = class {
  /**
   * Creates a new TabularAnalyzer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.minRows=2] - Minimum rows to use tabular format
   * @param {number} [options.minUniformity=0.8] - Minimum uniformity ratio (0-1)
   * @param {number} [options.maxFields=20] - Maximum fields for tabular format
   */
  constructor(options = {}) {
    this.minRows = options.minRows ?? 2;
    this.minUniformity = options.minUniformity ?? 0.8;
    this.maxFields = options.maxFields ?? 20;
  }
  /**
   * Analyzes an array to determine if it's suitable for tabular format.
   *
   * @param {Array} array - Array to analyze
   * @returns {TabularAnalysis} Analysis result
   *
   * @example
   * analyze([
   *   { id: 1, name: 'Alice', age: 25 },
   *   { id: 2, name: 'Bob', age: 30 },
   *   { id: 3, name: 'Charlie', age: 35 }
   * ])
   * // Returns: {
   * //   isTabular: true,
   * //   schema: ['id', 'name', 'age'],
   * //   rowCount: 3,
   * //   uniformity: 1.0
   * // }
   */
  analyze(array) {
    if (!Array.isArray(array) || array.length < this.minRows) {
      return { isTabular: false, reason: "Too few rows" };
    }
    const allObjects = array.every(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
    if (!allObjects) {
      return { isTabular: false, reason: "Not all objects" };
    }
    const { schema, uniformity } = this.analyzeSchema(array);
    if (uniformity < this.minUniformity) {
      return {
        isTabular: false,
        reason: `Low uniformity: ${uniformity.toFixed(2)}`,
        schema,
        uniformity
      };
    }
    if (schema.length > this.maxFields) {
      return {
        isTabular: false,
        reason: `Too many fields: ${schema.length}`,
        schema
      };
    }
    const allPrimitive = this.areAllValuesPrimitive(array, schema);
    if (!allPrimitive) {
      return {
        isTabular: false,
        reason: "Contains nested objects/arrays",
        schema
      };
    }
    const savings = this.calculateTokenSavings(array, schema);
    return {
      isTabular: true,
      schema,
      rowCount: array.length,
      fieldCount: schema.length,
      uniformity,
      tokenSavings: savings,
      estimatedTokens: this.estimateTabularTokens(array, schema)
    };
  }
  /**
   * Analyzes array schema and uniformity.
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @returns {Object} Schema analysis
   */
  analyzeSchema(array) {
    const signatureCounts = /* @__PURE__ */ new Map();
    const signatureKeys = /* @__PURE__ */ new Map();
    for (const item of array) {
      const originalKeys = Object.keys(item);
      const sortedKeys = [...originalKeys].sort();
      const signature = sortedKeys.join("|");
      signatureCounts.set(signature, (signatureCounts.get(signature) || 0) + 1);
      if (!signatureKeys.has(signature)) {
        signatureKeys.set(signature, originalKeys);
      }
    }
    let maxCount = 0;
    let bestSignature = "";
    for (const [sig, count] of signatureCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestSignature = sig;
      }
    }
    const schema = signatureKeys.get(bestSignature) || [];
    const uniformity = maxCount / array.length;
    return { schema, uniformity };
  }
  /**
   * Checks if all values in array are primitive (suitable for tabular).
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @param {string[]} schema - Field names
   * @returns {boolean} True if all primitive
   */
  areAllValuesPrimitive(array, schema) {
    return array.every(
      (obj) => schema.every((field) => {
        const value = obj[field];
        return value === null || value === void 0 || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
      })
    );
  }
  /**
   * Calculates token savings of using tabular format.
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @param {string[]} schema - Field names
   * @returns {number} Estimated token savings
   */
  calculateTokenSavings(array, schema) {
    const jsonTokens = this.estimateJSONTokens(array);
    const tabularTokens = this.estimateTabularTokens(array, schema);
    return jsonTokens - tabularTokens;
  }
  /**
   * Estimates tokens for JSON array format.
   *
   * @private
   * @param {Array<Object>} array - Array
   * @returns {number} Estimated tokens
   */
  estimateJSONTokens(array) {
    const json = JSON.stringify(array);
    return Math.ceil(json.length / 4);
  }
  /**
   * Estimates tokens for ASON tabular format.
   *
   * @private
   * @param {Array<Object>} array - Array of objects
   * @param {string[]} schema - Field names
   * @returns {number} Estimated tokens
   */
  estimateTabularTokens(array, schema) {
    const schemaStr = `[${array.length}]{${schema.join(",")}}`;
    let tokens = Math.ceil(schemaStr.length / 4);
    for (const obj of array) {
      const rowValues = schema.map((field) => String(obj[field] ?? ""));
      const rowStr = rowValues.join("|");
      tokens += Math.ceil(rowStr.length / 4);
    }
    return tokens;
  }
  /**
   * Finds all arrays in data recursively.
   *
   * @param {*} data - Data to scan
   * @param {string} [path=''] - Current path
   * @returns {Array<Object>} Array locations and metadata
   *
   * @example
   * findArrays({
   *   users: [{ id: 1 }, { id: 2 }],
   *   nested: { items: [{ x: 1 }] }
   * })
   * // Returns: [
   * //   { path: 'users', array: [...], analysis: {...} },
   * //   { path: 'nested.items', array: [...], analysis: {...} }
   * // ]
   */
  findArrays(data, path = "") {
    const arrays = [];
    if (Array.isArray(data)) {
      const analysis = this.analyze(data);
      arrays.push({ path, array: data, analysis });
    } else if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        const newPath = path ? `${path}.${key}` : key;
        arrays.push(...this.findArrays(value, newPath));
      }
    }
    return arrays;
  }
  /**
   * Filters arrays suitable for tabular format.
   *
   * @param {Array<Object>} arrayInfos - Array information from findArrays()
   * @returns {Array<Object>} Filtered tabular-suitable arrays
   */
  filterTabular(arrayInfos) {
    return arrayInfos.filter((info) => info.analysis.isTabular);
  }
  /**
   * Gets statistics about tabular optimization potential.
   *
   * @param {*} data - Data to analyze
   * @returns {Object} Statistics
   */
  getStatistics(data) {
    const allArrays = this.findArrays(data);
    const tabularArrays = this.filterTabular(allArrays);
    const totalTokenSavings = tabularArrays.reduce(
      (sum, info) => sum + info.analysis.tokenSavings,
      0
    );
    return {
      totalArrays: allArrays.length,
      tabularArrays: tabularArrays.length,
      tabularPercentage: allArrays.length > 0 ? tabularArrays.length / allArrays.length * 100 : 0,
      estimatedTokenSavings: totalTokenSavings,
      arrayPaths: tabularArrays.map((info) => info.path)
    };
  }
};

// src/compiler/Serializer.js
var Serializer = class {
  /**
   * Creates a new Serializer.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.indent=1] - Spaces per indentation level
   * @param {string} [options.delimiter='|'] - Field delimiter for tabular arrays
   */
  constructor(options = {}) {
    this.indent = Math.max(1, options.indent ?? 1);
    this.delimiter = options.delimiter ?? "|";
  }
  /**
   * Serializes data to ASON 2.0 format.
   *
   * @param {*} data - Data to serialize
   * @param {Map<string, *>} [references=new Map()] - Reference definitions
   * @param {Object} [sectionPlan=null] - Section organization plan
   * @param {Map<string, Object>} [tabularArrays=new Map()] - Tabular array info
   * @returns {string} ASON 2.0 formatted string
   */
  serialize(data, references = /* @__PURE__ */ new Map(), sectionPlan = null, tabularArrays = /* @__PURE__ */ new Map()) {
    this.references = references;
    this.sectionPlan = sectionPlan;
    this.tabularArrays = tabularArrays;
    this.valueToRef = /* @__PURE__ */ new Map();
    for (const [refName, value] of references.entries()) {
      this.valueToRef.set(this.normalizeValue(value), refName);
    }
    let output = "";
    if (references.size > 0) {
      output += this.serializeDefinitions(references);
      output += "\n";
    }
    const dataStr = this.serializeValue(data, 0, "");
    if (references.size > 0) {
      output += "$data:\n";
      output += dataStr;
    } else {
      output += dataStr;
    }
    return output.replace(/\n+$/, "");
  }
  /**
   * Serializes the $def: section.
   *
   * @private
   * @param {Map<string, *>} references - Reference map
   * @returns {string} Serialized definitions
   */
  serializeDefinitions(references) {
    let output = "$def:\n";
    for (const [refName, value] of references.entries()) {
      const valueStr = this.serializeDefinitionValue(value);
      output += this._sp(1) + refName + ":" + valueStr + "\n";
    }
    return output;
  }
  /**
   * Serializes a value for the $def: section (no reference lookups).
   *
   * @private
   * @param {*} value - Value to serialize
   * @returns {string} Serialized value
   */
  serializeDefinitionValue(value) {
    if (value === null || value === void 0) {
      return "null";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof value === "string") {
      return this.serializeString(value);
    }
    return JSON.stringify(value);
  }
  /**
   * Serializes a value (dispatches to appropriate serializer).
   *
   * @private
   * @param {*} value - Value to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path in data tree
   * @returns {string} Serialized value
   */
  serializeValue(value, level, path) {
    const refName = this.valueToRef.get(this.normalizeValue(value));
    if (refName && typeof value === "string") {
      return refName;
    }
    if (value === null || value === void 0) {
      return "null";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof value === "string") {
      return this.serializeString(value);
    }
    if (Array.isArray(value)) {
      const tabularInfo = this.tabularArrays.get(path);
      if (tabularInfo && tabularInfo.isTabular) {
        return this.serializeTabularArray(value, tabularInfo, level);
      }
      return this.serializeArray(value, level, path);
    }
    if (typeof value === "object") {
      return this.serializeObject(value, level, path);
    }
    return String(value);
  }
  /**
   * Serializes a string value.
   *
   * @private
   * @param {string} str - String to serialize
   * @returns {string} Serialized string
   */
  serializeString(str) {
    if (this.needsQuotes(str)) {
      return JSON.stringify(str);
    }
    return str;
  }
  /**
   * Checks if a string needs quotes.
   *
   * @private
   * @param {string} str - String to check
   * @returns {boolean} True if needs quotes
   */
  needsQuotes(str) {
    if (str === "") return true;
    if (str === "null" || str === "true" || str === "false") return true;
    if (/^-?\d/.test(str)) return true;
    if (/^[@$&#\[\{\/]/.test(str)) return true;
    if (/[\n\r\t|:\s\-\.\,\{\}\[\]"\/]/.test(str)) return true;
    if (str === "[]" || str === "{}") return true;
    if (!/^[\x20-\x7E]*$/.test(str)) return true;
    return false;
  }
  /**
   * Serializes an array.
   *
   * @private
   * @param {Array} arr - Array to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized array
   */
  serializeArray(arr, level, path) {
    if (arr.length === 0) return "[]";
    const allPrimitive = arr.every(
      (item) => item === null || typeof item !== "object"
    );
    if (allPrimitive) {
      const items = arr.map((item) => this.serializeValue(item, level, path));
      return "[" + items.join(",") + "]";
    }
    let output = "\n";
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const itemPath = `${path}[${i}]`;
      const itemStr = this.serializeValue(item, level + 1, itemPath);
      output += this._sp(level) + "-";
      if (itemStr.startsWith("\n")) {
        output += itemStr;
      } else {
        output += " " + itemStr;
      }
      output += "\n";
    }
    return output.trimEnd();
  }
  /**
   * Serializes a tabular array.
   *
   * @private
   * @param {Array<Object>} arr - Array of objects
   * @param {Object} tabularInfo - Tabular analysis info
   * @param {number} level - Indentation level
   * @returns {string} Serialized tabular array
   */
  serializeTabularArray(arr, tabularInfo, level) {
    const { schema } = tabularInfo;
    let output = `[${arr.length}]{${schema.join(",")}}`;
    output += "\n";
    for (const obj of arr) {
      const values = schema.map((field) => {
        const value = obj[field];
        return this.serializeTabularValue(value);
      });
      output += this._sp(level) + values.join(this.delimiter) + "\n";
    }
    return output.trimEnd();
  }
  /**
   * Serializes a value for tabular context (CSV-like).
   *
   * @private
   * @param {*} value - Value to serialize
   * @returns {string} Serialized value
   */
  serializeTabularValue(value) {
    if (value === null || value === void 0) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") {
      const refName = this.valueToRef.get(value);
      if (refName) return refName;
      if (value.includes(this.delimiter) || value.includes("\n") || value.includes('"') || this.needsQuotes(value)) {
        return JSON.stringify(value);
      }
      return value;
    }
    return JSON.stringify(value);
  }
  /**
   * Serializes an object.
   *
   * @private
   * @param {Object} obj - Object to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized object
   */
  serializeObject(obj, level, path) {
    if (Object.keys(obj).length === 0) return "{}";
    const useSections = this.sectionPlan && level === 0;
    if (useSections) {
      return this.serializeWithSections(obj, level, path);
    }
    let output = level === 0 ? "" : "\n";
    for (const [key, value] of Object.entries(obj)) {
      const valuePath = path ? `${path}.${key}` : key;
      const tabularInfo = this.tabularArrays.get(valuePath);
      const isTabular = tabularInfo == null ? void 0 : tabularInfo.isTabular;
      output += this._sp(level);
      const serializedKey = this.needsQuotes(key) ? JSON.stringify(key) : key;
      output += serializedKey + ":";
      if (isTabular && Array.isArray(value)) {
        output += this.serializeTabularArray(value, tabularInfo, level + 1);
      } else {
        const valueStr = this.serializeValue(value, level + 1, valuePath);
        if (valueStr.startsWith("\n")) {
          output += valueStr;
        } else {
          output += valueStr;
        }
      }
      output += "\n";
    }
    return output.trimEnd();
  }
  /**
   * Serializes object with section organization.
   *
   * @private
   * @param {Object} obj - Object to serialize
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized object with sections
   */
  serializeWithSections(obj, level, path) {
    let output = "";
    const { sections, dotNotation } = this.sectionPlan;
    const sectionPaths = new Set(sections.map((s) => s.path));
    for (const [key, value] of Object.entries(obj)) {
      if (sectionPaths.has(key)) {
        output += this.serializeSection(key, value, level, path);
        output += "\n\n";
      }
    }
    for (const [key, value] of Object.entries(obj)) {
      if (!sectionPaths.has(key)) {
        const valuePath = path ? `${path}.${key}` : key;
        const flatKey = this.needsQuotes(key) ? JSON.stringify(key) : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const flattened = this.flattenObject(value, key);
          for (const [flatKey2, flatValue] of Object.entries(flattened)) {
            output += flatKey2 + ":" + this.serializeValue(flatValue, level, valuePath) + "\n";
          }
        } else {
          output += flatKey + ":" + this.serializeValue(value, level, valuePath) + "\n";
        }
      }
    }
    return output.trimEnd();
  }
  /**
   * Serializes a section.
   *
   * @private
   * @param {string} name - Section name
   * @param {*} value - Section value
   * @param {number} level - Indentation level
   * @param {string} path - Current path
   * @returns {string} Serialized section
   */
  serializeSection(name, value, level, path) {
    const valuePath = path ? `${path}.${name}` : name;
    const tabularInfo = this.tabularArrays.get(valuePath);
    let output = "@" + name;
    if ((tabularInfo == null ? void 0 : tabularInfo.isTabular) && Array.isArray(value)) {
      output += " " + this.serializeTabularArray(value, tabularInfo, level + 1);
    } else if (Array.isArray(value)) {
      output += "\n" + this.serializeArray(value, level + 1, valuePath);
    } else if (value && typeof value === "object") {
      output += "\n";
      for (const [key, val] of Object.entries(value)) {
        const keyPath = `${valuePath}.${key}`;
        const serializedKey = this.needsQuotes(key) ? JSON.stringify(key) : key;
        const serializedValue = this.serializeValue(val, level + 2, keyPath);
        output += this._sp(level + 1) + serializedKey + ":" + serializedValue + "\n";
      }
      output = output.trimEnd();
    } else {
      output += ":" + this.serializeValue(value, level, valuePath);
    }
    return output;
  }
  /**
   * Flattens an object to dot notation.
   *
   * @private
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Key prefix
   * @returns {Object} Flattened object
   */
  flattenObject(obj, prefix) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}.${key}`;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
    return result;
  }
  /**
   * Normalizes a value for comparison (for reference matching).
   *
   * @private
   * @param {*} value - Value to normalize
   * @returns {string} Normalized value
   */
  normalizeValue(value) {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }
  /**
   * Generates indentation string.
   *
   * @private
   * @param {number} level - Indentation level
   * @returns {string} Indentation spaces
   */
  _sp(level) {
    return " ".repeat(this.indent * level);
  }
};

// src/utils/TokenCounter.js
var TokenCounter = class {
  /**
   * Estimates tokens for text using character-based approximation.
   *
   * Uses the common heuristic: ~1 token per 4 characters for English text.
   *
   * @static
   * @param {string|*} text - Text to count (auto-stringifies non-strings)
   * @returns {number} Estimated token count
   *
   * @example
   * TokenCounter.estimateTokens("Hello world") // ~3
   * TokenCounter.estimateTokens({key: "value"}) // ~5
   */
  static estimateTokens(text) {
    if (typeof text !== "string") {
      text = JSON.stringify(text);
    }
    return Math.ceil(text.length / 4);
  }
  /**
   * Compares token counts between two formats.
   *
   * @static
   * @param {*} original - Original data/text
   * @param {*} compressed - Compressed data/text
   * @returns {Object} Comparison statistics
   *
   * @example
   * const stats = TokenCounter.compare(originalJSON, asonString);
   * console.log(`Saved ${stats.reduction_percent}%`);
   */
  static compare(original, compressed) {
    const originalStr = typeof original === "string" ? original : JSON.stringify(original);
    const compressedStr = typeof compressed === "string" ? compressed : JSON.stringify(compressed);
    const originalTokens = this.estimateTokens(originalStr);
    const compressedTokens = this.estimateTokens(compressedStr);
    const reduction = originalTokens - compressedTokens;
    const reductionPercent = originalTokens > 0 ? reduction / originalTokens * 100 : 0;
    return {
      original_tokens: originalTokens,
      compressed_tokens: compressedTokens,
      tokens_saved: reduction,
      reduction_percent: parseFloat(reductionPercent.toFixed(2)),
      original_size: originalStr.length,
      compressed_size: compressedStr.length,
      bytes_saved: originalStr.length - compressedStr.length,
      size_reduction_percent: parseFloat(
        ((originalStr.length - compressedStr.length) / originalStr.length * 100).toFixed(2)
      )
    };
  }
  /**
   * Gets detailed token breakdown for JSON.
   *
   * @static
   * @param {*} data - Data to analyze
   * @returns {Object} Token breakdown
   */
  static analyzeJSON(data) {
    const json = typeof data === "string" ? data : JSON.stringify(data);
    const brackets = (json.match(/[\[\]{}]/g) || []).length;
    const quotes = (json.match(/"/g) || []).length;
    const colons = (json.match(/:/g) || []).length;
    const commas = (json.match(/,/g) || []).length;
    return {
      total_chars: json.length,
      total_tokens: this.estimateTokens(json),
      structural: {
        brackets,
        quotes,
        colons,
        commas
      },
      structural_overhead: brackets + quotes + colons + commas
    };
  }
  /**
   * Gets detailed token breakdown for ASON.
   *
   * @static
   * @param {string} ason - ASON text
   * @returns {Object} Token breakdown
   */
  static analyzeASON(ason) {
    const sections = (ason.match(/@\w+/g) || []).length;
    const references = (ason.match(/\$\w+/g) || []).length;
    const pipes = (ason.match(/\|/g) || []).length;
    const newlines = (ason.match(/\n/g) || []).length;
    return {
      total_chars: ason.length,
      total_tokens: this.estimateTokens(ason),
      features: {
        sections,
        references,
        pipe_delimiters: pipes,
        newlines
      }
    };
  }
  /**
   * Calculates comprehensive comparison stats.
   *
   * @static
   * @param {*} data - Original data
   * @param {string} jsonString - JSON representation
   * @param {string} asonString - ASON representation
   * @returns {Object} Detailed comparison
   */
  static compareFormats(data, jsonString, asonString) {
    const jsonAnalysis = this.analyzeJSON(jsonString);
    const asonAnalysis = this.analyzeASON(asonString);
    const comparison = this.compare(jsonString, asonString);
    return {
      ...comparison,
      json: jsonAnalysis,
      ason: asonAnalysis,
      efficiency: {
        tokens_per_char_json: jsonAnalysis.total_tokens / jsonAnalysis.total_chars,
        tokens_per_char_ason: asonAnalysis.total_tokens / asonAnalysis.total_chars,
        compression_ratio: asonAnalysis.total_chars / jsonAnalysis.total_chars
      }
    };
  }
};

// src/index.js
var SmartCompressor = class {
  /**
   * Creates a new SmartCompressor instance.
   *
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.indent=1] - Indentation spaces
   * @param {string} [options.delimiter='|'] - Field delimiter for tabular arrays
   * @param {boolean} [options.useReferences=true] - Enable reference detection
   * @param {boolean} [options.useSections=true] - Enable section organization
   * @param {boolean} [options.useTabular=true] - Enable tabular array format
   * @param {number} [options.minFieldsForSection=3] - Min fields to create section
   * @param {number} [options.minRowsForTabular=2] - Min rows for tabular format
   * @param {number} [options.minReferenceOccurrences=2] - Min occurrences for reference
   *
   * @example
   * // Maximum compression
   * new SmartCompressor({ indent: 1 })
   *
   * // Maximum readability
   * new SmartCompressor({ indent: 2, useSections: false, useTabular: false })
   */
  constructor(options = {}) {
    this.indent = Math.max(1, options.indent ?? 1);
    this.delimiter = options.delimiter ?? "|";
    this.useReferences = options.useReferences ?? true;
    this.useSections = options.useSections ?? true;
    this.useTabular = options.useTabular ?? true;
    this.minFieldsForSection = options.minFieldsForSection ?? 3;
    this.minRowsForTabular = options.minRowsForTabular ?? 2;
    this.minReferenceOccurrences = options.minReferenceOccurrences ?? 2;
    this.referenceAnalyzer = new ReferenceAnalyzer({
      minOccurrences: this.minReferenceOccurrences,
      minLength: 5
    });
    this.sectionAnalyzer = new SectionAnalyzer({
      minFieldsForSection: this.minFieldsForSection
    });
    this.tabularAnalyzer = new TabularAnalyzer({
      minRows: this.minRowsForTabular,
      minUniformity: 0.8
    });
    this.serializer = new Serializer({
      indent: this.indent,
      delimiter: this.delimiter
    });
  }
  /**
   * Compresses JSON data to ASON 2.0 format.
   *
   * Pipeline:
   * 1. Analyze references (repeated values → $var)
   * 2. Analyze sections (object organization → @section)
   * 3. Analyze arrays (uniform arrays → tabular format)
   * 4. Serialize to ASON 2.0 string
   *
   * @param {*} data - Data to compress
   * @returns {string} ASON 2.0 formatted string
   *
   * @example
   * const data = {
   *   customer: { name: 'John', email: 'john@ex.com' },
   *   billing: { email: 'john@ex.com' }
   * };
   * const ason = compressor.compress(data);
   */
  compress(data) {
    let references = /* @__PURE__ */ new Map();
    if (this.useReferences) {
      references = this.referenceAnalyzer.analyze(data);
    }
    let sectionPlan = null;
    if (this.useSections && data && typeof data === "object" && !Array.isArray(data)) {
      sectionPlan = this.sectionAnalyzer.analyze(data);
    }
    const tabularArrays = /* @__PURE__ */ new Map();
    if (this.useTabular) {
      const arrayInfos = this.tabularAnalyzer.findArrays(data);
      for (const info of arrayInfos) {
        if (info.analysis.isTabular) {
          tabularArrays.set(info.path, info.analysis);
        }
      }
    }
    const ason = this.serializer.serialize(data, references, sectionPlan, tabularArrays);
    return ason;
  }
  /**
   * Decompresses ASON 2.0 format back to JSON.
   *
   * Pipeline:
   * 1. Tokenize (Lexer)
   * 2. Parse (Parser → AST)
   * 3. Convert AST to JavaScript value
   *
   * @param {string} ason - ASON 2.0 formatted string
   * @returns {*} Original JSON data
   *
   * @example
   * const ason = "@users [2]{id,name}\n1|Alice\n2|Bob";
   * const data = compressor.decompress(ason);
   * // Returns: { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }
   */
  decompress(ason) {
    const lexer = new Lexer(ason);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return ast.toValue();
  }
  /**
   * Compresses data and returns detailed statistics.
   *
   * @param {*} data - Data to compress
   * @returns {Object} Compression result with statistics
   *
   * @example
   * const result = compressor.compressWithStats(data);
   * console.log(`Reduced tokens by ${result.stats.reduction_percent}%`);
   */
  compressWithStats(data) {
    const jsonString = JSON.stringify(data);
    const asonString = this.compress(data);
    const stats = TokenCounter.compareFormats(data, jsonString, asonString);
    return {
      ason: asonString,
      stats,
      original_tokens: stats.original_tokens,
      compressed_tokens: stats.compressed_tokens,
      reduction_percent: stats.reduction_percent
    };
  }
  /**
   * Validates that compress/decompress round-trips correctly.
   *
   * @param {*} data - Data to test
   * @returns {Object} Validation result
   *
   * @example
   * const result = compressor.validateRoundTrip(data);
   * if (result.valid) {
   *   console.log('Round-trip successful!');
   * }
   */
  validateRoundTrip(data) {
    try {
      const compressed = this.compress(data);
      const decompressed = this.decompress(compressed);
      const original = JSON.stringify(data);
      const result = JSON.stringify(decompressed);
      const valid = original === result;
      return {
        valid,
        compressed,
        original: data,
        decompressed,
        error: valid ? null : "Data mismatch after round-trip"
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        stack: error.stack
      };
    }
  }
  /**
   * Gets optimization statistics without compressing.
   *
   * @param {*} data - Data to analyze
   * @returns {Object} Analysis statistics
   */
  getOptimizationStats(data) {
    const references = this.useReferences ? this.referenceAnalyzer.analyze(data) : /* @__PURE__ */ new Map();
    const sectionPlan = this.useSections && data && typeof data === "object" ? this.sectionAnalyzer.analyze(data) : null;
    const tabularStats = this.useTabular ? this.tabularAnalyzer.getStatistics(data) : null;
    const sectionStats = sectionPlan ? this.sectionAnalyzer.getStatistics(sectionPlan) : null;
    return {
      references: {
        count: references.size,
        names: Array.from(references.keys())
      },
      sections: sectionStats,
      tabular: tabularStats
    };
  }
};
export {
  SmartCompressor,
  TokenCounter
};
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
 * @fileoverview Token class for ASON 2.0 Lexer
 *
 * Represents a single lexical token in the ASON 2.0 format.
 * Tokens are the atomic units produced by the lexer and consumed by the parser.
 *
 * @module Token
 * @license MIT
 * @version 2.0.0
 */
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
 * @fileoverview Section AST Node for ASON 2.0
 *
 * Represents a section (@section_name) in ASON 2.0 format.
 * Sections are organizational units that create nested objects.
 *
 * @module SectionNode
 * @license MIT
 * @version 2.0.0
 */
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
/**
 * @fileoverview Reference AST Node for ASON 2.0
 *
 * Represents references to defined values ($var) or objects (&obj).
 *
 * @module ReferenceNode
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview Parser for ASON 2.0 format
 *
 * Recursive descent parser that converts tokens into an Abstract Syntax Tree (AST).
 * Handles all ASON 2.0 syntax including sections, tabular arrays, and references.
 *
 * @module Parser
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview Reference Analyzer for ASON 2.0
 *
 * Analyzes JSON data to detect repeated values and creates semantic references ($var).
 * Replaces numeric references (#0, #1) with meaningful variable names.
 *
 * @module ReferenceAnalyzer
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview Section Analyzer for ASON 2.0
 *
 * Analyzes object structure to determine when to use @section vs dot notation.
 * Optimizes for token efficiency: uses @section only when it saves tokens.
 *
 * @module SectionAnalyzer
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview Tabular Array Analyzer for ASON 2.0
 *
 * Analyzes arrays to detect uniform structures suitable for tabular format.
 * Determines when to use compact @section [N]{fields} format vs regular arrays.
 *
 * @module TabularAnalyzer
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview ASON 2.0 Serializer
 *
 * Converts JavaScript data structures into ASON 2.0 format string.
 * Uses analysis from ReferenceAnalyzer, SectionAnalyzer, and TabularAnalyzer
 * to generate optimized output.
 *
 * @module Serializer
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview Token Counter utility for ASON 2.0
 *
 * Estimates token counts for different formats (JSON, ASON, etc.)
 * using approximation methods.
 *
 * @module TokenCounter
 * @license MIT
 * @version 2.0.0
 */
/**
 * @fileoverview ASON (Aliased Serialization Object Notation) - Main Entry Point
 *
 * This module exports the main compression engine and token counter utilities
 * for converting JSON to ASON format, a token-optimized serialization format
 * designed for Large Language Models (LLMs).
 *
 * ASON reduces token usage by 20-60% compared to JSON while maintaining
 * perfect round-trip fidelity (lossless compression).
 *
 * @module ason
 * @see {@link SmartCompressor} for compression/decompression
 * @see {@link TokenCounter} for token estimation utilities
 * @license MIT
 * @version 2.0.0
 *
 * @example
 * import { SmartCompressor, TokenCounter } from 'ason';
 *
 * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
 * const data = { users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}] };
 *
 * // Compress
 * const ason = compressor.compress(data);
 *
 * // Decompress
 * const original = compressor.decompress(ason);
 *
 * // Compare
 * const stats = TokenCounter.compareFormats(data, ason);
 * console.log(`Reduced tokens by ${stats.reduction_percent}%`);
 */
