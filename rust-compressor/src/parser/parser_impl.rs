//! Parser implementation

use super::ast::ASTNode;
use super::ParseError;
use crate::lexer::{Token, TokenType};
use serde_json::Value;
use std::collections::HashMap;

pub struct Parser {
    tokens: Vec<Token>,
    position: usize,
    references: HashMap<String, ASTNode>,
}

impl Parser {
    pub fn new(tokens: Vec<Token>) -> Self {
        Self {
            tokens,
            position: 0,
            references: HashMap::new(),
        }
    }

    pub fn parse(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        self.skip_newlines();

        // Clone token type to avoid borrow checker issues
        let current_type = self.current().token_type.clone();

        // Check for sections
        if matches!(current_type, TokenType::At) {
            return self.parse_root_with_sections();
        }

        // Check for reference definitions followed by arrays
        if matches!(current_type, TokenType::Ampersand) {
            while matches!(self.current().token_type, TokenType::Ampersand) {
                let _ = self.parse_reference_definition()?;
                self.skip_newlines();
            }

            if matches!(self.current().token_type, TokenType::LBracket) {
                return self.parse_value();
            }
        }

        // Check for implicit object (key:value)
        if matches!(current_type, TokenType::String) && self.position + 1 < self.tokens.len() {
            let next = &self.tokens[self.position + 1];
            if matches!(next.token_type, TokenType::Colon) {
                return self.parse_implicit_object();
            }
        }

        self.parse_value()
    }

    fn parse_root_with_sections(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        let mut obj = HashMap::new();

        while !matches!(self.current().token_type, TokenType::EOF) {
            self.skip_newlines();

            if matches!(self.current().token_type, TokenType::EOF) {
                break;
            }

            if matches!(self.current().token_type, TokenType::At) {
                self.advance(); // skip @
                let section_name = self.current().value.clone();
                self.advance();
                self.skip_newlines();

                let value = self.parse_value()?;
                obj.insert(section_name, value);
            }

            self.skip_newlines();
        }

        Ok(ASTNode::Object(obj))
    }

    fn parse_implicit_object(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        let mut obj = HashMap::new();

        while !matches!(self.current().token_type, TokenType::EOF) {
            self.skip_whitespace();

            if !matches!(self.current().token_type, TokenType::String) {
                break;
            }

            let key = self.current().value.clone();
            self.advance();
            self.skip_whitespace();

            if !matches!(self.current().token_type, TokenType::Colon) {
                return Err(Box::new(ParseError::new("Expected ':'".to_string())));
            }
            self.advance();
            self.skip_whitespace();

            let value = self.parse_value()?;
            obj.insert(key, value);

            self.skip_newlines();
        }

        Ok(ASTNode::Object(obj))
    }

    fn parse_value(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        match &self.current().token_type {
            TokenType::LBrace => self.parse_object(),
            TokenType::LBracket => self.parse_array_or_tabular(),
            TokenType::String => {
                let value = self.current().value.clone();
                self.advance();
                Ok(ASTNode::Primitive(Value::String(value)))
            }
            TokenType::Number => {
                let value = self.current().value.parse::<f64>()?;
                self.advance();
                Ok(ASTNode::Primitive(Value::Number(
                    serde_json::Number::from_f64(value).unwrap_or(serde_json::Number::from(0)),
                )))
            }
            TokenType::True => {
                self.advance();
                Ok(ASTNode::Primitive(Value::Bool(true)))
            }
            TokenType::False => {
                self.advance();
                Ok(ASTNode::Primitive(Value::Bool(false)))
            }
            TokenType::Null => {
                self.advance();
                Ok(ASTNode::Primitive(Value::Null))
            }
            _ => Err(Box::new(ParseError::new(format!(
                "Unexpected token: {:?}",
                self.current().token_type
            )))),
        }
    }

    fn parse_object(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        self.advance(); // skip {
        let mut obj = HashMap::new();

        while !matches!(self.current().token_type, TokenType::RBrace | TokenType::EOF) {
            self.skip_whitespace();

            let key = self.current().value.clone();
            self.advance();
            self.skip_whitespace();

            if !matches!(self.current().token_type, TokenType::Colon) {
                return Err(Box::new(ParseError::new("Expected ':'".to_string())));
            }
            self.advance();
            self.skip_whitespace();

            let value = self.parse_value()?;
            obj.insert(key, value);

            self.skip_whitespace();

            if matches!(self.current().token_type, TokenType::Comma) {
                self.advance();
            }
        }

        self.advance(); // skip }
        Ok(ASTNode::Object(obj))
    }

