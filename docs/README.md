# JSON Compressor Visualizer

Interactive web visualizer to demonstrate LLM-optimized JSON compression.

## Features

- **Intuitive visual interface**: Side-by-side panels to view original and compressed JSON
- **Real-time statistics**: Shows tokens, percentage reduction, and sizes
- **Preloaded examples**: Comes with ready-to-test examples
- **Copy to clipboard**: Function to easily copy the result
- **Decompression**: Verifies that compression is lossless

## How to Use

1. Open `index.html` in your browser
2. Enter your JSON in the left panel (or use "Load Example")
3. Click "Compress →"
4. View the compressed result and statistics below

## Statistics Displayed

- **Original Tokens**: Token estimation of original JSON
- **Compressed Tokens**: Token estimation of compressed JSON
- **Token Reduction**: Amount of tokens saved
- **Reduction %**: Percentage of reduction
- **Original Size**: Size in bytes of original JSON
- **Compressed Size**: Size in bytes of compressed JSON

## Technologies

- HTML5
- CSS3 (with gradients and animations)
- Vanilla JavaScript (no dependencies)
- Responsive design

## Compression

The compressor works automatically with any JSON:

- **Objects**: Separates keys and values `[keys, values]`
- **Uniform arrays**: Detects arrays with same structure and uses table format `[keys, row1, row2, ...]`
- **No configuration**: No need to define schemas
- **Lossless**: Guarantees perfect recovery of original

## Usage Example

```json
// Original
{
  "users": [
    {"id": 1, "name": "Alice", "age": 25},
    {"id": 2, "name": "Bob", "age": 30}
  ]
}

// Compressed
[
  ["users"],
  [
    [
      ["id", "name", "age"],
      [1, "Alice", 25],
      [2, "Bob", 30]
    ]
  ]
]
```

## Deployment

Simply open `index.html` in a browser or deploy the files to any static web server.

You can use:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

Or simply open the file locally:
```bash
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```
