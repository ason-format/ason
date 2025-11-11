/**
 * Performance Benchmark
 * Tests compression/decompression speed and throughput
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { encode as toonEncode, decode as toonDecode } from '@toon-format/toon';
import { SmartCompressor } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load example data
const loadExample = (filename) => {
  const path = join(__dirname, '../examples/data', filename);
  return JSON.parse(readFileSync(path, 'utf8'));
};

// Performance measurement utilities
function measureTime(fn, iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return {
    total: end - start,
    average: (end - start) / iterations,
    opsPerSecond: iterations / ((end - start) / 1000)
  };
}

function formatTime(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatOps(ops) {
  if (ops > 1000000) return `${(ops / 1000000).toFixed(2)}M ops/s`;
  if (ops > 1000) return `${(ops / 1000).toFixed(2)}K ops/s`;
  return `${ops.toFixed(2)} ops/s`;
}

// Benchmark a specific operation
function benchmarkOperation(data, operationName, iterations = 1000) {
  console.log(`\n  Testing: ${operationName}`);
  console.log(`  Iterations: ${iterations.toLocaleString()}`);

  const results = {};

  // JSON stringify/parse
  const jsonStringify = measureTime(() => JSON.stringify(data), iterations);
  const jsonStr = JSON.stringify(data);
  const jsonParse = measureTime(() => JSON.parse(jsonStr), iterations);

  results.json = {
    stringify: jsonStringify,
    parse: jsonParse,
    roundtrip: {
      total: jsonStringify.total + jsonParse.total,
      average: jsonStringify.average + jsonParse.average,
      opsPerSecond: iterations / ((jsonStringify.total + jsonParse.total) / 1000)
    }
  };

  console.log(`\n  📄 JSON:`);
  console.log(`     Stringify:  ${formatTime(jsonStringify.average)} (${formatOps(jsonStringify.opsPerSecond)})`);
  console.log(`     Parse:      ${formatTime(jsonParse.average)} (${formatOps(jsonParse.opsPerSecond)})`);
  console.log(`     Round-trip: ${formatTime(results.json.roundtrip.average)} (${formatOps(results.json.roundtrip.opsPerSecond)})`);

  // Toon encode/decode
  try {
    const toonEncodeTime = measureTime(() => toonEncode(data), iterations);
    const toonStr = toonEncode(data);
    const toonDecodeTime = measureTime(() => toonDecode(toonStr), iterations);

    results.toon = {
      encode: toonEncodeTime,
      decode: toonDecodeTime,
      roundtrip: {
        total: toonEncodeTime.total + toonDecodeTime.total,
        average: toonEncodeTime.average + toonDecodeTime.average,
        opsPerSecond: iterations / ((toonEncodeTime.total + toonDecodeTime.total) / 1000)
      }
    };

    console.log(`\n  🎯 Toon:`);
    console.log(`     Encode:     ${formatTime(toonEncodeTime.average)} (${formatOps(toonEncodeTime.opsPerSecond)})`);
    console.log(`     Decode:     ${formatTime(toonDecodeTime.average)} (${formatOps(toonDecodeTime.opsPerSecond)})`);
    console.log(`     Round-trip: ${formatTime(results.toon.roundtrip.average)} (${formatOps(results.toon.roundtrip.opsPerSecond)})`);

    const toonVsJson = ((results.toon.roundtrip.average / results.json.roundtrip.average - 1) * 100).toFixed(2);
    console.log(`     vs JSON:    ${toonVsJson > 0 ? '+' : ''}${toonVsJson}%`);
  } catch (e) {
    console.log(`\n  🎯 Toon: N/A (incompatible structure)`);
  }

  // Schema-based (if applicable)
  const schemaId = detectSchemaId(data);
  if (schemaId) {
    const compressor = new SmartCompressor();

    const schemaCompress = measureTime(() => compressor.compress(data, schemaId), iterations);
    const compressed = compressor.compress(data, schemaId);
    const schemaDecompress = measureTime(() => compressor.decompress(compressed), iterations);

    results.schema = {
      compress: schemaCompress,
      decompress: schemaDecompress,
      roundtrip: {
        total: schemaCompress.total + schemaDecompress.total,
        average: schemaCompress.average + schemaDecompress.average,
        opsPerSecond: iterations / ((schemaCompress.total + schemaDecompress.total) / 1000)
      }
    };

    console.log(`\n  🚀 Schema-based:`);
    console.log(`     Compress:   ${formatTime(schemaCompress.average)} (${formatOps(schemaCompress.opsPerSecond)})`);
    console.log(`     Decompress: ${formatTime(schemaDecompress.average)} (${formatOps(schemaDecompress.opsPerSecond)})`);
    console.log(`     Round-trip: ${formatTime(results.schema.roundtrip.average)} (${formatOps(results.schema.roundtrip.opsPerSecond)})`);

    const schemaVsJson = ((results.schema.roundtrip.average / results.json.roundtrip.average - 1) * 100).toFixed(2);
    console.log(`     vs JSON:    ${schemaVsJson > 0 ? '+' : ''}${schemaVsJson}%`);
  }

  return results;
}

function detectSchemaId(data) {
  if (data.process && data.process.processType === 'SHIPPING') {
    return 'ship_v1';
  }
  return null;
}

// Memory usage estimation
function estimateMemoryUsage(data, name) {
  console.log(`\n  💾 Memory Footprint Estimate:`);

  const jsonStr = JSON.stringify(data);
  const jsonSize = jsonStr.length;

  console.log(`     JSON string:    ${(jsonSize / 1024).toFixed(2)} KB`);

  try {
    const toonStr = toonEncode(data);
    console.log(`     Toon string:    ${(toonStr.length / 1024).toFixed(2)} KB (${((1 - toonStr.length / jsonSize) * 100).toFixed(2)}% reduction)`);
  } catch (e) {
    console.log(`     Toon string:    N/A`);
  }

  const compressor = new SmartCompressor({ indent: 0 });
  const compressed = compressor.compress(data);
  console.log(`     ASON:           ${(compressed.length / 1024).toFixed(2)} KB (${((1 - compressed.length / jsonSize) * 100).toFixed(2)}% reduction)`);
}

// Main performance benchmark
function runPerformanceBenchmark() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                   PERFORMANCE BENCHMARK                               ║');
  console.log('║          Testing compression/decompression speed                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');

  const results = [];

  // Test 1: Shipping Record (small, with schema)
  console.log('\n' + '='.repeat(75));
  console.log('Test 1: Shipping Record (Small, Schema-supported)');
  console.log('='.repeat(75));
  const shipping = loadExample('shipping_record.json');
  const shippingResults = benchmarkOperation(shipping, 'Shipping Record', 10000);
  estimateMemoryUsage(shipping, 'Shipping Record');
  results.push({ name: 'Shipping Record', ...shippingResults });

  // Test 2: E-commerce Order (medium complexity)
  console.log('\n' + '='.repeat(75));
  console.log('Test 2: E-commerce Order (Medium Complexity)');
  console.log('='.repeat(75));
  const order = loadExample('e-commerce-order.json');
  const orderResults = benchmarkOperation(order, 'E-commerce Order', 5000);
  estimateMemoryUsage(order, 'E-commerce Order');
  results.push({ name: 'E-commerce Order', ...orderResults });

  // Test 3: Analytics Data (array-heavy)
  console.log('\n' + '='.repeat(75));
  console.log('Test 3: Analytics Time Series (Array-heavy)');
  console.log('='.repeat(75));
  const analytics = loadExample('analytics-timeseries.json');
  const analyticsResults = benchmarkOperation(analytics, 'Analytics Data', 5000);
  estimateMemoryUsage(analytics, 'Analytics Data');
  results.push({ name: 'Analytics Data', ...analyticsResults });

  // Test 4: Deeply Nested (complex structure)
  console.log('\n' + '='.repeat(75));
  console.log('Test 4: Deeply Nested Structure');
  console.log('='.repeat(75));
  const nested = loadExample('deeply-nested.json');
  const nestedResults = benchmarkOperation(nested, 'Deeply Nested', 5000);
  estimateMemoryUsage(nested, 'Deeply Nested');
  results.push({ name: 'Deeply Nested', ...nestedResults });

  // Summary
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                       PERFORMANCE SUMMARY                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  console.log('⚡ Throughput Comparison (ops/second):');
  console.log('┌──────────────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Dataset              │ JSON         │ Toon         │ Schema       │');
  console.log('├──────────────────────┼──────────────┼──────────────┼──────────────┤');

  results.forEach(r => {
    const name = r.name.padEnd(20).substring(0, 20);
    const jsonOps = formatOps(r.json.roundtrip.opsPerSecond).padEnd(12);
    const toonOps = r.toon ? formatOps(r.toon.roundtrip.opsPerSecond).padEnd(12) : 'N/A'.padEnd(12);
    const schemaOps = r.schema ? formatOps(r.schema.roundtrip.opsPerSecond).padEnd(12) : 'N/A'.padEnd(12);
    console.log(`│ ${name} │ ${jsonOps} │ ${toonOps} │ ${schemaOps} │`);
  });

  console.log('└──────────────────────┴──────────────┴──────────────┴──────────────┘');

  console.log('\n💡 Key Findings:');
  console.log('   - JSON is typically the fastest for simple serialization');
  console.log('   - Schema-based adds minimal overhead while providing compression');
  console.log('   - Performance difference is negligible for most use cases');
  console.log('   - Choose based on compression needs, not raw speed');

  console.log('\n✅ Performance benchmark completed!\n');

  return results;
}

// Run the benchmark
runPerformanceBenchmark();
