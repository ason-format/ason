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

import { TokenType } from '../lexer/TokenType.js';
import {
  PrimitiveNode,
  ObjectNode,
  ArrayNode
} from './nodes/ASTNode.js';
import { SectionNode } from './nodes/SectionNode.js';
import { TabularArrayNode } from './nodes/TabularArrayNode.js';
import { ReferenceNode, DefinitionNode } from './nodes/ReferenceNode.js';

/**
 * Parser for ASON 2.0 format.
 *
 * Converts a stream of tokens into an Abstract Syntax Tree.
 *
 * @class Parser
 *
 * @example
 * const lexer = new Lexer(asonText);
 * const tokens = lexer.tokenize();
 * const parser = new Parser(tokens);
 * const ast = parser.parse();
 */
export class Parser {
  /**
   * Creates a new Parser instance.
   *
   * @constructor
   * @param {Token[]} tokens - Array of tokens from lexer
   */
  constructor(tokens) {
    /** @type {Token[]} Tokens to parse */
    this.tokens = tokens.filter(t =>
      t.type !== TokenType.COMMENT &&
      t.type !== TokenType.COMMENT_START &&
      t.type !== TokenType.COMMENT_END
    );

    /** @type {number} Current token position */
    this.pos = 0;

    /** @type {DefinitionNode} Definitions from $def: section */
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
        message ||
        `Expected ${type}, got ${token.type} at ${token.position()}`
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

    // Parse $def: section if present
    if (this.check(TokenType.DEF_KEYWORD)) {
      this.parseDefinitions();
      this.skipWhitespace();
    }

    // Parse $data: section (or implicit data)
    if (this.check(TokenType.DATA_KEYWORD)) {
      this.advance(); // consume $data:
      this.skipWhitespace();
    }

    // Check if entire document is a single value (array, inline object, or YAML-style list)
    // This handles cases like: [1,2,3] or {a:1,b:2} or - item at root level
    if (this.check([TokenType.LBRACKET, TokenType.LBRACE, TokenType.DASH]) ||
        (this.isAtEnd() === false &&
         !this.check([TokenType.SECTION, TokenType.IDENTIFIER]))) {
      // Check if it's a single inline value at root
      const nextToken = this.peek();
      const isInlineValue = nextToken && (
        nextToken.type === TokenType.LBRACKET ||
        nextToken.type === TokenType.LBRACE ||
        nextToken.type === TokenType.DASH ||
        nextToken.type === TokenType.NUMBER ||
        nextToken.type === TokenType.STRING ||
        nextToken.type === TokenType.BOOLEAN ||
        nextToken.type === TokenType.NULL
      );

      if (isInlineValue) {
        const value = this.parseValue();
        // Resolve references if needed
        this.resolveReferences(value);
        return value;
      }
    }

    // Parse root content (sections and/or key-value pairs)
    const root = this.parseDocument();

    // Resolve all references
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
      // Skip if we're back at root level
      const currentIndent = this.getIndentLevel();
      if (currentIndent < baseIndent) break;

      // Skip empty lines
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // Parse definition: $var:value or &obj:value
      if (this.check([TokenType.VAR_REF, TokenType.OBJ_REF, TokenType.NUM_REF])) {
        const refToken = this.advance();
        this.expect(TokenType.COLON);

        const value = this.parseValue();

        // Store in definitions
        if (refToken.type === TokenType.VAR_REF) {
          this.definitions.defineVariable(refToken.value, value);
        } else if (refToken.type === TokenType.OBJ_REF) {
          this.definitions.defineObject(refToken.value, value);
        } else if (refToken.type === TokenType.NUM_REF) {
          this.definitions.defineNumeric(refToken.value, value);
        }

        this.skipWhitespace();
      } else {
        // Skip unknown line
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

      // Section
      if (this.check(TokenType.SECTION)) {
        const section = this.parseSection();
        sections.push(section);
      }
      // Root-level key:value
      else if (this.check(TokenType.IDENTIFIER)) {
        const [key, value] = this.parseKeyValue();
        this.setNestedProperty(root, key, value);
        this.skipWhitespace();
      }
      else {
        // Skip unknown token
        this.advance();
      }
    }

    // Merge sections into root (keep as AST nodes, don't convert to values yet)
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

    // If section has a nested path (e.g., "order.items"), create nested structure
    if (path.includes('.')) {
      this.setNestedProperty(root, path, content);
    } else {
      // Simple property
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
    const sectionName = sectionToken.value.substring(1); // Remove @

    this.skipWhitespace();

    // Check for tabular array: @section [N]{fields}
    if (this.check(TokenType.LBRACKET)) {
      const tabular = this.parseTabularArray();
      const section = new SectionNode(sectionName, new ObjectNode());
      // Wrap tabular in an object? No, sections with tabulars should return the array directly
      // Actually based on spec: @items [N]{...} means items is the array
      // So we return a section that contains the tabular array
      const wrapper = new ObjectNode();
      // This is tricky - the section name is already part of SectionNode
      // We need to return the tabular as the section's content
      // But content should be ObjectNode... let's reconsider

      // Actually looking at spec: @items [N]{fields} means items:[array]
      // So section content can be non-object? Let's make SectionNode flexible
      return new SectionNode(sectionName, tabular);
    }

    // Regular section with key-value pairs
    const content = new ObjectNode();

    // Determine base indentation from first line in section
    // Section content should be indented relative to the section marker
    let baseIndent = null;

    while (!this.isAtEnd()) {
      // Check if we hit another section
      if (this.check(TokenType.SECTION)) {
        break;
      }

      // Get current indentation
      const currentIndent = this.getIndentLevel();

      // Set baseIndent from first indented line
      if (baseIndent === null && currentIndent > 0) {
        baseIndent = currentIndent;
      }

      // If we have a baseIndent and current line is less indented, we're done with this section
      if (baseIndent !== null && currentIndent < baseIndent) {
        break;
      }

      // Skip empty lines
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // If line is not indented and we expected indentation, stop
      if (baseIndent !== null && currentIndent === 0) {
        break;
      }

      // Consume the indent token to position at the identifier
      if (this.check(TokenType.INDENT)) {
        this.advance();
      }

      // Parse key:value within section
      if (this.check(TokenType.IDENTIFIER)) {
        const [key, value] = this.parseKeyValue();
        this.setNestedProperty(content, key, value);
        // Only consume newline, not the indent (we need it for next iteration)
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
    // [N]
    this.expect(TokenType.LBRACKET);
    const countToken = this.expect(TokenType.NUMBER);
    const expectedCount = parseInt(countToken.value);
    this.expect(TokenType.RBRACKET);

    // {fields}
    this.expect(TokenType.LBRACE);

    const fields = [];
    while (!this.check(TokenType.RBRACE)) {
      // Read field name (can include dots: price.amount and arrays: tags[])
      let fieldName = '';
      while (this.check([TokenType.IDENTIFIER, TokenType.DOT])) {
        const token = this.advance();
        fieldName += token.value;
      }

      // Check for array marker []
      if (this.check(TokenType.LBRACKET)) {
        this.advance(); // consume [
        this.expect(TokenType.RBRACKET); // expect ]
        fieldName += '[]';
      }

      if (fieldName) {
        fields.push(fieldName);
      }

      if (this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);
    this.skipWhitespace();

    // Parse rows (pipe-separated values)
    const rows = [];
    const baseIndent = this.getIndentLevel();

    while (!this.isAtEnd() && !this.check(TokenType.SECTION)) {
      const currentIndent = this.getIndentLevel();
      if (currentIndent < baseIndent) break;

      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // Parse row: value1|value2|value3
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

    // Read until newline
    while (!this.isAtEnd() && !this.check(TokenType.NEWLINE) && !this.check(TokenType.SECTION)) {
      // Parse value
      const value = this.parseValue();
      values.push(value);

      // Check for pipe separator
      if (this.check(TokenType.PIPE)) {
        this.advance();
      } else {
        break;
      }
    }

    if (values.length === 0) return null;

    // Create object from fields and values
    const row = new ObjectNode();
    for (let i = 0; i < fields.length; i++) {
      const fieldName = fields[i];
      const value = values[i] || new PrimitiveNode(null);

      // Check if field is an array field (ends with [])
      const isArrayField = fieldName.endsWith('[]');
      const actualField = isArrayField ? fieldName.slice(0, -2) : fieldName;

      // Use dot notation if field contains dots (e.g., price.amount)
      if (actualField.includes('.')) {
        this.setNestedProperty(row, actualField, value);
      } else {
        row.setProperty(actualField, value);
      }
    }

    return row;
  }

  /**
   * Parses a key:value pair.
   *
   * @returns {[string, ASTNode]} Key and value
   */
  parseKeyValue() {
    // Key can be: identifier, identifier.path, or "quoted"
    let key = '';

    if (this.check(TokenType.STRING)) {
      const keyToken = this.advance();
      key = this.parseString(keyToken.value);
    } else {
      // Read key with dots
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
    // Reference
    if (this.check([TokenType.VAR_REF, TokenType.OBJ_REF, TokenType.NUM_REF])) {
      const refToken = this.advance();
      const refType = refToken.type === TokenType.VAR_REF ? 'var' :
                      refToken.type === TokenType.OBJ_REF ? 'object' : 'numeric';
      return new ReferenceNode(refToken.value, refType);
    }

    // Inline object: {key:value,...}
    if (this.check(TokenType.LBRACE)) {
      return this.parseInlineObject();
    }

    // Inline array: [val1,val2,...] or tabular array: [N]{fields}
    if (this.check(TokenType.LBRACKET)) {
      // Check for tabular array pattern: [N]{fields}
      // Peek ahead to see if it's [number]{
      const nextToken = this.peekAt(1);
      const followingToken = this.peekAt(2);
      const afterThat = this.peekAt(3);

      if (nextToken && nextToken.type === TokenType.NUMBER &&
          followingToken && followingToken.type === TokenType.RBRACKET &&
          afterThat && afterThat.type === TokenType.LBRACE) {
        // It's a tabular array
        return this.parseTabularArray();
      }

      return this.parseInlineArray();
    }

    // YAML-style list: - item
    if (this.check(TokenType.DASH)) {
      return this.parseList();
    }

    // Multi-line nested object: key:\n  nested: value
    // OR multi-line list: key:\n  - item or key:\n- item
    // Detected by NEWLINE followed by INDENT or DASH
    if (this.check(TokenType.NEWLINE)) {
      const currentIndent = this.getIndentLevel();
      const nextToken = this.peekAt(1);

      // If next token is a dash (list without indent)
      if (nextToken && nextToken.type === TokenType.DASH) {
        // Consume newline and let parseList handle it
        this.advance();
        return this.parseList();
      }

      // If next line is indented more than current
      if (nextToken && nextToken.type === TokenType.INDENT) {
        // Check what comes after the indent
        const tokenAfterIndent = this.peekAt(2);

        // If it's a dash, it's a YAML list
        if (tokenAfterIndent && tokenAfterIndent.type === TokenType.DASH) {
          // Consume newline and let parseList handle it
          this.advance();
          return this.parseList();
        }

        // Otherwise it's a nested object
        this.advance();
        return this.parseNestedObject();
      }

      // Just a newline with no nested content = null
      return new PrimitiveNode(null);
    }

    // Null
    if (this.check(TokenType.NULL)) {
      this.advance();
      return new PrimitiveNode(null);
    }

    // Boolean
    if (this.check(TokenType.BOOLEAN)) {
      const token = this.advance();
      return new PrimitiveNode(token.value === 'true');
    }

    // Number
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return new PrimitiveNode(parseFloat(token.value));
    }

    // String
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return new PrimitiveNode(this.parseString(token.value));
    }

    // Unquoted string (identifier)
    if (this.check(TokenType.IDENTIFIER)) {
      const token = this.advance();
      return new PrimitiveNode(token.value);
    }

    // Empty value (null)
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

      // If we've de-indented, we're done with this object
      if (currentIndent < baseIndent) {
        break;
      }

      // Hit a section marker = done
      if (this.check(TokenType.SECTION)) {
        break;
      }

      // Skip empty lines
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // No longer indented = done
      if (currentIndent === 0 && baseIndent > 0) {
        break;
      }

      // Consume indent token
      if (this.check(TokenType.INDENT)) {
        this.advance();
      }

      // Parse key:value pair
      if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
        const [key, value] = this.parseKeyValue();
        obj.setProperty(key, value);

        // Consume newline if present
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

      // If we've de-indented below the base level, stop
      if (currentIndent < baseIndent) break;

      // Skip empty lines
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // Consume indent if at correct level
      if (this.check(TokenType.INDENT)) {
        if (currentIndent === baseIndent) {
          this.advance(); // consume indent at our level
        } else if (currentIndent < baseIndent) {
          break; // de-indented, stop
        }
      }

      // Check for dash
      if (this.check(TokenType.DASH)) {
        this.advance(); // consume -

        const value = this.parseValue();
        arr.addElement(value);

        // Consume newline after value if present
        if (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
      } else {
        // No dash at this indentation level, we're done
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
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      // Remove quotes and parse escape sequences
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
    const parts = path.split('.');

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
        // Replace with object
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
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        node.setProperty(key, this.objectToNode(value));
      } else if (Array.isArray(value)) {
        const arr = new ArrayNode();
        for (const item of value) {
          if (item && typeof item === 'object') {
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
}
