"""
Lexer for ASON 2.0 format

Tokenizes ASON 2.0 text into a stream of tokens for the parser.
Handles all ASON 2.0 syntax including sections, arrays, references, and values.

Module: lexer
License: MIT
Version: 2.0.0
"""

import re
from typing import List, Optional
from .token import Token
from .token_type import TokenType


class Lexer:
    """
    Lexical analyzer (tokenizer) for ASON 2.0 format.

    Converts raw text into a stream of tokens that can be parsed.
    Maintains position tracking for error reporting.

    Example:
        >>> lexer = Lexer('@customer\\n  name:John')
        >>> tokens = lexer.tokenize()
    """

    def __init__(self, input_text: str):
        """
        Create a new Lexer instance.

        Args:
            input_text: ASON 2.0 text to tokenize
        """
        self.input = input_text
        self.pos = 0
        self.line = 1
        self.column = 1
        self.tokens: List[Token] = []

    def peek(self) -> Optional[str]:
        """
        Get the current character without consuming it.

        Returns:
            Current character or None if at end
        """
        return self.input[self.pos] if self.pos < len(self.input) else None

    def peek_at(self, offset: int) -> Optional[str]:
        """
        Get a character at offset from current position.

        Args:
            offset: Offset from current position

        Returns:
            Character at offset or None
        """
        target_pos = self.pos + offset
        return self.input[target_pos] if target_pos < len(self.input) else None

    def advance(self) -> Optional[str]:
        """
        Consume and return the current character, advancing position.

        Returns:
            Current character or None if at end
        """
        if self.pos >= len(self.input):
            return None

        char = self.input[self.pos]
        self.pos += 1

        if char == '\n':
            self.line += 1
            self.column = 1
        else:
            self.column += 1

        return char

    def is_at_end(self) -> bool:
        """
        Check if current position is at end of input.

        Returns:
            True if at end of input
        """
        return self.pos >= len(self.input)

    def skip_whitespace(self) -> int:
        """
        Skip whitespace characters (spaces and tabs only, not newlines).

        Returns:
            Number of spaces skipped
        """
        count = 0
        while self.peek() in [' ', '\t']:
            self.advance()
            count += 1
        return count

    def is_identifier_start(self, char: Optional[str]) -> bool:
        """
        Check if a character is a valid identifier start character.

        Args:
            char: Character to check

        Returns:
            True if valid identifier start
        """
        if not char:
            return False
        return bool(re.match(r'[a-zA-Z_]', char))

    def is_identifier_char(self, char: Optional[str]) -> bool:
        """
        Check if a character is a valid identifier character.

        Args:
            char: Character to check

        Returns:
            True if valid identifier character
        """
        if not char:
            return False
        return bool(re.match(r'[a-zA-Z0-9_]', char))

    def is_digit(self, char: Optional[str]) -> bool:
        """
        Check if a character is a digit.

        Args:
            char: Character to check

        Returns:
            True if digit
        """
        if not char:
            return False
        return bool(re.match(r'[0-9]', char))

    def tokenize(self) -> List[Token]:
        """
        Tokenize the entire input.

        Returns:
            Array of tokens
        """
        self.tokens = []

        while not self.is_at_end():
            self.tokenize_next()

        # Add EOF token
        self.tokens.append(Token.eof(self.line, self.column))

        return self.tokens

    def tokenize_next(self):
        """Tokenize the next token from current position."""
        char = self.peek()
        start_line = self.line
        start_column = self.column

        # Newline
        if char in ['\n', '\r']:
            self.tokenize_newline()
            return

        # Whitespace (indentation at start of line)
        if char in [' ', '\t']:
            # Only create INDENT token at start of line
            if (self.column == 1 or len(self.tokens) == 0 or
                    self.tokens[-1].type == TokenType.NEWLINE):
                spaces = self.skip_whitespace()
                if spaces > 0:
                    self.tokens.append(Token.indent(spaces, start_line, start_column))
            else:
                # Skip inline whitespace
                self.skip_whitespace()
            return

        # Comment
        if char == '#':
            self.tokenize_comment()
            return

        # Section marker
        if char == '@':
            self.tokenize_section()
            return

        # Colon
        if char == ':':
            self.advance()
            self.tokens.append(Token(TokenType.COLON, ':', start_line, start_column, 1))
            return

        # Pipe
        if char == '|':
            self.advance()
            self.tokens.append(Token(TokenType.PIPE, '|', start_line, start_column, 1))
            return

        # Number (including negative) - Check BEFORE dash to handle negative numbers
        if self.is_digit(char) or (char == '-' and self.is_digit(self.peek_at(1))):
            self.tokenize_number()
            return

        # Dash (array item) - Only if not followed by digit (negative numbers handled above)
        if char == '-':
            self.advance()
            self.tokens.append(Token(TokenType.DASH, '-', start_line, start_column, 1))
            return

        # Left brace
        if char == '{':
            self.advance()
            self.tokens.append(Token(TokenType.LBRACE, '{', start_line, start_column, 1))
            return

        # Right brace
        if char == '}':
            self.advance()
            self.tokens.append(Token(TokenType.RBRACE, '}', start_line, start_column, 1))
            return

        # Left bracket
        if char == '[':
            self.advance()
            self.tokens.append(Token(TokenType.LBRACKET, '[', start_line, start_column, 1))
            return

        # Right bracket
        if char == ']':
            self.advance()
            self.tokens.append(Token(TokenType.RBRACKET, ']', start_line, start_column, 1))
            return

        # Comma
        if char == ',':
            self.advance()
            self.tokens.append(Token(TokenType.COMMA, ',', start_line, start_column, 1))
            return

        # Dot
        if char == '.':
            self.advance()
            self.tokens.append(Token(TokenType.DOT, '.', start_line, start_column, 1))
            return

        # Variable reference ($var)
        if char == '$':
            self.tokenize_reference('$', TokenType.VAR_REF)
            return

        # Object reference (&obj)
        if char == '&':
            self.tokenize_reference('&', TokenType.OBJ_REF)
            return

        # Quoted string
        if char in ['"', "'"]:
            self.tokenize_quoted_string(char)
            return

        # Identifier, keyword, or unquoted string
        if self.is_identifier_start(char):
            self.tokenize_identifier_or_keyword()
            return

        # Unknown character - skip it
        self.advance()

    def tokenize_newline(self):
        """Tokenize a newline (handles \\n, \\r\\n, \\r)."""
        start_line = self.line
        start_column = self.column
        value = ''

        if self.peek() == '\r' and self.peek_at(1) == '\n':
            value = self.advance() + self.advance()
        else:
            value = self.advance()

        self.tokens.append(Token(TokenType.NEWLINE, value, start_line, start_column, len(value)))

    def tokenize_comment(self):
        """Tokenize a comment (# or #| |#)."""
        start_line = self.line
        start_column = self.column

        self.advance()  # consume #

        # Multi-line comment start #|
        if self.peek() == '|':
            self.advance()  # consume |
            self.tokens.append(Token(TokenType.COMMENT_START, '#|', start_line, start_column, 2))
            return

        # Single-line comment - consume until newline
        value = '#'
        while not self.is_at_end() and self.peek() not in ['\n', '\r']:
            value += self.advance()

        self.tokens.append(Token(TokenType.COMMENT, value, start_line, start_column, len(value)))

    def tokenize_section(self):
        """Tokenize a section marker (@section_name)."""
        start_line = self.line
        start_column = self.column

        self.advance()  # consume @

        # Read section name (identifier)
        name = ''
        while self.is_identifier_char(self.peek()) or self.peek() == '.':
            name += self.advance()

        value = '@' + name
        self.tokens.append(Token(TokenType.SECTION, value, start_line, start_column, len(value)))

    def tokenize_reference(self, prefix: str, token_type: TokenType):
        """
        Tokenize a reference ($var or &obj).

        Args:
            prefix: Reference prefix ($ or &)
            token_type: Token type
        """
        start_line = self.line
        start_column = self.column

        self.advance()  # consume prefix

        # Check for keywords like $def: or $data:
        if prefix == '$':
            remaining = self.input[self.pos:self.pos + 5]
            if remaining.startswith('def:'):
                for _ in range(4):
                    self.advance()  # consume 'def:'
                self.tokens.append(Token(TokenType.DEF_KEYWORD, '$def:', start_line, start_column, 5))
                return
            if remaining.startswith('data:'):
                for _ in range(5):
                    self.advance()  # consume 'data:'
                self.tokens.append(Token(TokenType.DATA_KEYWORD, '$data:', start_line, start_column, 6))
                return

        # Read reference name
        name = ''
        while self.is_identifier_char(self.peek()):
            name += self.advance()

        value = prefix + name
        self.tokens.append(Token(token_type, value, start_line, start_column, len(value)))

    def tokenize_quoted_string(self, quote: str):
        """
        Tokenize a quoted string (supports " and ').

        Args:
            quote: Quote character (" or ')
        """
        start_line = self.line
        start_column = self.column

        self.advance()  # consume opening quote

        value = ''
        escaped = False

        while not self.is_at_end():
            char = self.peek()

            if escaped:
                value += self.advance()
                escaped = False
            elif char == '\\':
                value += self.advance()
                escaped = True
            elif char == quote:
                self.advance()  # consume closing quote
                break
            else:
                value += self.advance()

        # Return the value WITH quotes so parser can distinguish quoted vs unquoted
        full_value = quote + value + quote
        self.tokens.append(Token(TokenType.STRING, full_value, start_line, start_column, len(full_value)))

    def tokenize_number(self):
        """Tokenize a number (integer or float, including negative)."""
        start_line = self.line
        start_column = self.column

        value = ''

        # Handle negative sign
        if self.peek() == '-':
            value += self.advance()

        # Read digits
        while self.is_digit(self.peek()):
            value += self.advance()

        # Read decimal part
        if self.peek() == '.' and self.is_digit(self.peek_at(1)):
            value += self.advance()  # consume .
            while self.is_digit(self.peek()):
                value += self.advance()

        # Read scientific notation (e.g., 1.5e10, 2e-3)
        if self.peek() in ['e', 'E']:
            next_char = self.peek_at(1)
            has_sign = next_char in ['+', '-']
            char_after_sign = self.peek_at(2) if has_sign else next_char

            # Only treat as scientific notation if there's a digit after e/E (and optional sign)
            if self.is_digit(char_after_sign):
                value += self.advance()  # consume 'e' or 'E'
                if has_sign:
                    value += self.advance()  # consume '+' or '-'
                while self.is_digit(self.peek()):
                    value += self.advance()

        self.tokens.append(Token(TokenType.NUMBER, value, start_line, start_column, len(value)))

    def tokenize_identifier_or_keyword(self):
        """Tokenize an identifier, keyword, or unquoted string value."""
        start_line = self.line
        start_column = self.column

        value = ''

        # Read identifier characters
        while self.is_identifier_char(self.peek()) or self.peek() == '.':
            value += self.advance()

        # Check for keywords (true, false, null)
        if value in ['true', 'false']:
            self.tokens.append(Token(TokenType.BOOLEAN, value, start_line, start_column, len(value)))
            return

        if value == 'null':
            self.tokens.append(Token(TokenType.NULL, value, start_line, start_column, len(value)))
            return

        # Otherwise it's an identifier or unquoted string
        self.tokens.append(Token(TokenType.IDENTIFIER, value, start_line, start_column, len(value)))

    @staticmethod
    def filter_ignorable(tokens: List[Token]) -> List[Token]:
        """
        Filter out ignorable tokens (comments, whitespace).

        Args:
            tokens: Tokens to filter

        Returns:
            Filtered tokens
        """
        return [
            token for token in tokens
            if token.type not in [TokenType.COMMENT, TokenType.COMMENT_START, TokenType.COMMENT_END]
        ]
