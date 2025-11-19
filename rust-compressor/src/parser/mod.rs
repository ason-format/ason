//! Parser module for ASON format

pub mod ast;
mod parser_impl;

pub use ast::ASTNode;
pub use parser_impl::Parser;

use crate::lexer::Token;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub struct ParseError {
    message: String,
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Parse error: {}", self.message)
    }
}

impl Error for ParseError {}

impl ParseError {
    pub fn new(message: String) -> Self {
        Self { message }
    }
}

pub fn parse(tokens: Vec<Token>) -> Result<ASTNode, Box<dyn Error>> {
    let mut parser = Parser::new(tokens);
    parser.parse()
}
