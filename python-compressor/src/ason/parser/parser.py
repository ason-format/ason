"""
Parser for ASON 2.0 format - Converts tokens into an Abstract Syntax Tree (AST).
"""

from typing import List, Optional, Tuple, Any
from ..lexer.token import Token
from ..lexer.token_type import TokenType
from .ast_nodes import ASTNode, PrimitiveNode, ObjectNode, ArrayNode
from .reference_node import ReferenceNode, DefinitionNode
from .section_node import SectionNode
from .tabular_array_node import TabularArrayNode
import json


class Parser:
    """Recursive descent parser for ASON 2.0 format."""
    
    def __init__(self, tokens: List[Token]):
        # Filter out comments
        self.tokens = [
            t for t in tokens
            if t.type not in [TokenType.COMMENT, TokenType.COMMENT_START, TokenType.COMMENT_END]
        ]
        self.pos = 0
        self.definitions = DefinitionNode()
    
    def peek(self) -> Token:
        return self.tokens[self.pos] if self.pos < len(self.tokens) else Token.eof(0, 0)
    
    def peek_at(self, offset: int) -> Optional[Token]:
        idx = self.pos + offset
        return self.tokens[idx] if idx < len(self.tokens) else None
    
    def advance(self) -> Token:
        token = self.tokens[self.pos]
        self.pos += 1
        return token
    
    def is_at_end(self) -> bool:
        return self.pos >= len(self.tokens) or self.peek().type == TokenType.EOF
    
    def check(self, types) -> bool:
        if self.is_at_end():
            return False
        if isinstance(types, list):
            return self.peek().type in types
        return self.peek().type == types
    
    def match(self, types):
        if self.check(types):
            return self.advance()
        return None
    
    def expect(self, token_type: TokenType, message: str = None) -> Token:
        if not self.check(token_type):
            token = self.peek()
            raise ValueError(message or f"Expected {token_type}, got {token.type} at {token.position()}")
        return self.advance()
    
    def skip_whitespace(self) -> None:
        while self.check([TokenType.NEWLINE, TokenType.INDENT]):
            self.advance()
    
    def get_indent_level(self) -> int:
        if self.check(TokenType.INDENT):
            return len(self.peek().value)
        return 0
    
    def skip_line(self) -> None:
        while not self.is_at_end() and not self.check(TokenType.NEWLINE):
            self.advance()
        if self.check(TokenType.NEWLINE):
            self.advance()
    
    def parse(self) -> ASTNode:
        self.skip_whitespace()
        
        # Parse $def: section if present
        if self.check(TokenType.DEF_KEYWORD):
            self.parse_definitions()
            self.skip_whitespace()
        
        # Parse $data: section (or implicit data)
        if self.check(TokenType.DATA_KEYWORD):
            self.advance()
            self.skip_whitespace()
        
        # Check for single inline value at root
        if self.check([TokenType.LBRACKET, TokenType.LBRACE, TokenType.DASH,
                      TokenType.NUMBER, TokenType.STRING, TokenType.BOOLEAN, TokenType.NULL]):
            value = self.parse_value()
            self.resolve_references(value)
            return value
        
        # Parse root content
        root = self.parse_document()
        self.resolve_references(root)
        return root
    
    def parse_definitions(self) -> None:
        self.expect(TokenType.DEF_KEYWORD)
        self.skip_whitespace()

        base_indent = self.get_indent_level()
        
        while not self.is_at_end() and not self.check(TokenType.DATA_KEYWORD):
            current_indent = self.get_indent_level()
            if current_indent < base_indent:
                break
            
            if self.check(TokenType.NEWLINE):
                self.advance()
                continue
            
            if self.check([TokenType.VAR_REF, TokenType.OBJ_REF, TokenType.NUM_REF]):
                ref_token = self.advance()
                self.expect(TokenType.COLON)
                
                value = self.parse_value()
                
                if ref_token.type == TokenType.VAR_REF:
                    self.definitions.define_variable(ref_token.value, value)
                elif ref_token.type == TokenType.OBJ_REF:
                    self.definitions.define_object(ref_token.value, value)
                elif ref_token.type == TokenType.NUM_REF:
                    self.definitions.define_numeric(ref_token.value, value)
                
                self.skip_whitespace()
            else:
                self.skip_line()
    
    def parse_document(self) -> ObjectNode:
        root = ObjectNode()
        sections: List[SectionNode] = []
        
        while not self.is_at_end():
            self.skip_whitespace()
            if self.is_at_end():
                break
            
            if self.check(TokenType.SECTION):
                section = self.parse_section()
                sections.append(section)
            elif self.check(TokenType.IDENTIFIER):
                key, value = self.parse_key_value()
                self.set_nested_property(root, key, value)
                self.skip_whitespace()
            else:
                self.advance()
        
        for section in sections:
            self.merge_section_into_root(root, section)
        
        return root
    
    def merge_section_into_root(self, root: ObjectNode, section: SectionNode) -> None:
        path = section.name
        content = section.content
        
        if '.' in path:
            self.set_nested_property(root, path, content)
        else:
            root.set_property(path, content)
    
    def parse_section(self) -> SectionNode:
        section_token = self.expect(TokenType.SECTION)
        section_name = section_token.value[1:]  # Remove @
        
        self.skip_whitespace()
        
        # Check for tabular array: @section [N]{fields}
        if self.check(TokenType.LBRACKET):
            tabular = self.parse_tabular_array()
            return SectionNode(section_name, tabular)
        
        # Regular section with key-value pairs
        content = ObjectNode()
        base_indent = None
        
        while not self.is_at_end():
            if self.check(TokenType.SECTION):
                break
            
            current_indent = self.get_indent_level()
            
            if base_indent is None and current_indent > 0:
                base_indent = current_indent
            
            if base_indent is not None and current_indent < base_indent:
                break
            
            if self.check(TokenType.NEWLINE):
                self.advance()
                continue
            
            if base_indent is not None and current_indent == 0:
                break
            
            if self.check(TokenType.INDENT):
                self.advance()
            
            if self.check(TokenType.IDENTIFIER):
                key, value = self.parse_key_value()
                self.set_nested_property(content, key, value)
                if self.check(TokenType.NEWLINE):
                    self.advance()
            else:
                break
        
        return SectionNode(section_name, content)
    
    def parse_tabular_array(self) -> TabularArrayNode:
        self.expect(TokenType.LBRACKET)
        count_token = self.expect(TokenType.NUMBER)
        expected_count = int(count_token.value)
        self.expect(TokenType.RBRACKET)
        
        self.expect(TokenType.LBRACE)
        
        fields = []
        while not self.check(TokenType.RBRACE):
            field_name = ''
            while self.check([TokenType.IDENTIFIER, TokenType.DOT]):
                token = self.advance()
                field_name += token.value
            
            if self.check(TokenType.LBRACKET):
                self.advance()
                self.expect(TokenType.RBRACKET)
                field_name += '[]'
            
            if field_name:
                fields.append(field_name)
            
            if self.check(TokenType.COMMA):
                self.advance()
        
        self.expect(TokenType.RBRACE)
        self.skip_whitespace()
        
        rows = []
        base_indent = self.get_indent_level()
        
        while not self.is_at_end() and not self.check(TokenType.SECTION):
            current_indent = self.get_indent_level()
            if current_indent < base_indent:
                break
            
            if self.check(TokenType.NEWLINE):
                self.advance()
                continue
            
            row = self.parse_tabular_row(fields)
            if row:
                rows.append(row)
            
            self.skip_whitespace()
        
        return TabularArrayNode(fields, rows, {'expectedCount': expected_count})
    
    def parse_tabular_row(self, fields: List[str]) -> Optional[ObjectNode]:
        values = []
        
        while not self.is_at_end() and not self.check(TokenType.NEWLINE) and not self.check(TokenType.SECTION):
            value = self.parse_value()
            values.append(value)
            
            if self.check(TokenType.PIPE):
                self.advance()
            else:
                break
        
        if not values:
            return None
        
        row = ObjectNode()
        for i, field_name in enumerate(fields):
            value = values[i] if i < len(values) else PrimitiveNode(None)
            
            is_array_field = field_name.endswith('[]')
            actual_field = field_name[:-2] if is_array_field else field_name
            
            if '.' in actual_field:
                self.set_nested_property(row, actual_field, value)
            else:
                row.set_property(actual_field, value)
        
        return row
    
    def parse_key_value(self) -> Tuple[str, ASTNode]:
        key = ''
        
        if self.check(TokenType.STRING):
            key_token = self.advance()
            key = self.parse_string(key_token.value)
        else:
            while self.check(TokenType.IDENTIFIER) or self.check(TokenType.DOT):
                token = self.advance()
                key += token.value
        
        self.expect(TokenType.COLON)
        value = self.parse_value()
        
        return (key, value)
    
    def parse_value(self) -> ASTNode:
        # Reference
        if self.check([TokenType.VAR_REF, TokenType.OBJ_REF, TokenType.NUM_REF]):
            ref_token = self.advance()
            ref_type = 'var' if ref_token.type == TokenType.VAR_REF else                        'object' if ref_token.type == TokenType.OBJ_REF else 'numeric'
            return ReferenceNode(ref_token.value, ref_type)
        
        # Inline object
        if self.check(TokenType.LBRACE):
            return self.parse_inline_object()
        
        # Inline array or tabular array
        if self.check(TokenType.LBRACKET):
            next_token = self.peek_at(1)
            following_token = self.peek_at(2)
            after_that = self.peek_at(3)
            
            if (next_token and next_token.type == TokenType.NUMBER and
                following_token and following_token.type == TokenType.RBRACKET and
                after_that and after_that.type == TokenType.LBRACE):
                return self.parse_tabular_array()
            
            return self.parse_inline_array()
        
        # YAML-style list
        if self.check(TokenType.DASH):
            return self.parse_list()
        
        # Multi-line nested object
        if self.check(TokenType.NEWLINE):
            next_token = self.peek_at(1)
            
            if next_token and next_token.type == TokenType.DASH:
                self.advance()
                return self.parse_list()
            
            if next_token and next_token.type == TokenType.INDENT:
                token_after_indent = self.peek_at(2)
                
                if token_after_indent and token_after_indent.type == TokenType.DASH:
                    self.advance()
                    return self.parse_list()
                
                self.advance()
                return self.parse_nested_object()
            
            return PrimitiveNode(None)
        
        # Primitives
        if self.check(TokenType.NULL):
            self.advance()
            return PrimitiveNode(None)
        
        if self.check(TokenType.BOOLEAN):
            token = self.advance()
            return PrimitiveNode(token.value == 'true')
        
        if self.check(TokenType.NUMBER):
            token = self.advance()
            return PrimitiveNode(float(token.value))
        
        if self.check(TokenType.STRING):
            token = self.advance()
            return PrimitiveNode(self.parse_string(token.value))
        
        if self.check(TokenType.IDENTIFIER):
            token = self.advance()
            return PrimitiveNode(token.value)
        
        return PrimitiveNode(None)
    
    def parse_nested_object(self) -> ObjectNode:
        obj = ObjectNode()
        base_indent = self.get_indent_level()
        
        while not self.is_at_end():
            current_indent = self.get_indent_level()
            
            if current_indent < base_indent:
                break
            
            if self.check(TokenType.SECTION):
                break
            
            if self.check(TokenType.NEWLINE):
                self.advance()
                continue
            
            if current_indent == 0 and base_indent > 0:
                break
            
            if self.check(TokenType.INDENT):
                self.advance()
            
            if self.check(TokenType.IDENTIFIER) or self.check(TokenType.STRING):
                key, value = self.parse_key_value()
                obj.set_property(key, value)
                
                if self.check(TokenType.NEWLINE):
                    self.advance()
            else:
                break
        
        return obj
    
    def parse_inline_object(self) -> ObjectNode:
        self.expect(TokenType.LBRACE)
        obj = ObjectNode()
        
        while not self.check(TokenType.RBRACE) and not self.is_at_end():
            key, value = self.parse_key_value()
            obj.set_property(key, value)
            
            if self.check(TokenType.COMMA):
                self.advance()
        
        self.expect(TokenType.RBRACE)
        return obj
    
    def parse_inline_array(self) -> ArrayNode:
        self.expect(TokenType.LBRACKET)
        arr = ArrayNode()
        
        while not self.check(TokenType.RBRACKET) and not self.is_at_end():
            value = self.parse_value()
            arr.add_element(value)
            
            if self.check(TokenType.COMMA):
                self.advance()
        
        self.expect(TokenType.RBRACKET)
        return arr
    
    def parse_list(self) -> ArrayNode:
        arr = ArrayNode()
        base_indent = self.get_indent_level()
        
        while not self.is_at_end():
            current_indent = self.get_indent_level()
            
            if current_indent < base_indent:
                break
            
            if self.check(TokenType.NEWLINE):
                self.advance()
                continue
            
            if self.check(TokenType.INDENT):
                if current_indent == base_indent:
                    self.advance()
                elif current_indent < base_indent:
                    break
            
            if self.check(TokenType.DASH):
                self.advance()
                value = self.parse_value()
                arr.add_element(value)
                
                if self.check(TokenType.NEWLINE):
                    self.advance()
            else:
                break
        
        return arr
    
    def parse_string(self, s: str) -> str:
        if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
            content = s[1:-1]
            return json.loads('"' + content + '"')
        return s
    
    def set_nested_property(self, obj: ObjectNode, path: str, value: ASTNode) -> None:
        parts = path.split('.')
        
        if len(parts) == 1:
            obj.set_property(path, value)
            return
        
        current = obj
        for i in range(len(parts) - 1):
            part = parts[i]
            
            if not current.has_property(part):
                current.set_property(part, ObjectNode())
            
            next_node = current.get_property(part)
            if not isinstance(next_node, ObjectNode):
                new_obj = ObjectNode()
                current.set_property(part, new_obj)
                current = new_obj
            else:
                current = next_node
        
        current.set_property(parts[-1], value)
    
    def resolve_references(self, node: ASTNode) -> None:
        if isinstance(node, ReferenceNode):
            resolved = self.definitions.lookup(node.name)
            if resolved:
                node.resolve(resolved)
            else:
                print(f"Warning: Unresolved reference: {node.name}")
        elif isinstance(node, ObjectNode):
            for value in node.properties.values():
                self.resolve_references(value)
        elif isinstance(node, (ArrayNode, TabularArrayNode)):
            for element in node.elements:
                self.resolve_references(element)
        elif isinstance(node, SectionNode):
            self.resolve_references(node.content)
