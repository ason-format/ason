"""
Basic ASON compression example
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ason import SmartCompressor
import json


def main():
    # Create compressor
    compressor = SmartCompressor(indent=1, use_references=True)
    
    # Sample data
    data = {
        "customer": {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1-555-0123",
            "tier": "gold"
        },
        "order": {
            "id": "ORD-12345",
            "date": "2024-01-15",
            "items": [
                {"product": "Widget A", "quantity": 2, "price": 29.99},
                {"product": "Widget B", "quantity": 1, "price": 49.99}
            ],
            "total": 109.97
        },
        "billing": {
            "email": "john.doe@example.com",
            "method": "credit_card"
        }
    }
    
    print("=" * 60)
    print("ASON Python Compressor - Basic Example")
    print("=" * 60)
    
    # Original JSON
    json_str = json.dumps(data, indent=2)
    print("\n📄 Original JSON:")
    print(json_str)
    print(f"\nSize: {len(json_str)} bytes")
    
    # Compress to ASON
    ason_str = compressor.compress(data)
    print("\n📦 Compressed ASON:")
    print(ason_str)
    print(f"\nSize: {len(ason_str)} bytes")
    
    # Compression stats
    result = compressor.compress_with_stats(data)
    print("\n📊 Compression Statistics:")
    print(f"  • Original tokens: {result['original_tokens']}")
    print(f"  • Compressed tokens: {result['compressed_tokens']}")
    print(f"  • Token reduction: {result['reduction_percent']}%")
    print(f"  • Size reduction: {result['stats']['size_reduction_percent']}%")
    
    # Round-trip validation
    decompressed = compressor.decompress(ason_str)
    print("\n✅ Round-trip validation:")
    print(f"  • Original matches decompressed: {data == decompressed}")
    
    # Optimization analysis
    opt_stats = compressor.get_optimization_stats(data)
    print("\n🔍 Optimization Analysis:")
    print(f"  • References detected: {opt_stats['references']['count']}")
    if opt_stats['references']['names']:
        print(f"    - {', '.join(opt_stats['references']['names'])}")
    
    print("\n" + "=" * 60)
    print("Example completed successfully!")
    print("=" * 60)


if __name__ == '__main__':
    main()
