/**
 * Complex JSON Scenarios Benchmark
 * Tests compression with various complex JSON structures
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SmartCompressor, TokenCounter } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load example data
const loadExample = (filename) => {
  const path = join(__dirname, '../examples/data', filename);
  return JSON.parse(readFileSync(path, 'utf8'));
};

// Generate large array dataset
function generateLargeArray(size = 1000) {
  const transactions = [];
  for (let i = 1; i <= size; i++) {
    transactions.push({
      id: i,
      userId: 100 + (i % 50),
      amount: parseFloat((Math.random() * 500).toFixed(2)),
      category: ['food', 'electronics', 'transport', 'clothing', 'entertainment'][i % 5],
      date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
      status: i % 10 === 0 ? 'pending' : 'completed'
    });
  }
  return { dataset: 'transactions', total: size, transactions };
}

// Test compression on different complexity scenarios
function testComplexity(data, scenarioName, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Scenario: ${scenarioName}`);
  console.log(`Description: ${description}`);
  console.log(`${'='.repeat(70)}`);

  const jsonStr = JSON.stringify(data);
  const jsonSize = jsonStr.length;
  const jsonTokens = TokenCounter.estimateTokens(jsonStr);

  console.log(`\n📊 Original JSON:`);
  console.log(`   Size: ${jsonSize.toLocaleString()} bytes`);
  console.log(`   Tokens: ${jsonTokens.toLocaleString()}`);
  console.log(`   Depth: ${getDepth(data)} levels`);
  console.log(`   Arrays: ${countArrays(data)}`);
  console.log(`   Objects: ${countObjects(data)}`);

  // Calculate complexity score
  const complexity = calculateComplexity(data);
  console.log(`\n🎯 Complexity Score: ${complexity.toFixed(2)}`);
  console.log(`   (Higher score = more complex structure)`);

  return {
    scenario: scenarioName,
    size: jsonSize,
    tokens: jsonTokens,
    depth: getDepth(data),
    arrays: countArrays(data),
    objects: countObjects(data),
    complexity: complexity
  };
}

// Helper functions
function getDepth(obj, current = 0) {
  if (typeof obj !== 'object' || obj === null) return current;

  const depths = Object.values(obj).map(val => getDepth(val, current + 1));
  return Math.max(current, ...depths);
}

function countArrays(obj) {
  if (Array.isArray(obj)) {
    return 1 + obj.reduce((sum, item) => sum + countArrays(item), 0);
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).reduce((sum, val) => sum + countArrays(val), 0);
  }
  return 0;
}

function countObjects(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return Array.isArray(obj) ? obj.reduce((sum, item) => sum + countObjects(item), 0) : 0;
  }
  return 1 + Object.values(obj).reduce((sum, val) => sum + countObjects(val), 0);
}

function calculateComplexity(obj) {
  const depth = getDepth(obj);
  const arrays = countArrays(obj);
  const objects = countObjects(obj);
  const size = JSON.stringify(obj).length;

  // Weighted complexity score
  return (depth * 2) + (arrays * 1.5) + objects + (size / 1000);
}

// Main benchmark runner
function runComplexityBenchmarks() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          COMPLEX JSON STRUCTURES BENCHMARK                        ║');
  console.log('║          Testing Various Complexity Scenarios                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const results = [];

  // Scenario 1: Simple flat object
  const simpleData = loadExample('simple.json');
  results.push(testComplexity(
    simpleData,
    'Simple Flat Object',
    '10 primitive fields, no nesting'
  ));

  // Scenario 2: Moderately nested
  const shippingData = loadExample('shipping_record.json');
  results.push(testComplexity(
    shippingData,
    'Moderate Nesting',
    'Shipping record with 2-3 levels of nested objects'
  ));

  // Scenario 3: Deeply nested
  const deeplyNested = loadExample('deeply-nested.json');
  results.push(testComplexity(
    deeplyNested,
    'Deeply Nested Structure',
    'Company data with 5+ levels of nesting'
  ));

  // Scenario 4: Small array
  const smallArray = loadExample('large-array.json');
  results.push(testComplexity(
    smallArray,
    'Small Uniform Array',
    '10 items with consistent structure'
  ));

  // Scenario 5: Large array (100 items)
  const mediumArray = generateLargeArray(100);
  results.push(testComplexity(
    mediumArray,
    'Medium Uniform Array',
    '100 transaction records with consistent fields'
  ));

  // Scenario 6: Large array (1000 items)
  const largeArray = generateLargeArray(1000);
  results.push(testComplexity(
    largeArray,
    'Large Uniform Array',
    '1000 transaction records - ideal for Toon format'
  ));

  // Scenario 7: Mixed types
  const mixedData = loadExample('mixed-types.json');
  results.push(testComplexity(
    mixedData,
    'Mixed Type Array',
    'Array with heterogeneous data types'
  ));

  // Scenario 8: Sparse data
  const sparseData = loadExample('sparse-data.json');
  results.push(testComplexity(
    sparseData,
    'Sparse Data',
    'Many null/undefined fields'
  ));

  // Scenario 9: E-commerce order
  const orderData = loadExample('e-commerce-order.json');
  results.push(testComplexity(
    orderData,
    'E-commerce Order',
    'Real-world order with items, shipping, payment'
  ));

  // Scenario 10: Time series
  const analyticsData = loadExample('analytics-timeseries.json');
  results.push(testComplexity(
    analyticsData,
    'Time Series Analytics',
    'Daily metrics with summary'
  ));

  // Summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                   COMPLEXITY ANALYSIS SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  console.log('┌────────────────────────────────┬──────────┬─────────┬───────┬────────┐');
  console.log('│ Scenario                       │ Tokens   │ Depth   │ Arrays│ Complex│');
  console.log('├────────────────────────────────┼──────────┼─────────┼───────┼────────┤');

  results.forEach(r => {
    const name = r.scenario.padEnd(30).substring(0, 30);
    const tokens = r.tokens.toString().padEnd(8);
    const depth = r.depth.toString().padEnd(7);
    const arrays = r.arrays.toString().padEnd(5);
    const complexity = r.complexity.toFixed(1).padEnd(6);
    console.log(`│ ${name} │ ${tokens} │ ${depth} │ ${arrays} │ ${complexity} │`);
  });

  console.log('└────────────────────────────────┴──────────┴─────────┴───────┴────────┘');

  // Insights
  console.log('\n💡 Key Insights:');
  const mostComplex = results.reduce((max, r) => r.complexity > max.complexity ? r : max);
  const leastComplex = results.reduce((min, r) => r.complexity < min.complexity ? r : min);
  const largestTokens = results.reduce((max, r) => r.tokens > max.tokens ? r : max);

  console.log(`   Most complex: ${mostComplex.scenario} (score: ${mostComplex.complexity.toFixed(2)})`);
  console.log(`   Least complex: ${leastComplex.scenario} (score: ${leastComplex.complexity.toFixed(2)})`);
  console.log(`   Largest tokens: ${largestTokens.scenario} (${largestTokens.tokens.toLocaleString()} tokens)`);
  console.log(`   Average complexity: ${(results.reduce((sum, r) => sum + r.complexity, 0) / results.length).toFixed(2)}`);

  console.log('\n✅ Complex JSON benchmark completed!\n');

  return results;
}

// Run the benchmarks
runComplexityBenchmarks();
