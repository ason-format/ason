package parser

import (
	"fmt"
	"strconv"

	"github.com/ason-format/ason/go-compressor/pkg/ason/lexer"
)

// Parser parses ASON format into an AST
type Parser struct {
	tokens   []lexer.Token
	position int
	current  lexer.Token
	
	// Reference storage for resolving $varName references
	references map[string]ASTNode
}

// New creates a new Parser
func New(tokens []lexer.Token) *Parser {
	p := &Parser{
		tokens:     tokens,
		position:   0,
		references: make(map[string]ASTNode),
	}
	if len(tokens) > 0 {
		p.current = tokens[0]
	}
	return p
}

// Parse parses the tokens into an AST
func (p *Parser) Parse() (ASTNode, error) {
	// Skip initial newlines
	p.skipNewlines()
	
	// Check if this is a root object with sections
	if p.current.Type == lexer.AT {
		return p.parseRootWithSections()
	}
	
	// Check if we have reference definitions followed by an array
	// Format: &var0 = Value\n[N]{fields}...
	if p.current.Type == lexer.AMPERSAND {
		// Parse all reference definitions first
		for p.current.Type == lexer.AMPERSAND && p.current.Type != lexer.EOF {
			p.parseReferenceDefinition()
			p.skipNewlines()
		}
		
		// After references, check what follows
		if p.current.Type == lexer.LBRACKET {
			// Array follows references
			return p.parseValue()
		}
	}
	
	// Check if this looks like a  key:value document (e.g., "name:Bob\nage:25")
	// By checking if current token is STRING and next is COLON
	if p.current.Type == lexer.STRING && p.position+1 < len(p.tokens) {
		nextToken := p.tokens[p.position+1]
		if nextToken.Type == lexer.COLON {
			// This is a key:value document, parse as implicit object
			return p.parseImplicitObject()
		}
	}
	
	return p.parseValue()
}

// parseRootWithSections parses a root object that contains sections
func (p *Parser) parseRootWithSections() (ASTNode, error) {
	root := NewObjectNode()
	
	for p.current.Type != lexer.EOF {
		p.skipNewlines()
		
		if p.current.Type == lexer.EOF {
			break
		}
		
		if p.current.Type == lexer.AT {
			// Parse section
			p.advance() // skip @
			
			sectionName := p.current.Value
			p.advance() // skip section name
			
			p.skipNewlines()
			
			// Parse section value
			value, err := p.parseValue()
			if err != nil {
				return nil, err
			}
			
			root.Set(sectionName, value)
		} else if p.current.Type == lexer.AMPERSAND {
			// Parse reference definition
			def, err := p.parseReferenceDefinition()
			if err != nil {
				return nil, err
			}
			// Store reference for later use
			defNode := def.(*DefinitionNode)
			p.references[defNode.Name] = defNode.Value
		} else {
			// No section marker, parse as regular value
			return p.parseValue()
		}
		
		p.skipNewlines()
	}
	
	return root, nil
}

// parseValue parses any value
func (p *Parser) parseValue() (ASTNode, error) {
	switch p.current.Type {
	case lexer.LBRACE:
		return p.parseObject()
	case lexer.LBRACKET:
		return p.parseArrayOrTabular()
	case lexer.STRING:
		return p.parseString()
	case lexer.NUMBER:
		return p.parseNumber()
	case lexer.TRUE:
		p.advance()
		return &PrimitiveNode{Value: true}, nil
	case lexer.FALSE:
		p.advance()
		return &PrimitiveNode{Value: false}, nil
	case lexer.NULL:
		p.advance()
		return &PrimitiveNode{Value: nil}, nil
	case lexer.DOLLAR:
		return p.parseReference()
	case lexer.AMPERSAND:
		return p.parseReferenceDefinition()
	default:
		return nil, fmt.Errorf("unexpected token: %s at line %d", p.current.Type, p.current.Line)
	}
}

