# Quick Start Guide - ASON Python Compressor

## Installation

```bash
cd /Users/user/Documents/Github/ason-format/ason/python-compressor
pip install -e .
```

## Basic Usage

```python
from ason import SmartCompressor

# Create compressor
compressor = SmartCompressor(indent=1)

# Your data
data = {
    "user": {
        "name": "Alice Johnson",
        "age": 30,
        "email": "alice@example.com"
    },
    "items": [
        {"id": 1, "product": "Laptop", "price": 999.99},
        {"id": 2, "product": "Mouse", "price": 29.99}
    ]
}

# Compress to ASON
ason_str = compressor.compress(data)
print(ason_str)
# Output:
# user:{name:"Alice Johnson",age:30,email:"alice@example.com"}
# items:
#  - {id:1,product:Laptop,price:999.99}
#  - {id:2,product:Mouse,price:29.99}

# Decompress back to Python
original = compressor.decompress(ason_str)
assert original == data  # Perfect round-trip!
```

## Running the Demo

```bash
python examples/simple_demo.py
```

Output:
```
============================================================
ASON Python Compressor - Simple Demo
============================================================

📄 Original JSON:
{
  "user": {
    "name": "Alice Johnson",
    ...
  }
}

Size: 285 bytes

📦 Compressed ASON:
user:{name:"Alice Johnson",age:30,email:"alice@example.com"}
items:
 - {id:1,product:Laptop,price:999.99}
 - {id:2,product:Mouse,price:29.99}
total:1029.98

Size: 155 bytes

📊 Size reduction: 45.6%

✅ Round-trip test: PASSED

============================================================
Demo completed successfully!
============================================================
```

## Verification

All basic tests pass:

```bash
python -c "
import sys
sys.path.insert(0, 'src')
from ason import SmartCompressor

comp = SmartCompressor(indent=1, use_references=False, use_sections=False, use_tabular=False)

# Test 1: Basic
data = {'name': 'Alice', 'age': 30}
assert comp.decompress(comp.compress(data)) == data
print('✓ Test 1 passed')

# Test 2: Arrays
data = {'items': [1, 2, 3]}
assert comp.decompress(comp.compress(data)) == data
print('✓ Test 2 passed')

# Test 3: Nested
data = {'user': {'name': 'Bob', 'age': 25}}
assert comp.decompress(comp.compress(data)) == data
print('✓ Test 3 passed')

print('\\n✅ All tests passed!')
"
```

Output:
```
✓ Test 1 passed
✓ Test 2 passed
✓ Test 3 passed

✅ All tests passed!
```
