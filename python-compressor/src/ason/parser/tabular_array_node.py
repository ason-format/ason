"""
Tabular Array AST Node for ASON 2.0
"""

from typing import Any, Dict, List, Optional
from .ast_nodes import ArrayNode, ObjectNode


class TabularArrayNode(ArrayNode):
    """AST node representing a tabular array."""
    
    def __init__(self, schema: Optional[List[str]] = None, rows: Optional[List[ObjectNode]] = None, metadata: Optional[Dict[str, Any]] = None):
        super().__init__(rows or [], metadata)
        self.type = 'TabularArray'
        self.schema = schema or []
        self.expected_count = metadata.get('expectedCount') if metadata else None
    
    def validate(self) -> Dict[str, Any]:
        """Validate that all rows conform to the schema."""
        errors: List[str] = []
        
        # Check row count if specified
        if self.expected_count is not None and len(self.elements) != self.expected_count:
            errors.append(f"Expected {self.expected_count} rows, got {len(self.elements)}")
        
        # Check each row has all schema fields
        for i, row in enumerate(self.elements):
            if not isinstance(row, ObjectNode):
                errors.append(f"Row {i} is not an object")
                continue
            
            # Check for missing required fields
            for field in self.schema:
                if not row.has_property(field):
                    errors.append(f"Row {i} missing required field: {field}")
            
            # Warn about extra fields
            for key in row.properties.keys():
                if key not in self.schema:
                    errors.append(f"Row {i} has unexpected field: {key}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def is_uniform(self) -> bool:
        """Check if this tabular array has a uniform structure."""
        return all(
            isinstance(row, ObjectNode) and
            len(row.properties) == len(self.schema) and
            all(row.has_property(field) for field in self.schema)
            for row in self.elements
        )
    
    @property
    def row_count(self) -> int:
        return len(self.elements)
    
    @property
    def field_count(self) -> int:
        return len(self.schema)
    
    def add_row(self, row: Any) -> None:
        """Add a row to the tabular array."""
        if not isinstance(row, ObjectNode):
            obj_node = ObjectNode()
            for key, value in row.items():
                obj_node.set_property(key, value)
            self.add_element(obj_node)
        else:
            self.add_element(row)
    
    def get_row(self, index: int) -> Optional[ObjectNode]:
        """Get a specific row."""
        return self.elements[index] if 0 <= index < len(self.elements) else None
    
    def get_cell(self, row_index: int, field: str) -> Optional[Any]:
        """Get a specific cell value."""
        row = self.get_row(row_index)
        return row.get_property(field) if row else None
    
    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        result = f"{spaces}TabularArray [{self.row_count}]{{{','.join(self.schema)}}} [\n"
        for row in self.elements:
            result += row.to_string(indent + 1) + '\n'
        result += f"{spaces}]"
        return result
