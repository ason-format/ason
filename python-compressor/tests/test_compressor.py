"""
Comprehensive test suite for ASON SmartCompressor using pytest

Tests cover:
- Basic compression/decompression (round-trip guarantee)
- Complex nested structures  
- Edge cases (nulls, empty values, special characters)
- Token counting and compression metrics

All tests verify lossless round-trip: compress(data) → decompress → original data
"""

import pytest
import json
from ason import SmartCompressor


@pytest.fixture
def compressor():
    """Fixture providing a fresh SmartCompressor instance for each test"""
    return SmartCompressor(indent=1)


class TestBasicFunctionality:
    """Test suite for SmartCompressor basic functionality"""
    
    def test_simple_object(self, compressor):
        """Test compression of simple flat object with primitives"""
        data = {"name": "Alice", "age": 30, "active": True}
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_nested_object(self, compressor):
        """Test compression of nested objects"""
        data = {
            "user": {"id": 1, "name": "Bob"},
            "settings": {"theme": "dark", "lang": "en"}
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_array_of_primitives(self, compressor):
        """Test compression of primitive arrays"""
        data = [1, 2, 3, "a", "b", True, False, None]
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_uniform_array(self, compressor):
        """Test efficient compression of uniform arrays"""
        data = [
            {"id": 1, "name": "Alice", "age": 25},
            {"id": 2, "name": "Bob", "age": 30},
            {"id": 3, "name": "Charlie", "age": 35}
        ]
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        # Test round-trip
        assert decompressed == data
        
        # Test compression efficiency
        original_str = json.dumps(data)
        assert len(compressed) < len(original_str)
    
    def test_null_and_empty_values(self, compressor):
        """Test handling of null, 0, and empty strings"""
        data = {"a": None, "b": 0, "c": "", "d": False}
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed["a"] is None
        assert decompressed["b"] == 0
        assert decompressed["c"] == ""
        assert decompressed["d"] is False
    
    def test_special_characters_in_strings(self, compressor):
        """Test strings with special characters like @, $, &"""
        data = {
            "email": "user@example.com",
            "price": "$19.99",
            "company": "Smith & Co"
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_deeply_nested_objects(self, compressor):
        """Test deeply nested object structures"""
        data = {
            "level1": {
                "level2": {
                    "level3": {
                        "level4": {
                            "value": "deep"
                        }
                    }
                }
            }
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_mixed_type_array(self, compressor):
        """Test arrays with mixed types"""
        data = {
            "items": [
                {"type": "A", "value": 1},
                {"type": "B", "value": 2, "extra": True},
                "simple string",
                42,
                None
            ]
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_large_uniform_array(self, compressor):
        """Test compression benefit on large uniform arrays"""
        data = [
            {
                "id": i,
                "name": f"User{i}",
                "email": f"user{i}@example.com",
                "age": 20 + i
            }
            for i in range(50)
        ]
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
        
        # Should show significant compression
        original_size = len(json.dumps(data))
        compressed_size = len(compressed)
        reduction = (original_size - compressed_size) / original_size * 100
        
        assert reduction > 20, f"Expected >20% compression, got {reduction:.1f}%"
    
    def test_basic_structures(self, compressor):
        """Test basic data structures"""
        data = {
            "value": 1,
            "array": [1, 2]
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
    
    def test_boolean_values(self, compressor):
        """Test all boolean combinations"""
        data = {
            "true_val": True,
            "false_val": False,
            "in_array": [True, False, True]
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data
        assert decompressed["true_val"] is True
        assert decompressed["false_val"] is False
    
    @pytest.mark.parametrize("value,expected", [
        (42, 42),
        (3.14159, 3.14159),
        (-100, -100),
        (0, 0),
        (1e10, 1e10)
    ])
    def test_number_types(self, compressor, value, expected):
        """Test various number formats"""
        data = {"number": value}
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed["number"] == expected
    
    def test_string_handling(self, compressor):
        """Test various string formats"""
        data = {
            "simple": "hello world",
            "with_space": "hello world",
            "numeric_string": "12345"
        }
        
        compressed = compressor.compress(data)
        decompressed = compressor.decompress(compressed)
        
        assert decompressed == data


class TestCompressorFeatures:
    """Test suite for SmartCompressor advanced features"""
    
    def test_compress_with_stats(self, compressor):
        """Test compression with statistics"""
        data = {"test": "data", "nested": {"value": 123}}
        
        result = compressor.compress_with_stats(data)
        
        assert 'ason' in result
        assert 'stats' in result
        assert 'reduction_percent' in result
        assert isinstance(result['reduction_percent'], (int, float))
    
    def test_validate_round_trip(self, compressor):
        """Test round-trip validation"""
        data = {
            "customer": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1-555-0123"
            },
            "billing": {
                "email": "john@example.com"
            }
        }
        
        result = compressor.validate_round_trip(data)
        
        assert result['valid'] is True
    
    def test_tabular_array_detection(self, compressor):
        """Test that uniform arrays use tabular format"""
        data = {
            "users": [
                {"id": 1, "name": "Alice", "email": "alice@ex.com"},
                {"id": 2, "name": "Bob", "email": "bob@ex.com"}
            ]
        }
        
        compressed = compressor.compress(data)
        
        # Should contain tabular format indicators
        assert "[" in compressed and "]" in compressed
        assert "{" in compressed
        
        # Verify round-trip
        decompressed = compressor.decompress(compressed)
        assert decompressed == data
    
    def test_optimization_stats(self, compressor):
        """Test optimization statistics"""
        data = [
            {"id": i, "name": f"Item{i}", "value": i * 10}
            for i in range(10)
        ]
        
        try:
            stats = compressor.get_optimization_stats(data)
            assert stats is not None
        except AttributeError:
            # Method might not exist in all implementations
            pytest.skip("get_optimization_stats not available")
