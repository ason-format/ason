"""
Reference Analyzer for ASON 2.0
"""

from typing import Any, Dict, List, Optional, Set
import re


class ReferenceAnalyzer:
    """Analyzes data for repeated values and generates references."""
    
    def __init__(self, min_occurrences: int = 2, min_length: int = 5, max_references: int = 50):
        self.min_occurrences = min_occurrences
        self.min_length = min_length
        self.max_references = max_references
    
    def analyze(self, data: Any) -> Dict[str, str]:
        """Analyze data and generate reference map."""
        value_counts: Dict[str, int] = {}
        value_context: Dict[str, List[str]] = {}
        
        self.collect_values(data, value_counts, value_context)

        candidates: List[Dict[str, Any]] = []
        
        for value, count in value_counts.items():
            if count < self.min_occurrences:
                continue
            if len(value) < self.min_length:
                continue
            
            # Skip values that start with ASON special characters
            if value.startswith(('$', '&', '#', '@')):
                continue
            
            # Calculate token savings
            savings = self.calculate_savings(value, count)
            
            if savings > 0:
                candidates.append({
                    'value': value,
                    'count': count,
                    'savings': savings,
                    'contexts': value_context.get(value, [])
                })
        
        # Sort by savings (highest first)
        candidates.sort(key=lambda x: x['savings'], reverse=True)

        # Generate references for top candidates
        references: Dict[str, str] = {}
        limit = min(len(candidates), self.max_references)
        
        for i in range(limit):
            candidate = candidates[i]
            ref_name = self.generate_reference_name(candidate, i)
            references[ref_name] = candidate['value']
        
        return references
    
    def collect_values(self, data: Any, value_counts: Dict[str, int], value_context: Dict[str, List[str]], path: str = '') -> None:
        """Recursively collect string values from data."""
        if isinstance(data, str):
            if len(data) >= self.min_length:
                value_counts[data] = value_counts.get(data, 0) + 1
                
                if data not in value_context:
                    value_context[data] = []
                value_context[data].append(path)
        elif isinstance(data, list):
            for i, item in enumerate(data):
                self.collect_values(item, value_counts, value_context, f"{path}[{i}]")
        elif isinstance(data, dict):
            for key, value in data.items():
                new_path = f"{path}.{key}" if path else key
                self.collect_values(value, value_counts, value_context, new_path)
    
    def calculate_savings(self, value: str, count: int) -> float:
        """Calculate token savings for creating a reference."""
        # Estimate tokens (rough approximation: 1 token per 4 characters)
        value_tokens = len(value) / 4
        
        # Reference name tokens (e.g., "$email" ~= 2 tokens)
        ref_tokens = 2
        
        # Total original: value repeated count times
        original_tokens = value_tokens * count
        
        # With reference: value once + ref name * count
        with_ref_tokens = value_tokens + (ref_tokens * count)
        
        return original_tokens - with_ref_tokens
    
    def generate_reference_name(self, candidate: Dict[str, Any], fallback_index: int) -> str:
        """Generate a semantic reference name based on context."""
        value = candidate['value']
        contexts = candidate['contexts']
        
        # Try to infer name from context
        inferred_name = self.infer_name_from_context(contexts)
        if inferred_name:
            return '$' + inferred_name
        
        # Try to infer from value content
        content_name = self.infer_name_from_value(value)
        if content_name:
            return '$' + content_name
        
        # Fallback to indexed name
        return f'$val{fallback_index}'
    
    def infer_name_from_context(self, contexts: List[str]) -> Optional[str]:
        """Infer a variable name from usage contexts."""
        if not contexts:
            return None

        # Extract last part of each path
        parts: List[str] = []
        for ctx in contexts:
            segments = re.split(r'[\.\[\]]', ctx)
            last = [s for s in segments if s]
            if last:
                parts.append(last[-1])
        
        # Find most common part
        frequency: Dict[str, int] = {}
        for part in parts:
            if part and re.match(r'^[a-zA-Z]', part):
                frequency[part] = frequency.get(part, 0) + 1
        
        if not frequency:
            return None
        
        # Return most frequent
        return max(frequency.items(), key=lambda x: x[1])[0]
    
    def infer_name_from_value(self, value: str) -> Optional[str]:
        """Infer a variable name from value content."""
        # Email pattern
        if '@' in value and re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
            return 'email'
        
        # Phone pattern
        if re.match(r'^[\d\s\-\+\(\)]+$', value) and len(re.sub(r'\D', '', value)) >= 10:
            return 'phone'
        
        # URL pattern
        if re.match(r'^https?://', value):
            return 'url'
        
        # UUID pattern
        if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', value, re.I):
            return 'id'
        
        # Date pattern
        if re.match(r'^\d{4}-\d{2}-\d{2}', value):
            return 'date'
        
        return None
