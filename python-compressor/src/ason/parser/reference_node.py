"""
Reference AST Node for ASON 2.0
"""

from typing import Any, Dict, Optional
from .ast_nodes import ASTNode


class ReferenceNode(ASTNode):
    """AST node representing a reference ($var, &obj, #N)."""
    
    def __init__(self, name: str, ref_type: str, metadata: Optional[Dict[str, Any]] = None):
        super().__init__('Reference', metadata)
        self.name = name
        self.ref_type = ref_type
        self.resolved: Optional[ASTNode] = None
        self.is_resolved = False
    
    def get_base_name(self) -> str:
        """Get reference name without prefix."""
        return self.name[1:]  # Remove first character (prefix)
    
    def get_prefix(self) -> str:
        """Get the reference prefix."""
        return self.name[0]
    
    def resolve(self, value: ASTNode) -> None:
        """Resolve this reference to a value."""
        self.resolved = value
        self.is_resolved = True
    
    def is_variable_ref(self) -> bool:
        return self.ref_type == 'var'
    
    def is_object_ref(self) -> bool:
        return self.ref_type == 'object'
    
    def is_numeric_ref(self) -> bool:
        return self.ref_type == 'numeric'

    def to_value(self) -> Any:
        if not self.is_resolved:
            raise ValueError(f"Unresolved reference: {self.name}")
        return self.resolved.to_value()
    
    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        status = ' (resolved)' if self.is_resolved else ' (unresolved)'
        return f"{spaces}Reference({self.name}){status}"


class DefinitionNode(ASTNode):
    """AST node representing definitions ($def: section)."""

    def __init__(self, metadata: Optional[Dict[str, Any]] = None):
        super().__init__('Definition', metadata)
        self.variables: Dict[str, ASTNode] = {}
        self.objects: Dict[str, ASTNode] = {}
        self.numeric: Dict[str, ASTNode] = {}
    
    def define_variable(self, name: str, value: ASTNode) -> None:
        self.variables[name] = value

    def define_object(self, name: str, value: ASTNode) -> None:
        self.objects[name] = value

    def define_numeric(self, name: str, value: ASTNode) -> None:
        self.numeric[name] = value
    
    def lookup(self, name: str) -> Optional[ASTNode]:
        prefix = name[0] if name else ''
        
        if prefix == '$':
            return self.variables.get(name)
        elif prefix == '&':
            return self.objects.get(name)
        elif prefix == '#':
            return self.numeric.get(name)
        
        return None

    def to_value(self) -> None:
        return None
    
    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        result = f"{spaces}Definition {{\n"
        
        if self.variables:
            result += f"{spaces}  Variables:\n"
            for name, value in self.variables.items():
                result += f"{spaces}    {name}: {value.to_string(indent + 2).strip()}\n"
        
        result += f"{spaces}}}"
        return result
