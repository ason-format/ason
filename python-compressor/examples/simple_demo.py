"""
Simple ASON Compression Demo
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ason import SmartCompressor
import json


def main():
    print("=" * 60)
    print("ASON Python Compressor - Simple Demo")
    print("=" * 60)
    
    # Create compressor (without optimizations for stability)
    compressor = SmartCompressor(
        indent=1,
        use_references=False,
        use_sections=False,
        use_tabular=False
    )
    
    # Sample data
    data = {
        "user": {
            "name": "Alice Johnson",
            "age": 30,
            "email": "alice@example.com"
        },
        "items": [
            {"id": 1, "product": "Laptop", "price": 999.99},
            {"id": 2, "product": "Mouse", "price": 29.99}
        ],
        "total": 1029.98
    }
    
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
    
    # Calculate reduction
    reduction = ((len(json_str) - len(ason_str)) / len(json_str) * 100)
    print(f"\n📊 Size reduction: {reduction:.1f}%")
    
    # Round-trip validation
    decompressed = compressor.decompress(ason_str)
    matches = (data == decompressed)
    
    print(f"\n✅ Round-trip test: {'PASSED' if matches else 'FAILED'}")
    
    if matches:
        print("\n" + "=" * 60)
        print("Demo completed successfully!")
        print("=" * 60)
    else:
        print("\n❌ Warning: Data mismatch after round-trip")
        print(f"Original: {data}")
        print(f"Result: {decompressed}")


if __name__ == '__main__':
    main()
