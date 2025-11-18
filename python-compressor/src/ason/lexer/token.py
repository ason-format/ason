"""
Token class for ASON 2.0 Lexer

Represents a single lexical token in the ASON 2.0 format.
Tokens are the atomic units produced by the lexer and consumed by the parser.

Module: token
License: MIT
Version: 2.0.0
"""

from typing import List, Optional, Union
from .token_type import TokenType, get_token_type_name


class Token:
    """
    Represents a single lexical token.

    Attributes:
        type: Token type from TokenType enum
        value: Raw string value of the token
        line: Line number where token appears (1-indexed)
        column: Column number where token starts (1-indexed)
        length: Length of the token in characters

    Example:
        >>> token = Token(TokenType.STRING, 'hello', 1, 5)
        >>> print(token)
        string 'hello' at 1:5
    """

    def __init__(
        self,
        token_type: TokenType,
        value: str,
        line: int,
        column: int,
        length: Optional[int] = None
    ):
        """
        Create a new Token instance.

        Args:
            token_type: Token type (from TokenType enum)
            value: Raw string value
            line: Line number (1-indexed)
            column: Column number (1-indexed)
            length: Length in characters (defaults to len(value))
        """
        self.type = token_type
        self.value = value
        self.line = line
        self.column = column
        self.length = length if length is not None else len(value)

    def is_type(self, types: Union[TokenType, List[TokenType]]) -> bool:
        """
        Check if this token is of a specific type.

        Args:
            types: Token type(s) to check against

        Returns:
            True if token matches any of the given types

        Example:
            >>> token.is_type(TokenType.STRING)
            True
            >>> token.is_type([TokenType.STRING, TokenType.NUMBER])
            True
        """
        if isinstance(types, list):
            return self.type in types
        return self.type == types

    def is_not(self, types: Union[TokenType, List[TokenType]]) -> bool:
        """
        Check if this token is NOT of a specific type.

        Args:
            types: Token type(s) to check against

        Returns:
            True if token doesn't match any of the given types
        """
        return not self.is_type(types)

    def end_column(self) -> int:
        """
        Get the end column of this token.

        Returns:
            Column number where token ends

        Example:
            >>> token = Token(TokenType.STRING, 'hello', 1, 5)
            >>> token.end_column()
            10
        """
        return self.column + self.length

    def position(self) -> str:
        """
        Get a human-readable position string.

        Returns:
            Position in format "line:column"

        Example:
            >>> token.position()
            '1:5'
        """
        return f"{self.line}:{self.column}"

    def __str__(self) -> str:
        """
        Create a debug-friendly string representation.

        Returns:
            String representation of the token

        Example:
            >>> str(token)
            "string 'hello' at 1:5"
        """
        type_name = get_token_type_name(self.type)
        display_value = self.value[:17] + '...' if len(self.value) > 20 else self.value
        return f"{type_name} '{display_value}' at {self.position()}"

    def __repr__(self) -> str:
        return f"Token({self.type}, {repr(self.value)}, {self.line}, {self.column})"

    def clone(self) -> 'Token':
        """
        Create a shallow copy of this token.

        Returns:
            New token with same properties
        """
        return Token(self.type, self.value, self.line, self.column, self.length)

    def equals(self, other: 'Token') -> bool:
        """
        Check if this token equals another token (by value and type).

        Args:
            other: Token to compare with

        Returns:
            True if tokens are equal
        """
        return (
            isinstance(other, Token) and
            self.type == other.type and
            self.value == other.value
        )

    def to_dict(self) -> dict:
        """
        Convert token to a dictionary (useful for debugging/serialization).

        Returns:
            Plain object representation
        """
        return {
            'type': self.type.value if isinstance(self.type, TokenType) else self.type,
            'value': self.value,
            'line': self.line,
            'column': self.column,
            'length': self.length
        }

    @staticmethod
    def from_dict(obj: dict) -> 'Token':
        """
        Create a token from a dictionary.

        Args:
            obj: Plain object with token properties

        Returns:
            New Token instance
        """
        return Token(
            TokenType(obj['type']),
            obj['value'],
            obj['line'],
            obj['column'],
            obj['length']
        )

    @staticmethod
    def eof(line: int, column: int) -> 'Token':
        """
        Create an EOF (end of file) token.

        Args:
            line: Line number where EOF occurs
            column: Column number where EOF occurs

        Returns:
            EOF token
        """
        return Token(TokenType.EOF, '', line, column, 0)

    @staticmethod
    def error(message: str, line: int, column: int) -> 'Token':
        """
        Create an error token with a message.

        Args:
            message: Error message
            line: Line number where error occurs
            column: Column number where error occurs

        Returns:
            Error token
        """
        return Token(TokenType.ERROR, message, line, column, len(message))

    @staticmethod
    def newline(line: int, column: int, value: str = '\n') -> 'Token':
        """
        Create a newline token.

        Args:
            line: Line number
            column: Column number
            value: Newline character(s)

        Returns:
            Newline token
        """
        return Token(TokenType.NEWLINE, value, line, column, len(value))

    @staticmethod
    def indent(spaces: int, line: int, column: int = 1) -> 'Token':
        """
        Create an indent token.

        Args:
            spaces: Number of spaces/indentation
            line: Line number
            column: Column number (usually 1)

        Returns:
            Indent token
        """
        value = ' ' * spaces
        return Token(TokenType.INDENT, value, line, column, spaces)
