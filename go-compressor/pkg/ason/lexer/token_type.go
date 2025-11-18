package lexer

// TokenType represents the type of a lexical token in ASON format
type TokenType int

const (
	// Special tokens
	EOF TokenType = iota
	ILLEGAL
	WHITESPACE
	NEWLINE

	// Literals
	STRING
	NUMBER
	TRUE
	FALSE
	NULL

	// Delimiters
	LBRACE    // {
	RBRACE    // }
	LBRACKET  // [
	RBRACKET  // ]
	LPAREN    // (
	RPAREN    // )
	COLON     // :
	COMMA     // ,
	PIPE      // |
	DOT       // .

	// ASON 2.0 specific
	AT          // @ (section marker)
	DOLLAR      // $ (reference usage)
	AMPERSAND   // & (reference definition)
	EQUAL       // = (assignment)
)

// String returns a human-readable string representation of the token type
func (t TokenType) String() string {
	switch t {
	case EOF:
		return "EOF"
	case ILLEGAL:
		return "ILLEGAL"
	case WHITESPACE:
		return "WHITESPACE"
	case NEWLINE:
		return "NEWLINE"
	case STRING:
		return "STRING"
	case NUMBER:
		return "NUMBER"
	case TRUE:
		return "TRUE"
	case FALSE:
		return "FALSE"
	case NULL:
		return "NULL"
	case LBRACE:
		return "LBRACE"
	case RBRACE:
		return "RBRACE"
	case LBRACKET:
		return "LBRACKET"
	case RBRACKET:
		return "RBRACKET"
	case LPAREN:
		return "LPAREN"
	case RPAREN:
		return "RPAREN"
	case COLON:
		return "COLON"
	case COMMA:
		return "COMMA"
	case PIPE:
		return "PIPE"
	case DOT:
		return "DOT"
	case AT:
		return "AT"
	case DOLLAR:
		return "DOLLAR"
	case AMPERSAND:
		return "AMPERSAND"
	case EQUAL:
		return "EQUAL"
	default:
		return "UNKNOWN"
	}
}
