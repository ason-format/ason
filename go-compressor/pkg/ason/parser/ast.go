package parser

import "encoding/json"

// ASTNode is the interface that all AST nodes must implement
type ASTNode interface {
	ToValue() interface{}
	Type() string
}

// PrimitiveNode represents a primitive value (string, number, boolean, null)
type PrimitiveNode struct {
	Value interface{} // string, float64, bool, or nil
}

func (n *PrimitiveNode) ToValue() interface{} {
	return n.Value
}

func (n *PrimitiveNode) Type() string {
	return "primitive"
}

// ObjectNode represents a JSON object
type ObjectNode struct {
	Properties map[string]ASTNode
	Order      []string // maintains insertion order
}

func NewObjectNode() *ObjectNode {
	return &ObjectNode{
		Properties: make(map[string]ASTNode),
		Order:      []string{},
	}
}

func (n *ObjectNode) ToValue() interface{} {
	result := make(map[string]interface{})
	for key, node := range n.Properties {
		result[key] = node.ToValue()
	}
	return result
}

func (n *ObjectNode) Type() string {
	return "object"
}

func (n *ObjectNode) Set(key string, value ASTNode) {
	if _, exists := n.Properties[key]; !exists {
		n.Order = append(n.Order, key)
	}
	n.Properties[key] = value
}

// ArrayNode represents a JSON array
type ArrayNode struct {
	Elements []ASTNode
}

func NewArrayNode() *ArrayNode {
	return &ArrayNode{
		Elements: []ASTNode{},
	}
}

func (n *ArrayNode) ToValue() interface{} {
	result := make([]interface{}, len(n.Elements))
	for i, node := range n.Elements {
		result[i] = node.ToValue()
	}
	return result
}

func (n *ArrayNode) Type() string {
	return "array"
}

func (n *ArrayNode) Add(element ASTNode) {
	n.Elements = append(n.Elements, element)
}

// ReferenceNode represents a reference usage ($varName)
type ReferenceNode struct {
	Name string
}

func (n *ReferenceNode) ToValue() interface{} {
	// References should be resolved during parsing
	// This is a placeholder
	return "$" + n.Name
}

func (n *ReferenceNode) Type() string {
	return "reference"
}

// DefinitionNode represents a reference definition (&varName = value)
type DefinitionNode struct {
	Name  string
	Value ASTNode
}

func (n *DefinitionNode) ToValue() interface{} {
	return n.Value.ToValue()
}

func (n *DefinitionNode) Type() string {
	return "definition"
}

// SectionNode represents a section (@sectionName)
type SectionNode struct {
	Name  string
	Value ASTNode
}

func (n *SectionNode) ToValue() interface{} {
	return n.Value.ToValue()
}

func (n *SectionNode) Type() string {
	return "section"
}

// TabularArrayNode represents a tabular array format
// Example: [2]{id,name}\n1|Alice\n2|Bob
type TabularArrayNode struct {
	Count  int
	Fields []string
	Rows   [][]interface{}
}

func (n *TabularArrayNode) ToValue() interface{} {
	result := make([]interface{}, len(n.Rows))
	for i, row := range n.Rows {
		obj := make(map[string]interface{})
		for j, field := range n.Fields {
			if j < len(row) {
				obj[field] = row[j]
			}
		}
		result[i] = obj
	}
	return result
}

func (n *TabularArrayNode) Type() string {
	return "tabular_array"
}

// MarshalJSON implementations for debugging
func (n *PrimitiveNode) MarshalJSON() ([]byte, error) {
	return json.Marshal(n.Value)
}

func (n *ObjectNode) MarshalJSON() ([]byte, error) {
	return json.Marshal(n.ToValue())
}

func (n *ArrayNode) MarshalJSON() ([]byte, error) {
	return json.Marshal(n.ToValue())
}

func (n *TabularArrayNode) MarshalJSON() ([]byte, error) {
	return json.Marshal(n.ToValue())
}