// parseObject parses a JSON object
func (p *Parser) parseObject() (ASTNode, error) {
	obj := NewObjectNode()
	
	p.advance() // skip {
	p.skipWhitespace()
	
	for p.current.Type != lexer.RBRACE && p.current.Type != lexer.EOF {
		p.skipWhitespace()
		
		// Parse key
		if p.current.Type != lexer.STRING {
			return nil, fmt.Errorf("expected string key, got %s", p.current.Type)
		}
		key := p.current.Value
		p.advance()
		
		p.skipWhitespace()
		
		// Expect colon
		if p.current.Type != lexer.COLON {
			return nil, fmt.Errorf("expected ':', got %s", p.current.Type)
		}
		p.advance()
		
		p.skipWhitespace()
		
		// Parse value
		value, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		
		obj.Set(key, value)
		
		p.skipWhitespace()
		
		// Check for comma or closing brace
		if p.current.Type == lexer.COMMA {
			p.advance()
			p.skipWhitespace()
		} else if p.current.Type != lexer.RBRACE {
			return nil, fmt.Errorf("expected ',' or '}', got %s", p.current.Type)
		}
	}
	
	if p.current.Type != lexer.RBRACE {
		return nil, fmt.Errorf("expected '}', got %s", p.current.Type)
	}
	p.advance() // skip }
	
	return obj, nil
}

// parseImplicitObject parses key:value pairs without braces (e.g., "name:Bob\nage:25")
func (p *Parser) parseImplicitObject() (ASTNode, error) {
	obj := NewObjectNode()
	
	for p.current.Type != lexer.EOF {
		p.skipWhitespace()
		
		if p.current.Type == lexer.EOF {
			break
		}
		
		// Parse key
		if p.current.Type != lexer.STRING {
			// Not a key:value pair, stop parsing
			break
		}
		
		key := p.current.Value
		p.advance()
		
		p.skipWhitespace()
		
		// Expect colon
		if p.current.Type != lexer.COLON {
			return nil, fmt.Errorf("expected ':', got %s", p.current.Type)
		}
		p.advance()
		
		p.skipWhitespace()
		
		// Parse value
		value, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		
		obj.Set(key, value)
		
		// Skip newlines between key:value pairs
		p.skipNewlines()
	}
	
	return obj, nil
}

// parseArrayOrTabular parses either a regular array or tabular array
func (p *Parser) parseArrayOrTabular() (ASTNode, error) {
	p.advance() // skip [
	
	// Check if this is a tabular array [N]{fields}
	if p.current.Type == lexer.NUMBER {
		// Could be tabular, peek ahead
		countPos := p.position
		count := p.current.Value
		p.advance()
		
		if p.current.Type == lexer.RBRACKET {
			p.advance()
			if p.current.Type == lexer.LBRACE {
				// This is a tabular array
				return p.parseTabularArray(count)
			}
		}
		
		// Not tabular, backtrack and parse as regular array
		p.position = countPos
		p.current = p.tokens[p.position]
	}
	
	return p.parseRegularArray()
}

// parseRegularArray parses a regular JSON array
func (p *Parser) parseRegularArray() (ASTNode, error) {
	arr := NewArrayNode()
	
	p.skipWhitespace()
	
	for p.current.Type != lexer.RBRACKET && p.current.Type != lexer.EOF {
		p.skipWhitespace()
		
		value, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		
		arr.Add(value)
		
		p.skipWhitespace()
		
		if p.current.Type == lexer.COMMA || p.current.Type == lexer.PIPE {
			p.advance()
			p.skipWhitespace()
		} else if p.current.Type != lexer.RBRACKET {
			return nil, fmt.Errorf("expected ',' or ']', got %s", p.current.Type)
		}
	}
	
	if p.current.Type != lexer.RBRACKET {
		return nil, fmt.Errorf("expected ']', got %s", p.current.Type)
	}
	p.advance() // skip ]
	
	return arr, nil
}

