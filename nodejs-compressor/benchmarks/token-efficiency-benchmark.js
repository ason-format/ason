/**
 * Token Efficiency Benchmark
 * Detailed token-level comparison across formats
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

// Calculate token efficiency metrics
function calculateTokenEfficiency(data, name) {
  const jsonStr = JSON.stringify(data);
  const jsonCompactStr = JSON.stringify(data, null, 0);
  const jsonPrettyStr = JSON.stringify(data, null, 2);

  const jsonTokens = TokenCounter.estimateTokens(jsonStr);
  const jsonCompactTokens = TokenCounter.estimateTokens(jsonCompactStr);
  const jsonPrettyTokens = TokenCounter.estimateTokens(jsonPrettyStr);

  const metrics = {
    name,
    json: {
      compact: { tokens: jsonCompactTokens, size: jsonCompactStr.length },
      pretty: { tokens: jsonPrettyTokens, size: jsonPrettyStr.length },
      ratio: jsonPrettyTokens / jsonCompactTokens
    }
  };

  // Toon format
  try {
    const toonStr = toonEncode(data);
    const toonTokens = TokenCounter.estimateTokens(toonStr);
    metrics.toon = {
      tokens: toonTokens,
      size: toonStr.length,
      vs_json: ((1 - toonTokens / jsonTokens) * 100).toFixed(2),
      vs_compact: ((1 - toonTokens / jsonCompactTokens) * 100).toFixed(2)
    };
  } catch (e) {
    metrics.toon = { error: 'Incompatible structure' };
  }

  // ASON
  const compressor = new SmartCompressor({ indent: 1 });
  const compressed = compressor.compress(data);
  const compressedTokens = TokenCounter.estimateTokens(compressed);

  metrics.ason = {
    tokens: compressedTokens,
    size: compressed.length,
    vs_json: ((1 - compressedTokens / jsonTokens) * 100).toFixed(2),
    vs_compact: ((1 - compressedTokens / jsonCompactTokens) * 100).toFixed(2),
    vs_toon: metrics.toon.error ? 'N/A' : ((1 - compressedTokens / metrics.toon.tokens) * 100).toFixed(2)
  };

  return metrics;
}

// Display detailed metrics
function displayMetrics(metrics) {
  console.log(`\n${'='.repeat(75)}`);
  console.log(`Dataset: ${metrics.name}`);
  console.log(`${'='.repeat(75)}`);

  console.log('\n📊 TOKEN BREAKDOWN:\n');

  console.log(`JSON (compact):  ${metrics.json.compact.tokens} tokens (${metrics.json.compact.size} bytes)`);
  console.log(`JSON (pretty):   ${metrics.json.pretty.tokens} tokens (${metrics.json.pretty.size} bytes)`);
  console.log(`Pretty overhead: +${((metrics.json.ratio - 1) * 100).toFixed(2)}%\n`);

  if (!metrics.toon.error) {
    console.log(`Toon:            ${metrics.toon.tokens} tokens (${metrics.toon.size} bytes)`);
    console.log(`  vs JSON:       ${metrics.toon.vs_json}% reduction`);
    console.log(`  vs Compact:    ${metrics.toon.vs_compact}% reduction\n`);
  }

  if (metrics.ason) {
    console.log(`ASON:            ${metrics.ason.tokens} tokens (${metrics.ason.size} bytes)`);
    console.log(`  vs JSON:       ${metrics.ason.vs_json}% reduction`);
    console.log(`  vs Compact:    ${metrics.ason.vs_compact}% reduction`);
    if (!metrics.toon.error) {
      console.log(`  vs Toon:       ${metrics.ason.vs_toon}% additional reduction\n`);
    }
  }

  // Token efficiency ratio
  console.log('💰 EFFICIENCY RATIOS (tokens per information unit):\n');
  const fieldCount = countFields(metrics);
  console.log(`Estimated fields: ${fieldCount}`);
  console.log(`JSON:        ${(metrics.json.compact.tokens / fieldCount).toFixed(2)} tokens/field`);
  if (!metrics.toon.error) {
    console.log(`Toon:        ${(metrics.toon.tokens / fieldCount).toFixed(2)} tokens/field`);
  }
  if (metrics.ason) {
    console.log(`ASON:        ${(metrics.ason.tokens / fieldCount).toFixed(2)} tokens/field`);
  }
}

function countFields(metrics) {
  // Rough estimate based on JSON size and structure
  return Math.ceil(metrics.json.compact.size / 20);
}

// Main benchmark
function runTokenEfficiencyBenchmark() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║              TOKEN EFFICIENCY DETAILED BENCHMARK                     ║');
  console.log('║              Analyzing token-level compression metrics               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');

  const results = [];

  // Test various datasets
  console.log('\n📦 Testing: Shipping Record');
  const shipping = calculateTokenEfficiency(
    loadExample('shipping_record.json'),
    'Shipping Record'
  );
  displayMetrics(shipping);
  results.push(shipping);

  console.log('\n📦 Testing: E-commerce Order');
  const order = calculateTokenEfficiency(
    loadExample('e-commerce-order.json'),
    'E-commerce Order'
  );
  displayMetrics(order);
  results.push(order);

  console.log('\n📦 Testing: Analytics Time Series');
  const analytics = calculateTokenEfficiency(
    loadExample('analytics-timeseries.json'),
    'Analytics Time Series'
  );
  displayMetrics(analytics);
  results.push(analytics);

  console.log('\n📦 Testing: GitHub Repositories');
  const github = calculateTokenEfficiency(
    loadExample('github-repos.json'),
    'GitHub Repositories'
  );
  displayMetrics(github);
  results.push(github);

  // Overall Summary
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    OVERALL TOKEN EFFICIENCY                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  const avgToonReduction = results
    .filter(r => !r.toon.error)
    .reduce((sum, r) => sum + parseFloat(r.toon.vs_json), 0) / results.filter(r => !r.toon.error).length;

  const schemaResults = results.filter(r => r.schema);
  const avgSchemaReduction = schemaResults.length > 0
    ? schemaResults.reduce((sum, r) => sum + parseFloat(r.schema.vs_json), 0) / schemaResults.length
    : 0;

  const avgSummaryReduction = schemaResults.length > 0
    ? schemaResults.reduce((sum, r) => sum + parseFloat(r.summary.vs_json), 0) / schemaResults.length
    : 0;

  console.log('📊 Average Token Reductions (vs JSON):');
  console.log(`   Toon Format:     ${avgToonReduction.toFixed(2)}%`);
  console.log(`   Schema-based:    ${avgSchemaReduction.toFixed(2)}%`);
  console.log(`   LLM Summary:     ${avgSummaryReduction.toFixed(2)}%`);

  console.log('\n🎯 Winner Analysis:');
  console.log(`   Best for lossy compression:  LLM Summary (${avgSummaryReduction.toFixed(2)}% reduction)`);
  console.log(`   Best for lossless:           Schema-based (${avgSchemaReduction.toFixed(2)}% reduction)`);
  console.log(`   Toon alternative value:      +${(avgSchemaReduction - avgToonReduction).toFixed(2)}% over Toon`);

  console.log('\n✅ Token efficiency benchmark completed!\n');

  return results;
}

// Run the benchmark
runTokenEfficiencyBenchmark();
