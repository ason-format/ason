"""
Section AST Node for ASON 2.0
"""

from typing import Any, Dict, List, Optional
from .ast_nodes import ASTNode, ObjectNode


class SectionNode(ASTNode):
    """AST node representing a section (@section_name)."""
    
    def __init__(self, name: str, content: Optional[ASTNode] = None, metadata: Optional[Dict[str, Any]] = None):
        super().__init__('Section', metadata)
        self.name = name
        self.content = content or ObjectNode()
    
    def to_value(self) -> Dict[str, Any]:
        value = self.content.to_value()
        
        # Handle nested section names (e.g., 'order.items')
        if '.' in self.name:
            parts = self.name.split('.')
            result = value
            
            # Build from innermost to outermost
            for i in range(len(parts) - 1, -1, -1):
                result = {parts[i]: result}
            
            return result
        
        # Simple section
        return {self.name: value}
    
    def get_root_key(self) -> str:
        """Get the root key of this section."""
        return self.name.split('.')[0]
    
    def get_path_parts(self) -> List[str]:
        """Get the path parts of this section."""
        return self.name.split('.')
    
    def is_nested(self) -> bool:
        """Check if this is a nested section (has dots)."""
        return '.' in self.name
    
    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        result = f"{spaces}Section(@{self.name}) {{\n"
        result += self.content.to_string(indent + 1) + '\n'
        result += f"{spaces}}}"
        return result
