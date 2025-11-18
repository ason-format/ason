"""
ASON (Aliased Serialization Object Notation) - SmartCompressor

This module implements the main compression engine for converting JSON to ASON format,
a token-optimized serialization format designed for Large Language Models (LLMs).

ASON reduces token usage by 20-60% compared to JSON while maintaining
perfect round-trip fidelity (lossless compression).

Example:
    >>> from ason import SmartCompressor
    >>> compressor = SmartCompressor(indent=1, use_references=True)
    >>> data = {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
    >>> ason_str = compressor.compress(data)
    >>> original = compressor.decompress(ason_str)
"""

from typing import Any, Dict, Optional, List
import json

from .lexer.lexer import Lexer
from .parser.parser import Parser
from .analyzer.reference_analyzer import ReferenceAnalyzer
from .analyzer.section_analyzer import SectionAnalyzer
from .analyzer.tabular_analyzer import TabularAnalyzer
from .compiler.serializer import Serializer
from .utils.token_counter import TokenCounter


class SmartCompressor:
    """
    SmartCompressor handles compression and decompression for ASON 2.0.

    Args:
        indent (int): Indentation spaces (default: 1)
        delimiter (str): Field delimiter for tabular arrays (default: '|')
        use_references (bool): Enable reference detection (default: True)
        use_sections (bool): Enable section organization (default: True)
        use_tabular (bool): Enable tabular array format (default: True)
        min_fields_for_section (int): Min fields to create section (default: 3)
        min_rows_for_tabular (int): Min rows for tabular format (default: 2)
        min_reference_occurrences (int): Min occurrences for reference (default: 2)

    Example:
        >>> # Maximum compression
        >>> compressor = SmartCompressor(indent=1)
        >>>
        >>> # Maximum readability
        >>> compressor = SmartCompressor(indent=2, use_sections=False, use_tabular=False)
    """

    def __init__(
        self,
        indent: int = 1,
        delimiter: str = '|',
        use_references: bool = True,
        use_sections: bool = True,
        use_tabular: bool = True,
        min_fields_for_section: int = 3,
        min_rows_for_tabular: int = 2,
        min_reference_occurrences: int = 2
    ):
        """Initialize SmartCompressor with configuration options."""
        # Configuration
        self.indent = max(1, indent)
        self.delimiter = delimiter
        self.use_references = use_references
        self.use_sections = use_sections
        self.use_tabular = use_tabular
        self.min_fields_for_section = min_fields_for_section
        self.min_rows_for_tabular = min_rows_for_tabular
        self.min_reference_occurrences = min_reference_occurrences

        # Initialize components
        self.reference_analyzer = ReferenceAnalyzer(
            min_occurrences=min_reference_occurrences,
            min_length=5
        )

        self.section_analyzer = SectionAnalyzer(
            min_fields_for_section=min_fields_for_section
        )

        self.tabular_analyzer = TabularAnalyzer(
            min_rows=min_rows_for_tabular,
            min_uniformity=0.8
        )

        self.serializer = Serializer(
            indent=indent,
            delimiter=delimiter
        )

    def compress(self, data: Any) -> str:
        """
        Compresses JSON data to ASON 2.0 format.

        Pipeline:
        1. Analyze references (repeated values → $var)
        2. Analyze sections (object organization → @section)
        3. Analyze arrays (uniform arrays → tabular format)
        4. Serialize to ASON 2.0 string

        Args:
            data: Data to compress

        Returns:
            str: ASON 2.0 formatted string

        Example:
            >>> data = {
            ...     "customer": {"name": "John", "email": "john@ex.com"},
            ...     "billing": {"email": "john@ex.com"}
            ... }
            >>> ason_str = compressor.compress(data)
        """
        # Step 1: Analyze references
        references = {}
        if self.use_references:
            references = self.reference_analyzer.analyze(data)

        # Step 2: Analyze sections
        section_plan = None
        if self.use_sections and isinstance(data, dict):
            section_plan = self.section_analyzer.analyze(data)

        # Step 3: Analyze tabular arrays
        tabular_arrays = {}
        if self.use_tabular:
            array_infos = self.tabular_analyzer.find_arrays(data)
            for info in array_infos:
                if info['analysis'].get('isTabular', False):
                    tabular_arrays[info['path']] = info['analysis']

        # Step 4: Serialize
        ason_str = self.serializer.serialize(data, references, section_plan, tabular_arrays)

        return ason_str

    def decompress(self, ason: str) -> Any:
        """
        Decompresses ASON 2.0 format back to JSON.

        Pipeline:
        1. Tokenize (Lexer)
        2. Parse (Parser → AST)
        3. Convert AST to Python value

        Args:
            ason: ASON 2.0 formatted string

        Returns:
            Original JSON data

        Example:
            >>> ason = "@users [2]{id,name}\\n1|Alice\\n2|Bob"
            >>> data = compressor.decompress(ason)
            >>> # Returns: {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
        """
        # Step 1: Tokenize
        lexer = Lexer(ason)
        tokens = lexer.tokenize()

        # Step 2: Parse
        parser = Parser(tokens)
        ast = parser.parse()

        # Step 3: Convert AST to value
        return ast.to_value()

    def compress_with_stats(self, data: Any) -> Dict[str, Any]:
        """
        Compresses data and returns detailed statistics.

        Args:
            data: Data to compress

        Returns:
            dict: Compression result with statistics

        Example:
            >>> result = compressor.compress_with_stats(data)
            >>> print(f"Reduced tokens by {result['stats']['reduction_percent']}%")
        """
        json_string = json.dumps(data)
        ason_string = self.compress(data)

        stats = TokenCounter.compare_formats(data, json_string, ason_string)

        return {
            'ason': ason_string,
            'stats': stats,
            'original_tokens': stats['original_tokens'],
            'compressed_tokens': stats['compressed_tokens'],
            'reduction_percent': stats['reduction_percent']
        }

    def validate_round_trip(self, data: Any) -> Dict[str, Any]:
        """
        Validates that compress/decompress round-trips correctly.

        Args:
            data: Data to test

        Returns:
            dict: Validation result

        Example:
            >>> result = compressor.validate_round_trip(data)
            >>> if result['valid']:
            ...     print('Round-trip successful!')
        """
        try:
            compressed = self.compress(data)
            decompressed = self.decompress(compressed)

            original = json.dumps(data, sort_keys=True)
            result = json.dumps(decompressed, sort_keys=True)

            valid = original == result

            return {
                'valid': valid,
                'compressed': compressed,
                'original': data,
                'decompressed': decompressed,
                'error': None if valid else 'Data mismatch after round-trip'
            }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
                'stack': str(e.__traceback__)
            }

    def get_optimization_stats(self, data: Any) -> Dict[str, Any]:
        """
        Gets optimization statistics without compressing.

        Args:
            data: Data to analyze

        Returns:
            dict: Analysis statistics
        """
        references = {}
        if self.use_references:
            references = self.reference_analyzer.analyze(data)

        section_plan = None
        if self.use_sections and isinstance(data, dict):
            section_plan = self.section_analyzer.analyze(data)

        tabular_stats = None
        if self.use_tabular:
            tabular_stats = self.tabular_analyzer.get_statistics(data)

        section_stats = None
        if section_plan:
            section_stats = self.section_analyzer.get_statistics(section_plan)

        return {
            'references': {
                'count': len(references),
                'names': list(references.keys())
            },
            'sections': section_stats,
            'tabular': tabular_stats
        }
