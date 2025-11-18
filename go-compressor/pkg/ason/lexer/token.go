package lexer

// Token represents a lexical token with its type, value, and position
type Token struct {
	Type   TokenType // The type of the token
	Value  string    // The literal value of the token
	Line   int       // Line number (1-indexed)
	Column int       // Column number (1-indexed)
}

// NewToken creates a new token
func NewToken(tokenType TokenType, value string, line, column int) Token {
	return Token{
		Type:   tokenType,
		Value:  value,
		Line:   line,
		Column: column,
	}
}

// String returns a string representation of the token
func (t Token) String() string {
	if t.Value == "" {
		return t.Type.String()
	}
	return t.Type.String() + "(" + t.Value + ")"
}
