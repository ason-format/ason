//! Token type definitions

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenType {
    // Special
    EOF,
    Illegal,
    Whitespace,
    Newline,
    
    // Literals
    String,
    Number,
    True,
    False,
    Null,
    
    // Delimiters
    LBrace,      // {
    RBrace,      // }
    LBracket,    // [
    RBracket,    // ]
    Colon,       // :
    Comma,       // ,
    Pipe,        // |
    
    // ASON specific
    At,          // @
    Dollar,      // $
    Ampersand,   // &
    Equal,       // =
}

impl std::fmt::Display for TokenType {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}
