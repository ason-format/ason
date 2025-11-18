"""
Token Counter utility for ASON 2.0

Estimates token counts for different formats (JSON, ASON, etc.)
using approximation methods.

Module: token_counter
License: MIT
Version: 2.0.0
"""

from typing import Any, Dict
import json
import re


class TokenCounter:
    """Token counting utilities."""
    
    @staticmethod
    def estimate_tokens(text: Any) -> int:
        """
        Estimate tokens for text using character-based approximation.
        
        Uses the common heuristic: ~1 token per 4 characters for English text.
        
        Args:
            text: Text to count (auto-stringifies non-strings)
        
        Returns:
            Estimated token count
        
        Example:
            >>> TokenCounter.estimate_tokens("Hello world")
            3
        """
        if not isinstance(text, str):
            text = json.dumps(text)
        
        # Approximate: 1 token per 4 characters
        return max(1, len(text) // 4)
    
    @staticmethod
    def compare(original: Any, compressed: Any) -> Dict:
        """
        Compare token counts between two formats.
        
        Args:
            original: Original data/text
            compressed: Compressed data/text
        
        Returns:
            Comparison statistics
        """
        original_str = original if isinstance(original, str) else json.dumps(original)
        compressed_str = compressed if isinstance(compressed, str) else json.dumps(compressed)
        
        original_tokens = TokenCounter.estimate_tokens(original_str)
        compressed_tokens = TokenCounter.estimate_tokens(compressed_str)
        
        reduction = original_tokens - compressed_tokens
        reduction_percent = (reduction / original_tokens * 100) if original_tokens > 0 else 0
        
        return {
            'original_tokens': original_tokens,
            'compressed_tokens': compressed_tokens,
            'tokens_saved': reduction,
            'reduction_percent': round(reduction_percent, 2),
            'original_size': len(original_str),
            'compressed_size': len(compressed_str),
            'bytes_saved': len(original_str) - len(compressed_str),
            'size_reduction_percent': round((len(original_str) - len(compressed_str)) / len(original_str) * 100, 2) if len(original_str) > 0 else 0
        }
    
    @staticmethod
    def analyze_json(data: Any) -> Dict:
        """
        Get detailed token breakdown for JSON.
        
        Args:
            data: Data to analyze
        
        Returns:
            Token breakdown
        """
        json_str = data if isinstance(data, str) else json.dumps(data)
        
        # Count different types of characters
        brackets = len(re.findall(r'[\[\]{}]', json_str))
        quotes = json_str.count('"')
        colons = json_str.count(':')
        commas = json_str.count(',')
        
        return {
            'total_chars': len(json_str),
            'total_tokens': TokenCounter.estimate_tokens(json_str),
            'structural': {
                'brackets': brackets,
                'quotes': quotes,
                'colons': colons,
                'commas': commas
            },
            'structural_overhead': brackets + quotes + colons + commas
        }
    
    @staticmethod
    def analyze_ason(ason: str) -> Dict:
        """
        Get detailed token breakdown for ASON.
        
        Args:
            ason: ASON text
        
        Returns:
            Token breakdown
        """
        sections = len(re.findall(r'@\w+', ason))
        references = len(re.findall(r'\$\w+', ason))
        pipes = ason.count('|')
        newlines = ason.count('\n')
        
        return {
            'total_chars': len(ason),
            'total_tokens': TokenCounter.estimate_tokens(ason),
            'features': {
                'sections': sections,
                'references': references,
                'pipe_delimiters': pipes,
                'newlines': newlines
            }
        }
    
    @staticmethod
    def compare_formats(data: Any, json_string: str, ason_string: str) -> Dict:
        """
        Calculate comprehensive comparison stats.
        
        Args:
            data: Original data
            json_string: JSON representation
            ason_string: ASON representation
        
        Returns:
            Detailed comparison
        """
        json_analysis = TokenCounter.analyze_json(json_string)
        ason_analysis = TokenCounter.analyze_ason(ason_string)
        comparison = TokenCounter.compare(json_string, ason_string)
        
        return {
            **comparison,
            'json': json_analysis,
            'ason': ason_analysis,
            'efficiency': {
                'tokens_per_char_json': json_analysis['total_tokens'] / json_analysis['total_chars'] if json_analysis['total_chars'] > 0 else 0,
                'tokens_per_char_ason': ason_analysis['total_tokens'] / ason_analysis['total_chars'] if ason_analysis['total_chars'] > 0 else 0,
                'compression_ratio': ason_analysis['total_chars'] / json_analysis['total_chars'] if json_analysis['total_chars'] > 0 else 0
            }
        }