// parseTabularArray parses a tabular array format
func (p *Parser) parseTabularArray(countStr string) (ASTNode, error) {
	count, err := strconv.Atoi(countStr)
	if err != nil {
		return nil, fmt.Errorf("invalid count in tabular array: %s", countStr)
	}
	
	// Parse fields {field1,field2,...}
	p.advance() // skip {
	
	fields := []string{}
	for p.current.Type != lexer.RBRACE && p.current.Type != lexer.EOF {
		if p.current.Type == lexer.STRING {
			fields = append(fields, p.current.Value)
			p.advance()
		} else {
			return nil, fmt.Errorf("expected field name, got %s", p.current.Type)
		}
		
		if p.current.Type == lexer.COMMA {
			p.advance()
		}
	}
	
	if p.current.Type != lexer.RBRACE {
		return nil, fmt.Errorf("expected '}', got %s", p.current.Type)
	}
	p.advance() // skip }
	
	// Parse rows
	rows := [][]interface{}{}
	p.skipNewlines()
	
	for len(rows) < count && p.current.Type != lexer.EOF {
		row := []interface{}{}
		
		// Parse pipe-delimited values
		for len(row) < len(fields) && p.current.Type != lexer.NEWLINE && p.current.Type != lexer.EOF {
			var value interface{}
			
			switch p.current.Type {
			case lexer.STRING:
				value = p.current.Value
			case lexer.NUMBER:
				value, _ = strconv.ParseFloat(p.current.Value, 64)
			case lexer.TRUE:
				value = true
			case lexer.FALSE:
				value = false
			case lexer.NULL:
				value = nil
			default:
				value = p.current.Value
			}
			
			row = append(row, value)
			p.advance()
			
			if p.current.Type == lexer.PIPE {
				p.advance()
			}
		}
		
		rows = append(rows, row)
		p.skipNewlines()
	}
	
	return &TabularArrayNode{
		Count:  count,
		Fields: fields,
		Rows:   rows,
	}, nil
}

// parseString parses a string value
func (p *Parser) parseString() (ASTNode, error) {
	value := p.current.Value
	p.advance()
	return &PrimitiveNode{Value: value}, nil
}

// parseNumber parses a number value
func (p *Parser) parseNumber() (ASTNode, error) {
	value, err := strconv.ParseFloat(p.current.Value, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid number: %s", p.current.Value)
	}
	p.advance()
	return &PrimitiveNode{Value: value}, nil
}

// parseReference parses a reference usage ($varName)
func (p *Parser) parseReference() (ASTNode, error) {
	p.advance() // skip $
	
	if p.current.Type != lexer.STRING {
		return nil, fmt.Errorf("expected reference name, got %s", p.current.Type)
	}
	
	name := p.current.Value
	p.advance()
	
	// Resolve reference if it exists
	if ref, exists := p.references[name]; exists {
		return ref, nil
	}
	
	return &ReferenceNode{Name: name}, nil
}

// parseReferenceDefinition parses a reference definition (&varName = value)
func (p *Parser) parseReferenceDefinition() (ASTNode, error) {
	p.advance() // skip &
	
	if p.current.Type != lexer.STRING {
		return nil, fmt.Errorf("expected definition name, got %s", p.current.Type)
	}
	
	name := p.current.Value
	p.advance()
	
	p.skipWhitespace()
	
	if p.current.Type != lexer.EQUAL {
		return nil, fmt.Errorf("expected '=', got %s", p.current.Type)
	}
	p.advance()
	
	p.skipWhitespace()
	
	value, err := p.parseValue()
	if err != nil {
		return nil, err
	}
	
	// Store reference for later use
	p.references[name] = value
	
	return &DefinitionNode{
		Name:  name,
		Value: value,
	}, nil
}

// advance moves to the next token
func (p *Parser) advance() {
	if p.position < len(p.tokens)-1 {
		p.position++
		p.current = p.tokens[p.position]
	}
}

// skipWhitespace skips whitespace and newline tokens
func (p *Parser) skipWhitespace() {
	for p.current.Type == lexer.WHITESPACE || p.current.Type == lexer.NEWLINE {
		p.advance()
	}
}

// skipNewlines skips only newline tokens
func (p *Parser) skipNewlines() {
	for p.current.Type == lexer.NEWLINE {
		p.advance()
	}
}
