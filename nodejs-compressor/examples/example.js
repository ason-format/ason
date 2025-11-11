/**
 * Example: Compress ANY JSON automatically
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { SmartCompressor, TokenCounter } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(
  "╔═══════════════════════════════════════════════════════════════════╗",
);
console.log(
  "║          LLM Data Compressor - Node.js Example                   ║",
);
console.log(
  "║          Works with ANY JSON - No configuration needed           ║",
);
console.log(
  "╚═══════════════════════════════════════════════════════════════════╝\n",
);

const compressor = new SmartCompressor();

// Example 1: Simple object
console.log("📦 Example 1: Simple Object");
const simple = { name: "Alice", age: 30, city: "NYC", active: true };
const simpleCompressed = compressor.compress(simple);
console.log("Original:", JSON.stringify(simple));
console.log("Compressed:", JSON.stringify(simpleCompressed));
console.log(
  "Round-trip:",
  JSON.stringify(compressor.decompress(simpleCompressed)),
);
console.log(
  "✅ Match:",
  JSON.stringify(simple) ===
    JSON.stringify(compressor.decompress(simpleCompressed)),
);
console.log();

// Example 2: Array of objects (table-like)
console.log("📦 Example 2: Uniform Array (like a table)");
const users = [
  { id: 1, name: "Alice", age: 25 },
  { id: 2, name: "Bob", age: 30 },
  { id: 3, name: "Charlie", age: 35 },
];
const usersCompressed = compressor.compress(users);
console.log("Original:", JSON.stringify(users));
console.log("Compressed:", JSON.stringify(usersCompressed));
console.log("Keys stored once:", usersCompressed.$k);
console.log("Values as rows:", usersCompressed.$v);
console.log();

// Example 3: Real shipping record
console.log("📦 Example 3: Real Shipping Record");
const shippingPath = join(__dirname, "data/shipping_record.json");
const shipping = JSON.parse(readFileSync(shippingPath, "utf8"));
const shippingCompressed = compressor.compress(shipping);

const originalTokens = TokenCounter.estimateTokens(JSON.stringify(shipping));
const compressedTokens = TokenCounter.estimateTokens(
  JSON.stringify(shippingCompressed),
);
const reduction = ((1 - compressedTokens / originalTokens) * 100).toFixed(2);

console.log(`Original size: ${JSON.stringify(shipping).length} bytes`);
console.log(
  `Compressed size: ${JSON.stringify(shippingCompressed).length} bytes`,
);
console.log(`Original tokens: ${originalTokens}`);
console.log(`Compressed tokens: ${compressedTokens}`);
console.log(`Token reduction: ${reduction}%`);
console.log();

// Example 4: Nested structure
console.log("📦 Example 4: Nested Structure");
const nested = {
  user: { id: 1, profile: { name: "Alice", email: "alice@example.com" } },
  settings: { theme: "dark", notifications: { email: true, sms: false } },
};
const nestedCompressed = compressor.compress(nested);
const nestedDecompressed = compressor.decompress(nestedCompressed);
console.log("Original:", JSON.stringify(nested));
console.log("Compressed:", JSON.stringify(nestedCompressed));
console.log(
  "✅ Perfect round-trip:",
  JSON.stringify(nested) === JSON.stringify(nestedDecompressed),
);
console.log();

console.log("✅ All examples completed!\n");
console.log("💡 Key takeaways:");
console.log("   - Works with ANY JSON automatically");
console.log("   - No schemas or configuration needed");
console.log("   - Detects uniform arrays and compresses efficiently");
console.log("   - Perfect round-trip (lossless)");
console.log("   - 20-60% token reduction on average\n");
