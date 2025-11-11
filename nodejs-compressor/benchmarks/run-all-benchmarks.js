/**
 * Master Benchmark Runner
 * Executes all benchmarks and generates comprehensive report
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const benchmarks = [
  { name: 'Multi-Format Comparison', file: 'comparison-benchmark.js' },
  { name: 'Complex JSON Scenarios', file: 'complex-json-benchmark.js' },
  { name: 'Token Efficiency Analysis', file: 'token-efficiency-benchmark.js' },
  { name: 'Performance Metrics', file: 'performance-benchmark.js' }
];

async function runBenchmark(file) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [join(__dirname, file)], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Benchmark ${file} failed with code ${code}`));
      }
    });
  });
}

async function runAllBenchmarks() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                       ║');
  console.log('║              LLM DATA COMPRESSOR - FULL BENCHMARK SUITE              ║');
  console.log('║                                                                       ║');
  console.log('║        Demonstrating superiority over JSON and Toon formats         ║');
  console.log('║                                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  for (let i = 0; i < benchmarks.length; i++) {
    const benchmark = benchmarks[i];
    console.log(`\n[${ i + 1}/${benchmarks.length}] Running: ${benchmark.name}...`);
    console.log(`File: ${benchmark.file}\n`);

    try {
      await runBenchmark(benchmark.file);
      console.log(`\n✅ ${benchmark.name} completed successfully\n`);
    } catch (error) {
      console.error(`\n❌ ${benchmark.name} failed:`, error.message);
      process.exit(1);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    ALL BENCHMARKS COMPLETED                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');
  console.log(`⏱️  Total execution time: ${duration}s`);
  console.log(`📊 Benchmarks run: ${benchmarks.length}`);
  console.log('\n📄 Results have been displayed above');
  console.log('💡 Review the output to compare JSON vs Toon vs Schema-based compression\n');
  console.log('Next steps:');
  console.log('  1. Run tests: npm test');
  console.log('  2. Check coverage: npm run test:coverage');
  console.log('  3. Review documentation in docs/\n');
}

runAllBenchmarks().catch(console.error);
