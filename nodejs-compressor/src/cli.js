#!/usr/bin/env node

/**
 * ASON CLI - Command-line tool for JSON ↔ ASON conversion
 * @module cli
 */

import { readFileSync, writeFileSync } from 'fs';
import { SmartCompressor, TokenCounter } from './index.js';

// Parse CLI arguments
function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    encode: false,
    decode: false,
    delimiter: '|',
    indent: 1,
    stats: false,
    useReferences: true,
    useSections: true,
    useTabular: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '-e' || arg === '--encode') {
      options.encode = true;
    } else if (arg === '-d' || arg === '--decode') {
      options.decode = true;
    } else if (arg === '--delimiter') {
      options.delimiter = args[++i];
    } else if (arg === '--indent') {
      options.indent = parseInt(args[++i], 10);
    } else if (arg === '--stats') {
      options.stats = true;
    } else if (arg === '--no-references') {
      options.useReferences = false;
    } else if (arg === '--no-sections') {
      options.useSections = false;
    } else if (arg === '--no-tabular') {
      options.useTabular = false;
    } else if (arg === '-h' || arg === '--help') {
      showHelp();
      process.exit(0);
    } else if (!arg.startsWith('-') && !options.input) {
      options.input = arg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
ASON CLI - Convert between JSON and ASON formats

USAGE:
  npx ason [options] [input]

ARGUMENTS:
  [input]              Input file path (omit or use '-' for stdin)

OPTIONS:
  -o, --output <file>  Output file path (prints to stdout if omitted)
  -e, --encode         Force encode mode (JSON → ASON)
  -d, --decode         Force decode mode (ASON → JSON)
  --delimiter <char>   Delimiter for tabular arrays: '|' (pipe), ',' (comma), '\\t' (tab)
  --indent <number>    Indentation size (default: 1)
  --stats              Show token count estimates and savings
  --no-references      Disable reference detection ($var)
  --no-sections        Disable section organization (@section)
  --no-tabular         Disable tabular array format (key:[N]{fields})
  -h, --help           Show this help message

EXAMPLES:
  # Encode JSON to ASON (auto-detected)
  npx ason input.json -o output.ason

  # Decode ASON to JSON (auto-detected)
  npx ason data.ason -o output.json

  # Output to stdout
  npx ason input.json

  # Pipe from stdin
  cat data.json | npx ason
  echo '{"name": "Ada"}' | npx ason --stats

  # Tab-separated output (more token-efficient)
  npx ason data.json --delimiter "\\t" -o output.ason

  # Show token savings
  npx ason data.json --stats

  # Decode from stdin
  cat data.ason | npx ason --decode

NOTES:
  - Auto-detection: .json → encode, .ason → decode
  - When using stdin, defaults to encode mode
  - Use --stats to see token count comparison
`);
}

function readInput(inputPath) {
  if (!inputPath || inputPath === '-') {
    // Read from stdin
    return readFileSync(0, 'utf8');
  }

  return readFileSync(inputPath, 'utf8');
}

function writeOutput(content, outputPath) {
  if (!outputPath) {
    // Write to stdout
    console.log(content);
  } else {
    writeFileSync(outputPath, content, 'utf8');
    console.error(`✓ Written to ${outputPath}`);
  }
}

function detectMode(input, options) {
  // If explicitly specified, use that
  if (options.encode) return 'encode';
  if (options.decode) return 'decode';

  // Auto-detect from file extension
  if (options.input && options.input !== '-') {
    if (options.input.endsWith('.json')) return 'encode';
    if (options.input.endsWith('.ason')) return 'decode';
  }

  // Try to detect from content
  try {
    JSON.parse(input);
    return 'encode'; // Valid JSON, encode it
  } catch {
    return 'decode'; // Not JSON, assume ASON
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showStats(jsonData, asonData) {
  const jsonStr = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
  const jsonTokens = TokenCounter.estimateTokens(jsonStr);
  const asonTokens = TokenCounter.estimateTokens(asonData);

  const tokenSavings = jsonTokens - asonTokens;
  const percentSavings = ((tokenSavings / jsonTokens) * 100).toFixed(2);

  const jsonSize = Buffer.byteLength(jsonStr, 'utf8');
  const asonSize = Buffer.byteLength(asonData, 'utf8');
  const sizeSavings = jsonSize - asonSize;
  const percentSizeSavings = ((sizeSavings / jsonSize) * 100).toFixed(2);

  console.error('\n📊 COMPRESSION STATS:');
  console.error('┌─────────────────┬──────────┬────────────┬──────────────┐');
  console.error('│ Format          │ Tokens   │ Size       │ Reduction    │');
  console.error('├─────────────────┼──────────┼────────────┼──────────────┤');
  console.error(`│ JSON            │ ${jsonTokens.toString().padEnd(8)} │ ${formatBytes(jsonSize).padEnd(10)} │ -            │`);
  console.error(`│ ASON            │ ${asonTokens.toString().padEnd(8)} │ ${formatBytes(asonSize).padEnd(10)} │ ${percentSavings}%${' '.repeat(8 - percentSavings.length)} │`);
  console.error('└─────────────────┴──────────┴────────────┴──────────────┘');
  console.error(`\n✓ Saved ${tokenSavings} tokens (${percentSavings}%) • ${formatBytes(sizeSavings)} (${percentSizeSavings}%)\n`);
}

// Main execution
try {
  const args = process.argv.slice(2);

  if (args.length === 0 && process.stdin.isTTY) {
    showHelp();
    process.exit(1);
  }

  const options = parseArgs(args);
  const input = readInput(options.input);

  if (!input.trim()) {
    console.error('Error: Empty input');
    process.exit(1);
  }

  const mode = detectMode(input, options);

  const compressor = new SmartCompressor({
    indent: options.indent,
    delimiter: options.delimiter,
    useReferences: options.useReferences,
    useSections: options.useSections,
    useTabular: options.useTabular
  });

  if (mode === 'encode') {
    // JSON → ASON
    let jsonData;
    try {
      jsonData = JSON.parse(input);
    } catch (err) {
      console.error('Error: Invalid JSON input');
      console.error(err.message);
      process.exit(1);
    }

    const ason = compressor.compress(jsonData);

    if (options.stats) {
      showStats(jsonData, ason);
    }

    writeOutput(ason, options.output);

  } else {
    // ASON → JSON
    let decoded;
    try {
      decoded = compressor.decompress(input);
    } catch (err) {
      console.error('Error: Invalid ASON input');
      console.error(err.message);
      process.exit(1);
    }

    const json = JSON.stringify(decoded, null, 2);

    if (options.stats) {
      const ason = compressor.compress(decoded);
      showStats(decoded, ason);
    }

    writeOutput(json, options.output);
  }

} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
