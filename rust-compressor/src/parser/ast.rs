//! AST node definitions

use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub enum ASTNode {
    Primitive(Value),
    Object(HashMap<String, ASTNode>),
    Array(Vec<ASTNode>),
    TabularArray {
        count: usize,
        fields: Vec<String>,
        rows: Vec<Vec<Value>>,
    },
    Reference(String),
    Definition {
        name: String,
        value: Box<ASTNode>,
    },
}

impl ASTNode {
    pub fn to_value(&self) -> Value {
        match self {
            ASTNode::Primitive(v) => v.clone(),
            ASTNode::Object(map) => {
                let mut obj = serde_json::Map::new();
                for (k, v) in map {
                    obj.insert(k.clone(), v.to_value());
                }
                Value::Object(obj)
            }
            ASTNode::Array(arr) => {
                Value::Array(arr.iter().map(|n| n.to_value()).collect())
            }
            ASTNode::TabularArray { fields, rows, .. } => {
                let arr: Vec<Value> = rows
                    .iter()
                    .map(|row| {
                        let mut obj = serde_json::Map::new();
                        for (i, field) in fields.iter().enumerate() {
                            if i < row.len() {
                                obj.insert(field.clone(), row[i].clone());
                            }
                        }
                        Value::Object(obj)
                    })
                    .collect();
                Value::Array(arr)
            }
            ASTNode::Reference(_) => Value::Null, // Should be resolved
            ASTNode::Definition { value, .. } => value.to_value(),
        }
    }
}
