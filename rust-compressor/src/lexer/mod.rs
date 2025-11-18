//! Lexer module for tokenizing ASON format

pub mod token;
pub mod token_type;

pub use token::Token;
pub use token_type::TokenType;

use token_type::TokenType::*;

/// Lexer for ASON format
pub struct Lexer {
    input: Vec<char>,
    position: usize,
    line: usize,
    column: usize,
}

impl Lexer {
    pub fn new(input: &str) -> Self {
        Self {
            input: input.chars().collect(),
            position: 0,
            line: 1,
            column: 0,
        }
    }

    pub fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();
        
        loop {
            let token = self.next_token();
            let is_eof = matches!(token.token_type, EOF);
            
            // Skip whitespace tokens but keep newlines
            if !matches!(token.token_type, Whitespace) {
                tokens.push(token);
            }
            
            if is_eof {
                break;
            }
        }
        
        tokens
    }

    fn next_token(&mut self) -> Token {
        self.skip_whitespace_except_newline();
        
        let line = self.line;
        let column = self.column;
        
        let current = self.current_char();
        
        match current {
            None => Token::new(EOF, std::string::String::new(), line, column),
            Some('\n') => {
                self.advance();
                self.line += 1;
                self.column = 0;
                Token::new(Newline, "\\n".to_string(), line, column)
            }
            Some('{') => {
                self.advance();
                Token::new(LBrace, "{".to_string(), line, column)
            }
            Some('}') => {
                self.advance();
                Token::new(RBrace, "}".to_string(), line, column)
            }
            Some('[') => {
                self.advance();
                Token::new(LBracket, "[".to_string(), line, column)
            }
            Some(']') => {
                self.advance();
                Token::new(RBracket, "]".to_string(), line, column)
            }
            Some(':') => {
                self.advance();
                Token::new(Colon, ":".to_string(), line, column)
            }
            Some(',') => {
                self.advance();
                Token::new(Comma, ",".to_string(), line, column)
            }
            Some('|') => {
                self.advance();
                Token::new(Pipe, "|".to_string(), line, column)
            }
            Some('@') => {
                self.advance();
                Token::new(At, "@".to_string(), line, column)
            }
            Some('$') => {
                self.advance();
                Token::new(Dollar, "$".to_string(), line, column)
            }
            Some('&') => {
                self.advance();
                Token::new(Ampersand, "&".to_string(), line, column)
            }
            Some('=') => {
                self.advance();
                Token::new(Equal, "=".to_string(), line, column)
            }
            Some('"') => {
                let value = self.read_string();
                Token::new(String, value, line, column)
            }
            Some(ch) if ch.is_ascii_digit() || ch == '-' => {
                let value = self.read_number();
                Token::new(Number, value, line, column)
            }
            Some(ch) if ch.is_alphabetic() => {
                let value = self.read_identifier();
                let token_type = match value.as_str() {
                    "true" => True,
                    "false" => False,
                    "null" => Null,
                    _ => String,
                };
                Token::new(token_type, value, line, column)
            }
            Some(ch) => {
                self.advance();
                Token::new(Illegal, ch.to_string(), line, column)
            }
        }
    }

    fn current_char(&self) -> Option<char> {
        if self.position < self.input.len() {
            Some(self.input[self.position])
        } else {
            None
        }
    }

    fn advance(&mut self) {
        self.position += 1;
        self.column += 1;
    }

    fn skip_whitespace_except_newline(&mut self) {
        while let Some(ch) = self.current_char() {
            if ch == ' ' || ch == '\t' || ch == '\r' {
                self.advance();
            } else {
                break;
            }
        }
    }

    fn read_string(&mut self) -> std::string::String {
        self.advance(); // skip opening quote
        let mut result = std::string::String::new();
        
        while let Some(ch) = self.current_char() {
            if ch == '"' {
                self.advance(); // skip closing quote
                break;
            }
            if ch == '\\' {
                self.advance();
                if let Some(escaped) = self.current_char() {
                    match escaped {
                        'n' => result.push('\n'),
                        't' => result.push('\t'),
                        'r' => result.push('\r'),
                        '"' => result.push('"'),
                        '\\' => result.push('\\'),
                        _ => result.push(escaped),
                    }
                    self.advance();
                }
            } else {
                result.push(ch);
                self.advance();
            }
        }
        
        result
    }

    fn read_number(&mut self) -> std::string::String {
        let start = self.position;
        
        if self.current_char() == Some('-') {
            self.advance();
        }
        
        while let Some(ch) = self.current_char() {
            if ch.is_ascii_digit() {
                self.advance();
            } else {
                break;
            }
        }
        
        if self.current_char() == Some('.') {
            self.advance();
            while let Some(ch) = self.current_char() {
                if ch.is_ascii_digit() {
                    self.advance();
                } else {
                    break;
                }
            }
        }
        
        self.input[start..self.position].iter().collect()
    }

    fn read_identifier(&mut self) -> std::string::String {
        let start = self.position;
        
        while let Some(ch) = self.current_char() {
            if ch.is_alphanumeric() || ch == '_' {
                self.advance();
            } else {
                break;
            }
        }
        
        self.input[start..self.position].iter().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize_simple_object() {
        let mut lexer = Lexer::new(r#"{"name": "Alice", "age": 30}"#);
        let tokens = lexer.tokenize();
        
        assert_eq!(tokens[0].token_type, LBrace);
        assert_eq!(tokens[1].token_type, String);
        assert_eq!(tokens[1].value, "name");
    }

    #[test]
    fn test_tokenize_numbers() {
        let mut lexer = Lexer::new("42 3.14 -10");
        let tokens = lexer.tokenize();
        
        assert!(matches!(tokens[0].token_type, Number));
        assert_eq!(tokens[0].value, "42");
        assert_eq!(tokens[1].value, "3.14");
        assert_eq!(tokens[2].value, "-10");
    }
}
