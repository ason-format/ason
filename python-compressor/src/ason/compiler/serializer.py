"""
ASON 2.0 Serializer

Converts Python data structures into ASON 2.0 format string.
Uses analysis from ReferenceAnalyzer, SectionAnalyzer, and TabularAnalyzer.

Module: serializer
License: MIT
Version: 2.0.0
"""

from typing import Any, Dict, List, Optional
import json
import re


class Serializer:
    """Serializes data to ASON 2.0 format."""
    
    def __init__(self, indent: int = 1, delimiter: str = '|'):
        """
        Create a new Serializer.
        
        Args:
            indent: Spaces per indentation level
            delimiter: Field delimiter for tabular arrays
        """
        self.indent = max(1, indent)
        self.delimiter = delimiter
    
    def serialize(self, data: Any, references: Optional[Dict[str, Any]] = None, section_plan: Optional[Dict[str, Any]] = None, tabular_arrays: Optional[Dict[str, Any]] = None) -> str:
        """
        Serialize data to ASON 2.0 format.
        
        Args:
            data: Data to serialize
            references: Reference definitions
            section_plan: Section organization plan
            tabular_arrays: Tabular array info
        
        Returns:
            ASON 2.0 formatted string
        """
        self.references = references or {}
        self.section_plan = section_plan
        self.tabular_arrays = tabular_arrays or {}
        
        # Create reverse reference map
        self.value_to_ref = {}
        for ref_name, value in self.references.items():
            self.value_to_ref[self._normalize_value(value)] = ref_name
        
        output = ''
        
        # Serialize $def: section if we have references
        if self.references:
            output += self._serialize_definitions(self.references)
            output += '\n'
        
        # Serialize data
        data_str = self._serialize_value(data, 0, '')
        
        # Wrap in $data: if we have definitions
        if self.references:
            output += '$data:\n'
            output += data_str
        else:
            output += data_str
        
        # Clean up trailing newlines
        return output.rstrip('\n')
    
    def _serialize_definitions(self, references: Dict[str, Any]) -> str:
        """Serialize the $def: section."""
        output = '$def:\n'
        
        for ref_name, value in references.items():
            value_str = self._serialize_definition_value(value)
            output += self._sp(1) + ref_name + ':' + value_str + '\n'
        
        return output
    
    def _serialize_definition_value(self, value: Any) -> str:
        """Serialize a value for the $def: section."""
        if value is None:
            return 'null'
        if isinstance(value, bool):
            return 'true' if value else 'false'
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            return self._serialize_string(value)
        return json.dumps(value)
    
    def _serialize_value(self, value: Any, level: int, path: str) -> str:
        """Serialize a value (dispatches to appropriate serializer)."""
        # Check if this value is a reference
        ref_name = self.value_to_ref.get(self._normalize_value(value))
        if ref_name and isinstance(value, str):
            return ref_name
        
        # Null
        if value is None:
            return 'null'
        
        # Boolean
        if isinstance(value, bool):
            return 'true' if value else 'false'
        
        # Number
        if isinstance(value, (int, float)):
            return str(value)
        
        # String
        if isinstance(value, str):
            return self._serialize_string(value)
        
        # Array
        if isinstance(value, list):
            # Check if this array should be tabular
            tabular_info = self.tabular_arrays.get(path)
            if tabular_info and tabular_info.get('isTabular'):
                return self._serialize_tabular_array(value, tabular_info, level)
            
            return self._serialize_array(value, level, path)
        
        # Object
        if isinstance(value, dict):
            return self._serialize_object(value, level, path)
        
        return str(value)
    
    def _serialize_string(self, s: str) -> str:
        """Serialize a string value."""
        if self._needs_quotes(s):
            return json.dumps(s)
        return s
    
    def _needs_quotes(self, s: str) -> bool:
        """Check if a string needs quotes."""
        if s == '':
            return True
        if s in ['null', 'true', 'false']:
            return True
        if re.match(r'^-?\d', s):
            return True
        if re.match(r'^[@$&#\[\{/]', s):
            return True
        if re.search(r'[\n\r\t|:\s\-\.,\{\}\[\]"/]', s):
            return True
        if s in ['[]', '{}']:
            return True
        if not re.match(r'^[\x20-\x7E]*$', s):
            return True
        return False
    
    def _serialize_array(self, arr: List[Any], level: int, path: str) -> str:
        """Serialize an array."""
        if not arr:
            return '[]'
        
        # Check if all elements are primitives
        all_primitive = all(
            item is None or not isinstance(item, (dict, list))
            for item in arr
        )
        
        if all_primitive:
            # Inline array
            items = [self._serialize_value(item, level, path) for item in arr]
            return '[' + ','.join(items) + ']'
        
        # Multi-line array with - prefix
        output = '\n'
        for i, item in enumerate(arr):
            item_path = f"{path}[{i}]"
            item_str = self._serialize_value(item, level + 1, item_path)
            
            output += self._sp(level) + '-'
            
            if item_str.startswith('\n'):
                output += item_str
            else:
                output += ' ' + item_str
            
            output += '\n'
        
        return output.rstrip()
    
    def _get_nested_value(self, obj: Dict[str, Any], path: str) -> Any:
        """Get a value from an object using dot notation."""
        if '.' not in path:
            return obj.get(path)
        
        parts = path.split('.')
        current = obj
        
        for part in parts:
            if current is None or not isinstance(current, dict):
                return None
            current = current.get(part)
        
        return current
    
    def _serialize_tabular_array(self, arr: List[Dict[str, Any]], tabular_info: Dict[str, Any], level: int) -> str:
        """Serialize a tabular array."""
        schema = tabular_info['schema']
        
        # Schema line
        output = f"[{len(arr)}]{{{','.join(schema)}}}"
        output += '\n'
        
        # Data rows
        for obj in arr:
            values = []
            for field in schema:
                # Check if field is an array field
                is_array_field = field.endswith('[]')
                actual_field = field[:-2] if is_array_field else field
                
                # Handle dot notation
                value = self._get_nested_value(obj, actual_field)
                
                # Serialize array fields as inline arrays
                if is_array_field and isinstance(value, list):
                    values.append(self._serialize_inline_array_for_tabular(value))
                else:
                    values.append(self._serialize_tabular_value(value))
            
            output += self._sp(level) + self.delimiter.join(values) + '\n'
        
        return output.rstrip()
    
    def _serialize_inline_array_for_tabular(self, arr: List[Any]) -> str:
        """Serialize an array for use in tabular context."""
        if not arr:
            return '[]'
        
        items = []
        for item in arr:
            if item is None:
                items.append('null')
            elif isinstance(item, bool):
                items.append('true' if item else 'false')
            elif isinstance(item, (int, float)):
                items.append(str(item))
            elif isinstance(item, str):
                if self.delimiter in item or ',' in item or '[' in item or ']' in item or self._needs_quotes(item):
                    items.append(json.dumps(item))
                else:
                    items.append(item)
            else:
                items.append(json.dumps(item))
        
        return '[' + ','.join(items) + ']'
    
    def _serialize_tabular_value(self, value: Any) -> str:
        """Serialize a value for tabular context."""
        if value is None:
            return 'null'
        if isinstance(value, bool):
            return 'true' if value else 'false'
        if isinstance(value, (int, float)):
            return str(value)
        
        if isinstance(value, str):
            # Check for reference
            ref_name = self.value_to_ref.get(value)
            if ref_name:
                return ref_name
            
            # Quote if contains delimiter or special chars
            if (self.delimiter in value or '\n' in value or '"' in value or self._needs_quotes(value)):
                return json.dumps(value)
            return value
        
        return json.dumps(value)
    
    def _should_serialize_inline(self, obj: Dict[str, Any]) -> bool:
        """Check if an object should be serialized inline."""
        # Only inline if small (max 5 properties)
        if len(obj) > 5:
            return False
        
        # Only inline if all values are primitives
        return all(
            value is None or isinstance(value, (bool, int, float, str))
            for value in obj.values()
        )
    
    def _serialize_inline_object(self, obj: Dict[str, Any]) -> str:
        """Serialize an object inline: {key:value,key2:value2}"""
        parts = []
        
        for key, value in obj.items():
            serialized_key = json.dumps(key) if self._needs_quotes(key) else key
            
            if value is None:
                serialized_value = 'null'
            elif isinstance(value, bool):
                serialized_value = 'true' if value else 'false'
            elif isinstance(value, (int, float)):
                serialized_value = str(value)
            elif isinstance(value, str):
                serialized_value = self._serialize_string(value)
            else:
                serialized_value = str(value)
            
            parts.append(f"{serialized_key}:{serialized_value}")
        
        return '{' + ','.join(parts) + '}'
    
    def _serialize_object(self, obj: Dict[str, Any], level: int, path: str) -> str:
        """Serialize an object."""
        if not obj:
            return '{}'
        
        # Check if this should be sections
        use_sections = self.section_plan and level == 0
        
        if use_sections:
            return self._serialize_with_sections(obj, level, path)
        
        # Check if this should be inline
        if level > 0 and self._should_serialize_inline(obj):
            return self._serialize_inline_object(obj)
        
        # Regular object serialization
        output = '' if level == 0 else '\n'
        
        for key, value in obj.items():
            value_path = f"{path}.{key}" if path else key
            
            # Check if value should be tabular
            tabular_info = self.tabular_arrays.get(value_path)
            is_tabular = tabular_info and tabular_info.get('isTabular')
            
            output += self._sp(level)
            
            # Escape key if needed
            serialized_key = json.dumps(key) if self._needs_quotes(key) else key
            output += serialized_key + ':'
            
            if is_tabular and isinstance(value, list):
                output += self._serialize_tabular_array(value, tabular_info, level + 1)
            else:
                value_str = self._serialize_value(value, level + 1, value_path)
                
                if value_str.startswith('\n'):
                    output += value_str
                else:
                    output += value_str
            
            output += '\n'
        
        return output.rstrip()
    
    def _serialize_with_sections(self, obj: Dict[str, Any], level: int, path: str) -> str:
        """Serialize object with section organization."""
        output = ''
        
        sections = self.section_plan.get('sections', [])
        section_paths = {s['path'] for s in sections}
        
        # First: Serialize non-section fields
        for key, value in obj.items():
            if key in section_paths:
                continue
            
            value_path = f"{path}.{key}" if path else key
            flat_key = json.dumps(key) if self._needs_quotes(key) else key
            
            # Flatten if object (and not a section)
            if isinstance(value, dict):
                flattened = self._flatten_object(value, key)
                for flat_key_name, flat_value in flattened.items():
                    output += flat_key_name + ':' + self._serialize_value(flat_value, level, value_path) + '\n'
            else:
                output += flat_key + ':' + self._serialize_value(value, level, value_path) + '\n'
        
        # Then: Serialize sections
        if output and section_paths:
            output += '\n'
        
        for key, value in obj.items():
            if key in section_paths:
                output += self._serialize_section(key, value, level, path)
                output += '\n\n'
        
        return output.rstrip()
    
    def _serialize_section(self, name: str, value: Any, level: int, path: str) -> str:
        """Serialize a section."""
        value_path = f"{path}.{name}" if path else name
        
        # Check if section value is tabular array
        tabular_info = self.tabular_arrays.get(value_path)
        
        output = '@' + name
        
        if tabular_info and tabular_info.get('isTabular') and isinstance(value, list):
            output += ' ' + self._serialize_tabular_array(value, tabular_info, level + 1)
        elif isinstance(value, list):
            output += '\n' + self._serialize_array(value, level + 1, value_path)
        elif isinstance(value, dict):
            output += '\n'
            for key, val in value.items():
                key_path = f"{value_path}.{key}"
                serialized_key = json.dumps(key) if self._needs_quotes(key) else key
                serialized_value = self._serialize_value(val, level + 2, key_path)
                
                output += self._sp(level + 1) + serialized_key + ':' + serialized_value + '\n'
            output = output.rstrip()
        else:
            output += ':' + self._serialize_value(value, level, value_path)
        
        return output
    
    def _flatten_object(self, obj: Dict[str, Any], prefix: str) -> Dict[str, Any]:
        """Flatten an object to dot notation."""
        result: Dict[str, Any] = {}
        
        for key, value in obj.items():
            full_key = f"{prefix}.{key}"
            
            if isinstance(value, dict):
                result.update(self._flatten_object(value, full_key))
            else:
                result[full_key] = value
        
        return result
    
    def _normalize_value(self, value: Any) -> str:
        """Normalize a value for comparison."""
        if isinstance(value, str):
            return value
        return json.dumps(value)
    
    def _sp(self, level: int) -> str:
        """Generate indentation string."""
        return ' ' * (self.indent * level)
