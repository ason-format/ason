"""
Section Analyzer for ASON 2.0
"""

from typing import Any, Dict, List


class SectionAnalyzer:
    """Analyzes data structure for optimal section organization."""
    
    def __init__(self, min_fields_for_section: int = 3, max_depth: int = 3):
        self.min_fields_for_section = min_fields_for_section
        self.max_depth = max_depth
    
    def analyze(self, data: Any) -> Dict[str, Any]:
        """Analyze data and create section organization plan."""
        if not isinstance(data, dict):
            return {'sections': [], 'dotNotation': []}

        analysis: List[Dict[str, Any]] = []
        
        for key, value in data.items():
            if isinstance(value, dict):
                info = self.analyze_object(key, value, 1)
                analysis.append(info)
        
        # Separate sections from dot notation
        sections = [a for a in analysis if a['useSection']]
        dot_notation = [a for a in analysis if not a['useSection']]
        
        return {'sections': sections, 'dotNotation': dot_notation}
    
    def analyze_object(self, path: str, obj: Dict[str, Any], depth: int) -> Dict[str, Any]:
        """Analyze a single object to determine if it should be a section."""
        field_count = self.count_leaf_fields(obj)
        token_savings = self.calculate_section_savings(path, field_count)
        
        return {
            'path': path,
            'fieldCount': field_count,
            'depth': depth,
            'useSection': token_savings > 0 and field_count >= self.min_fields_for_section,
            'tokenSavings': token_savings,
            'hasNestedObjects': self.has_nested_objects(obj)
        }
    
    def count_leaf_fields(self, obj: Dict[str, Any], depth: int = 0) -> int:
        """Count leaf (non-object) fields in an object tree."""
        if depth > self.max_depth:
            return 0
        
        count = 0
        
        for value in obj.values():
            if isinstance(value, dict):
                count += self.count_leaf_fields(value, depth + 1)
            else:
                count += 1
        
        return count
    
    def has_nested_objects(self, obj: Dict[str, Any]) -> bool:
        """Check if object has nested objects."""
        return any(isinstance(v, dict) for v in obj.values())
    
    def calculate_section_savings(self, path: str, field_count: int) -> float:
        """Calculate token savings of using @section vs dot notation."""
        # Estimate tokens for path (rough: 1 token per 4 chars)
        path_tokens = len(path) / 4
        
        # Dot notation cost: (path + dot) per field
        dot_notation_cost = (path_tokens + 0.5) * field_count
        
        # Section cost: @path + newline (overhead)
        section_cost = path_tokens + 1
        
        # Savings = cost of dot notation - cost of section
        return dot_notation_cost - section_cost
    
    def get_statistics(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Get statistics about section usage."""
        total_sections = len(plan['sections']) + len(plan['dotNotation'])
        using_sections = len(plan['sections'])
        using_dot_notation = len(plan['dotNotation'])
        
        total_token_savings = sum(s.get('tokenSavings', 0) for s in plan['sections'])
        
        return {
            'totalSections': total_sections,
            'usingSections': using_sections,
            'usingDotNotation': using_dot_notation,
            'sectionPercentage': (using_sections / total_sections * 100) if total_sections > 0 else 0,
            'estimatedTokenSavings': total_token_savings
        }
