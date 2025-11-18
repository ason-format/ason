"""
Tabular Array Analyzer for ASON 2.0
"""

from typing import Any, Dict, List, Tuple
import json


class TabularAnalyzer:
    """Analyzes arrays for tabular optimization."""
    
    def __init__(self, min_rows: int = 2, min_uniformity: float = 0.8, max_fields: int = 20):
        self.min_rows = min_rows
        self.min_uniformity = min_uniformity
        self.max_fields = max_fields
    
    def analyze(self, array: List[Any]) -> Dict[str, Any]:
        """Analyze an array to determine if it's suitable for tabular format."""
        # Basic checks
        if not isinstance(array, list) or len(array) < self.min_rows:
            return {'isTabular': False, 'reason': 'Too few rows'}
        
        # Check if all elements are objects
        if not all(isinstance(item, dict) for item in array):
            return {'isTabular': False, 'reason': 'Not all objects'}
        
        # Analyze key signatures
        schema, uniformity = self.analyze_schema(array)
        
        # Check uniformity threshold
        if uniformity < self.min_uniformity:
            return {
                'isTabular': False,
                'reason': f'Low uniformity: {uniformity:.2f}',
                'schema': schema,
                'uniformity': uniformity
            }
        
        # Check field count
        if len(schema) > self.max_fields:
            return {
                'isTabular': False,
                'reason': f'Too many fields: {len(schema)}',
                'schema': schema
            }
        
        # Check if all values are primitive
        if not self.are_all_values_primitive(array, schema):
            return {
                'isTabular': False,
                'reason': 'Contains nested objects/arrays',
                'schema': schema
            }
        
        # Calculate token savings
        savings = self.calculate_token_savings(array, schema)
        
        return {
            'isTabular': True,
            'schema': schema,
            'rowCount': len(array),
            'fieldCount': len(schema),
            'uniformity': uniformity,
            'tokenSavings': savings,
            'estimatedTokens': self.estimate_tabular_tokens(array, schema)
        }
    
    def analyze_schema(self, array: List[Dict[str, Any]]) -> Tuple[List[str], float]:
        """Analyze array schema and uniformity."""
        # Count key signature frequencies
        signature_counts: Dict[str, int] = {}
        signature_keys: Dict[str, List[str]] = {}
        
        for item in array:
            keys = list(item.keys())
            sorted_keys = sorted(keys)
            signature = '|'.join(sorted_keys)
            
            signature_counts[signature] = signature_counts.get(signature, 0) + 1
            
            if signature not in signature_keys:
                signature_keys[signature] = keys
        
        # Find most common signature
        best_signature = max(signature_counts.items(), key=lambda x: x[1])[0]
        schema = signature_keys[best_signature]
        uniformity = signature_counts[best_signature] / len(array)
        
        return schema, uniformity
    
    def are_all_values_primitive(self, array: List[Dict[str, Any]], schema: List[str]) -> bool:
        """Check if all values in array are primitive."""
        for obj in array:
            for field in schema:
                value = obj.get(field)
                
                if value is None or isinstance(value, (str, int, float, bool)):
                    continue
                
                # Arrays of primitives are OK (max 10 items)
                if isinstance(value, list):
                    if len(value) > 10:
                        return False
                    if not all(isinstance(item, (str, int, float, bool, type(None))) for item in value):
                        return False
                    continue
                
                # Small nested objects are OK (max 5 properties)
                if isinstance(value, dict):
                    if len(value) > 5:
                        return False
                    # Only allow flat nested objects
                    if not all(isinstance(v, (str, int, float, bool, type(None))) for v in value.values()):
                        return False
                    continue
                
                return False
        
        return True
    
    def calculate_token_savings(self, array: List[Dict[str, Any]], schema: List[str]) -> float:
        """Calculate token savings of using tabular format."""
        json_tokens = self.estimate_json_tokens(array)
        tabular_tokens = self.estimate_tabular_tokens(array, schema)
        return json_tokens - tabular_tokens
    
    def estimate_json_tokens(self, array: List[Any]) -> float:
        """Estimate tokens for JSON array format."""
        json_str = json.dumps(array)
        return len(json_str) / 4
    
    def estimate_tabular_tokens(self, array: List[Dict[str, Any]], schema: List[str]) -> float:
        """Estimate tokens for ASON tabular format."""
        schema_str = f"[{len(array)}]{{{','.join(schema)}}}"
        tokens = len(schema_str) / 4
        
        for obj in array:
            row_values = [str(obj.get(field, '')) for field in schema]
            row_str = '|'.join(row_values)
            tokens += len(row_str) / 4
        
        return tokens
    
    def find_arrays(self, data: Any, path: str = '') -> List[Dict[str, Any]]:
        """Find all arrays in data recursively."""
        arrays: List[Dict[str, Any]] = []
        
        if isinstance(data, list):
            analysis = self.analyze(data)
            arrays.append({'path': path, 'array': data, 'analysis': analysis})
        elif isinstance(data, dict):
            for key, value in data.items():
                new_path = f"{path}.{key}" if path else key
                arrays.extend(self.find_arrays(value, new_path))
        
        return arrays
    
    def get_statistics(self, data: Any) -> Dict[str, Any]:
        """Get statistics about tabular optimization potential."""
        all_arrays = self.find_arrays(data)
        tabular_arrays = [info for info in all_arrays if info['analysis'].get('isTabular', False)]
        
        total_token_savings = sum(info['analysis'].get('tokenSavings', 0) for info in tabular_arrays)
        
        return {
            'totalArrays': len(all_arrays),
            'tabularArrays': len(tabular_arrays),
            'tabularPercentage': (len(tabular_arrays) / len(all_arrays) * 100) if all_arrays else 0,
            'estimatedTokenSavings': total_token_savings,
            'arrayPaths': [info['path'] for info in tabular_arrays]
        }
