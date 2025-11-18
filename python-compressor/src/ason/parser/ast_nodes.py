"""
Base AST Node classes for ASON 2.0

Abstract base class for all Abstract Syntax Tree nodes.
Provides common functionality for traversal, serialization, and debugging.

Module: ast_nodes
License: MIT
Version: 2.0.0
"""

from typing import Any, Dict, Optional
from abc import ABC, abstractmethod


class ASTNode(ABC):
    """
    Base class for all AST nodes.

    Attributes:
        type: Node type identifier
        metadata: Optional metadata (line, column, etc.)
    """

    def __init__(self, node_type: str, metadata: Optional[Dict] = None):
        """
        Create a new AST node.

        Args:
            node_type: Node type identifier
            metadata: Optional metadata (position, comments, etc.)
        """
        self.type = node_type
        self.metadata = metadata or {}

    @abstractmethod
    def to_value(self) -> Any:
        """
        Convert this node to a plain Python value.

        Returns:
            Python representation
        """
        pass

    def to_string(self, indent: int = 0) -> str:
        """
        Create a debug-friendly string representation.

        Args:
            indent: Indentation level

        Returns:
            String representation
        """
        spaces = '  ' * indent
        return f"{spaces}{self.type}"

    def to_dict(self) -> Dict:
        """
        Convert node to dictionary (for debugging/serialization).

        Returns:
            Dictionary representation
        """
        return {
            'type': self.type,
            **self.metadata
        }


class PrimitiveNode(ASTNode):
    """
    AST node for primitive values (string, number, boolean, null).

    Attributes:
        value: Primitive value
    """

    def __init__(self, value: Any, metadata: Optional[Dict] = None):
        """
        Create a primitive value node.

        Args:
            value: Primitive value
            metadata: Optional metadata
        """
        super().__init__('Primitive', metadata)
        self.value = value

    def to_value(self) -> Any:
        return self.value

    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        display_value = f'"{self.value}"' if isinstance(self.value, str) else str(self.value)
        return f"{spaces}Primitive({display_value})"

    def to_dict(self) -> Dict:
        return {
            **super().to_dict(),
            'value': self.value
        }


class ObjectNode(ASTNode):
    """
    AST node for objects (key-value pairs).

    Attributes:
        properties: Dictionary mapping keys to value nodes
    """

    def __init__(self, properties: Optional[Dict[str, ASTNode]] = None, metadata: Optional[Dict] = None):
        """
        Create an object node.

        Args:
            properties: Object properties (dict of key -> ASTNode)
            metadata: Optional metadata
        """
        super().__init__('Object', metadata)
        self.properties = properties or {}

    def to_value(self) -> Dict:
        obj = {}
        for key, value_node in self.properties.items():
            obj[key] = value_node.to_value()
        return obj

    def set_property(self, key: str, value: ASTNode):
        """
        Set a property on this object.

        Args:
            key: Property key
            value: Property value node
        """
        self.properties[key] = value

    def get_property(self, key: str) -> Optional[ASTNode]:
        """
        Get a property from this object.

        Args:
            key: Property key

        Returns:
            Property value node or None
        """
        return self.properties.get(key)

    def has_property(self, key: str) -> bool:
        """
        Check if object has a property.

        Args:
            key: Property key

        Returns:
            True if property exists
        """
        return key in self.properties

    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        result = f"{spaces}Object {{\n"
        for key, value in self.properties.items():
            result += f"{spaces}  {key}: {value.to_string(indent + 1).strip()}\n"
        result += f"{spaces}}}"
        return result

    def to_dict(self) -> Dict:
        props = {}
        for key, value in self.properties.items():
            props[key] = value.to_dict()
        return {
            **super().to_dict(),
            'properties': props
        }


class ArrayNode(ASTNode):
    """
    AST node for arrays.

    Attributes:
        elements: List of element nodes
    """

    def __init__(self, elements: Optional[list] = None, metadata: Optional[Dict] = None):
        """
        Create an array node.

        Args:
            elements: Array elements (list of ASTNode)
            metadata: Optional metadata
        """
        super().__init__('Array', metadata)
        self.elements = elements or []

    def to_value(self) -> list:
        return [el.to_value() for el in self.elements]

    def add_element(self, element: ASTNode):
        """
        Add an element to the array.

        Args:
            element: Element to add
        """
        self.elements.append(element)

    @property
    def length(self) -> int:
        """
        Get the array length.

        Returns:
            Number of elements
        """
        return len(self.elements)

    def to_string(self, indent: int = 0) -> str:
        spaces = '  ' * indent
        if not self.elements:
            return f"{spaces}Array []"

        result = f"{spaces}Array [\n"
        for el in self.elements:
            result += el.to_string(indent + 1) + '\n'
        result += f"{spaces}]"
        return result

    def to_dict(self) -> Dict:
        return {
            **super().to_dict(),
            'elements': [el.to_dict() for el in self.elements]
        }