    fn parse_array_or_tabular(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        self.advance(); // skip [

        // Check for tabular format [N]{fields}
        if matches!(self.current().token_type, TokenType::Number) {
            let count_str = self.current().value.clone();
            let saved_pos = self.position;
            self.advance();

            if matches!(self.current().token_type, TokenType::RBracket) {
                self.advance();
                if matches!(self.current().token_type, TokenType::LBrace) {
                    // This is tabular
                    return self.parse_tabular_array(count_str);
                }
            }

            // Not tabular, backtrack
            self.position = saved_pos;
        }

        self.parse_regular_array()
    }

    fn parse_regular_array(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        let mut arr = Vec::new();

        while !matches!(self.current().token_type, TokenType::RBracket | TokenType::EOF) {
            self.skip_whitespace();
            let value = self.parse_value()?;
            arr.push(value);
            self.skip_whitespace();

            if matches!(self.current().token_type, TokenType::Comma | TokenType::Pipe) {
                self.advance();
            }
        }

        self.advance(); // skip ]
        Ok(ASTNode::Array(arr))
    }

    fn parse_tabular_array(&mut self, count_str: String) -> Result<ASTNode, Box<dyn std::error::Error>> {
        let count: usize = count_str.parse()?;

        self.advance(); // skip {
        let mut fields = Vec::new();

        while !matches!(self.current().token_type, TokenType::RBrace | TokenType::EOF) {
            fields.push(self.current().value.clone());
            self.advance();

            if matches!(self.current().token_type, TokenType::Comma) {
                self.advance();
            }
        }

        self.advance(); // skip }
        self.skip_newlines();

        let mut rows = Vec::new();

        for _ in 0..count {
            if matches!(self.current().token_type, TokenType::EOF) {
                break;
            }

            let mut row = Vec::new();

            for _ in 0..fields.len() {
                let value = match &self.current().token_type {
                    TokenType::String => Value::String(self.current().value.clone()),
                    TokenType::Number => {
                        let num = self.current().value.parse::<f64>()?;
                        Value::Number(serde_json::Number::from_f64(num).unwrap())
                    }
                    TokenType::True => Value::Bool(true),
                    TokenType::False => Value::Bool(false),
                    TokenType::Null => Value::Null,
                    _ => Value::String(self.current().value.clone()),
                };

                row.push(value);
                self.advance();

                if matches!(self.current().token_type, TokenType::Pipe) {
                    self.advance();
                }
            }

            rows.push(row);
            self.skip_newlines();
        }

        Ok(ASTNode::TabularArray {
            count,
            fields,
            rows,
        })
    }

    fn parse_reference_definition(&mut self) -> Result<ASTNode, Box<dyn std::error::Error>> {
        self.advance(); // skip &
        let name = self.current().value.clone();
        self.advance();
        self.skip_whitespace();

        if !matches!(self.current().token_type, TokenType::Equal) {
            return Err(Box::new(ParseError::new("Expected '='".to_string())));
        }
        self.advance();
        self.skip_whitespace();

        let value = self.parse_value()?;
        self.references.insert(name.clone(), value.clone());

        Ok(ASTNode::Definition {
            name,
            value: Box::new(value),
        })
    }

    fn current(&self) -> &Token {
        if self.position < self.tokens.len() {
            &self.tokens[self.position]
        } else {
            &self.tokens[self.tokens.len() - 1]
        }
    }

    fn advance(&mut self) {
        if self.position < self.tokens.len() - 1 {
            self.position += 1;
        }
    }

    fn skip_whitespace(&mut self) {
        while matches!(
            self.current().token_type,
            TokenType::Whitespace | TokenType::Newline
        ) {
            self.advance();
        }
    }

    fn skip_newlines(&mut self) {
        while matches!(self.current().token_type, TokenType::Newline) {
            self.advance();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexer::Lexer;

    #[test]
    fn test_parse_simple_object() {
        let input = r#"{"name": "Alice", "age": 30}"#;
        let mut lexer = Lexer::new(input);
        let tokens = lexer.tokenize();
        let mut parser = Parser::new(tokens);
        let ast = parser.parse().unwrap();

        match ast {
            ASTNode::Object(obj) => {
                assert_eq!(obj.len(), 2);
            }
            _ => panic!("Expected Object"),
        }
    }

    #[test]
    fn test_parse_implicit_object() {
        let input = "name:Bob\nage:25";
        let mut lexer = Lexer::new(input);
        let tokens = lexer.tokenize();
        let mut parser = Parser::new(tokens);
        let ast = parser.parse().unwrap();

        let value = ast.to_value();
        assert_eq!(value["name"], "Bob");
        assert_eq!(value["age"], 25.0);
    }
}
