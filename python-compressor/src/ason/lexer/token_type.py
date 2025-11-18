"""
Token types for ASON 2.0 Lexer

Defines all token types used in the ASON 2.0 format specification.
Each token type represents a distinct syntactic element in the language.

Module: token_type
License: MIT
Version: 2.0.0
"""

from enum import Enum
from typing import List


class TokenType(str, Enum):
    """Enumeration of all ASON 2.0 token types."""

    # Structural delimiters
    SECTION = '@'  # Section marker: @section_name
    COLON = ':'  # Key-value separator: key:value
    PIPE = '|'  # Field separator in tabular arrays: value1|value2
    DASH = '-'  # Array item marker (YAML-style): - item
    BACKSLASH = '\\'  # Line continuation

    # Brackets and braces
    LBRACE = '{'  # Object start: {
    RBRACE = '}'  # Object end: }
    LBRACKET = '['  # Array start or count indicator: [
    RBRACKET = ']'  # Array end: ]

    # References
    VAR_REF = '$'  # Named variable reference: $var_name
    OBJ_REF = '&'  # Object alias reference: &obj0
    NUM_REF = '#'  # Numeric reference (legacy, deprecated): #0

    # Reserved keywords
    DEF_KEYWORD = '$def:'  # Definitions section: $def:
    DATA_KEYWORD = '$data:'  # Data section: $data:

    # Value types
    STRING = 'STRING'  # String value (quoted or unquoted)
    NUMBER = 'NUMBER'  # Numeric value: 123, 45.67, -3.14
    BOOLEAN = 'BOOLEAN'  # Boolean value: true, false
    NULL = 'NULL'  # Null value: null
    IDENTIFIER = 'IDENTIFIER'  # Identifier (key name or reference name)

    # Whitespace and formatting
    NEWLINE = 'NEWLINE'  # Newline character(s): \n, \r\n, \r
    INDENT = 'INDENT'  # Indentation (spaces or tabs)
    WHITESPACE = 'WHITESPACE'  # Whitespace within a line

    # Comments
    COMMENT = 'COMMENT'  # Single-line comment: # comment
    COMMENT_START = 'COMMENT_START'  # Multi-line comment start: #|
    COMMENT_END = 'COMMENT_END'  # Multi-line comment end: |#

    # Special markers
    ARRAY_MARKER = 'ARRAY_MARKER'  # Array count and schema marker: [N]{fields}
    SCHEMA_MARKER = 'SCHEMA_MARKER'  # Schema definition marker: :schema{}
    DOT = '.'  # Dot for path notation: a.b.c
    COMMA = ','  # Comma (for inline arrays/objects)

    # Control
    EOF = 'EOF'  # End of file
    ERROR = 'ERROR'  # Unknown/error token


def is_value_type(token_type: TokenType) -> bool:
    """
    Check if a token type represents a value.

    Args:
        token_type: Token type to check

    Returns:
        True if token type represents a value

    Example:
        >>> is_value_type(TokenType.STRING)
        True
        >>> is_value_type(TokenType.COLON)
        False
    """
    return token_type in [
        TokenType.STRING,
        TokenType.NUMBER,
        TokenType.BOOLEAN,
        TokenType.NULL,
        TokenType.IDENTIFIER
    ]


def is_reference_type(token_type: TokenType) -> bool:
    """
    Check if a token type represents a reference.

    Args:
        token_type: Token type to check

    Returns:
        True if token type represents a reference

    Example:
        >>> is_reference_type(TokenType.VAR_REF)
        True
        >>> is_reference_type(TokenType.STRING)
        False
    """
    return token_type in [
        TokenType.VAR_REF,
        TokenType.OBJ_REF,
        TokenType.NUM_REF
    ]


def is_bracket_type(token_type: TokenType) -> bool:
    """
    Check if a token type represents a bracket.

    Args:
        token_type: Token type to check

    Returns:
        True if token type is a bracket
    """
    return token_type in [
        TokenType.LBRACE,
        TokenType.RBRACE,
        TokenType.LBRACKET,
        TokenType.RBRACKET
    ]


def is_ignorable_type(token_type: TokenType) -> bool:
    """
    Check if a token should be ignored during parsing.

    Args:
        token_type: Token type to check

    Returns:
        True if token should be ignored
    """
    return token_type in [
        TokenType.COMMENT,
        TokenType.COMMENT_START,
        TokenType.COMMENT_END,
        TokenType.WHITESPACE
    ]


def get_token_type_name(token_type: TokenType) -> str:
    """
    Get a human-readable name for a token type.

    Args:
        token_type: Token type

    Returns:
        Human-readable name

    Example:
        >>> get_token_type_name(TokenType.VAR_REF)
        'variable reference ($)'
    """
    names = {
        TokenType.SECTION: 'section marker (@)',
        TokenType.COLON: 'colon (:)',
        TokenType.PIPE: 'pipe (|)',
        TokenType.DASH: 'dash (-)',
        TokenType.VAR_REF: 'variable reference ($)',
        TokenType.OBJ_REF: 'object reference (&)',
        TokenType.NUM_REF: 'numeric reference (#)',
        TokenType.LBRACE: 'left brace ({)',
        TokenType.RBRACE: 'right brace (})',
        TokenType.LBRACKET: 'left bracket ([)',
        TokenType.RBRACKET: 'right bracket (])',
        TokenType.DOT: 'dot (.)',
        TokenType.COMMA: 'comma (,)',
        TokenType.STRING: 'string',
        TokenType.NUMBER: 'number',
        TokenType.BOOLEAN: 'boolean',
        TokenType.NULL: 'null',
        TokenType.IDENTIFIER: 'identifier',
        TokenType.NEWLINE: 'newline',
        TokenType.EOF: 'end of file'
    }

    return names.get(token_type, str(token_type))
