"""
ASON (Aliased Serialization Object Notation) - Main Entry Point

This module exports the main compression engine and token counter utilities
for converting JSON to ASON format, a token-optimized serialization format
designed for Large Language Models (LLMs).

ASON reduces token usage by 20-60% compared to JSON while maintaining
perfect round-trip fidelity (lossless compression).

Example:
    >>> from ason import SmartCompressor, TokenCounter
    >>>
    >>> compressor = SmartCompressor(indent=1, use_references=True)
    >>> data = {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}
    >>>
    >>> # Compress
    >>> ason_str = compressor.compress(data)
    >>>
    >>> # Decompress
    >>> original = compressor.decompress(ason_str)
    >>>
    >>> # Compare
    >>> stats = TokenCounter.compare_formats(data, ason_str)
    >>> print(f"Reduced tokens by {stats['reduction_percent']}%")
"""

from .compressor import SmartCompressor
from .utils.token_counter import TokenCounter

__version__ = "2.0.0-preview"
__all__ = ["SmartCompressor", "TokenCounter"]
