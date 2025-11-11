/**
 * Multi-Format Comparison Benchmark
 * Compares JSON, Toon, and Schema-based compression
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { encode as toonEncode } from '@toon-format/toon';
import { SmartCompressor, TokenCounter } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load example data
const loadExample = (filename) => {
  const path = join(__dirname, '../examples/data', filename);
  return JSON.parse(readFileSync(path, 'utf8'));
};

// Run comparison for a single dataset
function compareFormats(data, datasetName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Dataset: ${datasetName}`);
  console.log(`${'='.repeat(70)}`);

  // 1. JSON (baseline)
  const jsonStr = JSON.stringify(data);
  const jsonTokens = TokenCounter.estimateTokens(jsonStr);
  const jsonSize = jsonStr.length;

  console.log('\n📄 JSON (baseline):');
  console.log(`   Size: ${jsonSize} bytes`);
  console.log(`   Tokens: ${jsonTokens}`);

  // 2. Toon format
  let toonStr, toonTokens, toonSize, toonReduction;
  try {
    toonStr = toonEncode(data);
    toonSize = toonStr.length;
    toonTokens = TokenCounter.estimateTokens(toonStr);
    toonReduction = ((1 - toonTokens / jsonTokens) * 100).toFixed(2);

    console.log('\n🎯 Toon format:');
    console.log(`   Size: ${toonSize} bytes (${((1 - toonSize / jsonSize) * 100).toFixed(2)}% reduction)`);
    console.log(`   Tokens: ${toonTokens} (${toonReduction}% reduction)`);
  } catch (error) {
    console.log('\n🎯 Toon format: N/A (incompatible data structure)');
    toonTokens = jsonTokens; // Fallback for comparison
    toonReduction = '0.00';
  }

  // 3. ASON compression
  const compressor = new SmartCompressor({ indent: 0 });
  const compressed = compressor.compress(data);
  const compressedSize = compressed.length;
  const compressedTokens = TokenCounter.estimateTokens(compressed);
  const asonReduction = ((1 - compressedTokens / jsonTokens) * 100).toFixed(2);

  console.log('\n🚀 ASON:');
  console.log(`   Size: ${compressedSize} bytes (${((1 - compressedSize / jsonSize) * 100).toFixed(2)}% reduction)`);
  console.log(`   Tokens: ${compressedTokens} (${asonReduction}% reduction)`);

  // Summary table
  console.log('\n📊 COMPARISON SUMMARY:');
  console.log('┌─────────────────┬─────────┬────────────┬──────────────┐');
  console.log('│ Format          │ Tokens  │ Size (B)   │ Reduction    │');
  console.log('├─────────────────┼─────────┼────────────┼──────────────┤');
  console.log(`│ JSON (baseline) │ ${jsonTokens.toString().padEnd(7)} │ ${jsonSize.toString().padEnd(10)} │ -            │`);
  console.log(`│ Toon            │ ${toonTokens.toString().padEnd(7)} │ ${(toonSize || 'N/A').toString().padEnd(10)} │ ${toonReduction}%${' '.repeat(8 - toonReduction.length)} │`);
  console.log(`│ ASON            │ ${compressedTokens.toString().padEnd(7)} │ ${compressedSize.toString().padEnd(10)} │ ${asonReduction}%${' '.repeat(8 - asonReduction.length)} │`);
  console.log('└─────────────────┴─────────┴────────────┴──────────────┘');

  return {
    dataset: datasetName,
    json: { tokens: jsonTokens, size: jsonSize },
    toon: { tokens: toonTokens, size: toonSize || null },
    ason: { tokens: compressedTokens, size: compressedSize }
  };
}

// Main benchmark runner
function runBenchmarks() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     MULTI-FORMAT COMPRESSION BENCHMARK                            ║');
  console.log('║     Comparing: JSON vs Toon vs ASON                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const results = [];

  // Benchmark 1: Shipping Record
  const shippingData = loadExample('shipping_record.json');
  results.push(compareFormats(shippingData, 'Shipping Record'));

  // Benchmark 2: E-commerce Order
  const orderData = loadExample('e-commerce-order.json');
  results.push(compareFormats(orderData, 'E-commerce Order'));

  // Benchmark 3: Analytics Time Series
  const analyticsData = loadExample('analytics-timeseries.json');
  results.push(compareFormats(analyticsData, 'Analytics Time Series'));

  // Benchmark 4: GitHub Repositories
  const githubData = loadExample('github-repos.json');
  results.push(compareFormats(githubData, 'GitHub Repositories'));

  // Benchmark 5: Deeply Nested
  const nestedData = loadExample('deeply-nested.json');
  results.push(compareFormats(nestedData, 'Deeply Nested Structure'));

  // Overall Summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                     OVERALL RESULTS SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const avgToonReduction = results
    .filter(r => r.toon.tokens)
    .reduce((sum, r) => sum + ((1 - r.toon.tokens / r.json.tokens) * 100), 0) / results.filter(r => r.toon.tokens).length;

  const avgAsonReduction = results
    .reduce((sum, r) => sum + ((1 - r.ason.tokens / r.json.tokens) * 100), 0) / results.length;

  console.log(`📊 Average Token Reduction:`);
  console.log(`   Toon Format:    ${avgToonReduction.toFixed(2)}%`);
  console.log(`   ASON:           ${avgAsonReduction.toFixed(2)}%`);

  console.log('\n✅ Benchmark completed!\n');

  return results;
}

// Run the benchmarks
runBenchmarks();
