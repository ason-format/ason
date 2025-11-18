package lexer

import (
	"strings"
	"unicode"
)

// Lexer tokenizes ASON format input
type Lexer struct {
	input        string
	position     int // current position in input
	readPosition int // reading position (after current char)
	ch           byte
	line         int
	column       int
}

// New creates a new Lexer instance
func New(input string) *Lexer {
	l := &Lexer{
		input:  input,
		line:   1,
		column: 0,
	}
	l.readChar()
	return l
}

// readChar advances the lexer position
func (l *Lexer) readChar() {
	if l.readPosition >= len(l.input) {
		l.ch = 0 // EOF
	} else {
		l.ch = l.input[l.readPosition]
	}
	l.position = l.readPosition
	l.readPosition++
	l.column++
}

// peekChar looks ahead without consuming
func (l *Lexer) peekChar() byte {
	if l.readPosition >= len(l.input) {
		return 0
	}
	return l.input[l.readPosition]
}

// Tokenize returns all tokens from the input
func (l *Lexer) Tokenize() []Token {
	tokens := []Token{}
	for {
		tok := l.NextToken()
		// Skip whitespace tokens (but keep newlines as they're significant in ASON)
		if tok.Type != WHITESPACE {
			tokens = append(tokens, tok)
		}
		if tok.Type == EOF {
			break
		}
	}
	return tokens
}

// NextToken returns the next token from the input
func (l *Lexer) NextToken() Token {
	var tok Token

	l.skipWhitespaceExceptNewline()

	tok.Line = l.line
	tok.Column = l.column

	switch l.ch {
	case 0:
		tok = NewToken(EOF, "", l.line, l.column)
	case '\n':
		tok = NewToken(NEWLINE, "\\n", l.line, l.column)
		l.line++
		l.column = 0
		l.readChar()
	case '{':
		tok = NewToken(LBRACE, string(l.ch), l.line, l.column)
		l.readChar()
	case '}':
		tok = NewToken(RBRACE, string(l.ch), l.line, l.column)
		l.readChar()
	case '[':
		tok = NewToken(LBRACKET, string(l.ch), l.line, l.column)
		l.readChar()
	case ']':
		tok = NewToken(RBRACKET, string(l.ch), l.line, l.column)
		l.readChar()
	case '(':
		tok = NewToken(LPAREN, string(l.ch), l.line, l.column)
		l.readChar()
	case ')':
		tok = NewToken(RPAREN, string(l.ch), l.line, l.column)
		l.readChar()
	case ':':
		tok = NewToken(COLON, string(l.ch), l.line, l.column)
		l.readChar()
	case ',':
		tok = NewToken(COMMA, string(l.ch), l.line, l.column)
		l.readChar()
	case '|':
		tok = NewToken(PIPE, string(l.ch), l.line, l.column)
		l.readChar()
	case '.':
		tok = NewToken(DOT, string(l.ch), l.line, l.column)
		l.readChar()
	case '@':
		tok = NewToken(AT, string(l.ch), l.line, l.column)
		l.readChar()
	case '$':
		tok = NewToken(DOLLAR, string(l.ch), l.line, l.column)
		l.readChar()
	case '&':
		tok = NewToken(AMPERSAND, string(l.ch), l.line, l.column)
		l.readChar()
	case '=':
		tok = NewToken(EQUAL, string(l.ch), l.line, l.column)
		l.readChar()
	case '"':
		tok.Type = STRING
		tok.Value = l.readString()
	case '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
		tok.Type = NUMBER
		tok.Value = l.readNumber()
	default:
		if isLetter(l.ch) {
			tok.Value = l.readIdentifier()
			tok.Type = lookupIdent(tok.Value)
			return tok
		}
		tok = NewToken(ILLEGAL, string(l.ch), l.line, l.column)
		l.readChar()
	}

	return tok
}

// skipWhitespaceExceptNewline skips spaces and tabs but not newlines
func (l *Lexer) skipWhitespaceExceptNewline() {
	for l.ch == ' ' || l.ch == '\t' || l.ch == '\r' {
		l.readChar()
	}
}

// readString reads a string literal
func (l *Lexer) readString() string {
	var result strings.Builder
	l.readChar() // skip opening quote

	for l.ch != '"' && l.ch != 0 {
		if l.ch == '\\' {
			l.readChar()
			switch l.ch {
			case 'n':
				result.WriteByte('\n')
			case 't':
				result.WriteByte('\t')
			case 'r':
				result.WriteByte('\r')
			case '"':
				result.WriteByte('"')
			case '\\':
				result.WriteByte('\\')
			default:
				result.WriteByte(l.ch)
			}
		} else {
			result.WriteByte(l.ch)
		}
		l.readChar()
	}

	l.readChar() // skip closing quote
	return result.String()
}

// readNumber reads a number (integer or float)
func (l *Lexer) readNumber() string {
	start := l.position
	
	if l.ch == '-' {
		l.readChar()
	}
	
	for isDigit(l.ch) {
		l.readChar()
	}
	
	if l.ch == '.' {
		l.readChar()
		for isDigit(l.ch) {
			l.readChar()
		}
	}
	
	if l.ch == 'e' || l.ch == 'E' {
		l.readChar()
		if l.ch == '+' || l.ch == '-' {
			l.readChar()
		}
		for isDigit(l.ch) {
			l.readChar()
		}
	}
	
	return l.input[start:l.position]
}

// readIdentifier reads an identifier (for keywords like true, false, null)
func (l *Lexer) readIdentifier() string {
	start := l.position
	for isLetter(l.ch) || isDigit(l.ch) || l.ch == '_' {
		l.readChar()
	}
	return l.input[start:l.position]
}

// isLetter checks if a character is a letter
func isLetter(ch byte) bool {
	return unicode.IsLetter(rune(ch)) || ch == '_'
}

// isDigit checks if a character is a digit
func isDigit(ch byte) bool {
	return '0' <= ch && ch <= '9'
}

// lookupIdent determines if an identifier is a keyword
func lookupIdent(ident string) TokenType {
	switch ident {
	case "true":
		return TRUE
	case "false":
		return FALSE
	case "null":
		return NULL
	default:
		return STRING // In ASON, unquoted identifiers are treated as strings
	}
}
