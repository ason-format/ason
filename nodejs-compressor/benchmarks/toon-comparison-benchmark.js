import {
  SmartCompressor,
  TokenCounter,
} from "../src/compressor/SmartCompressor.js";
import { encode as toonEncode, decode as toonDecode } from "@toon-format/toon";

const datasets = {
  uniformArray: {
    name: "Uniform Array (10 users)",
    data: {
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: i % 3 === 0 ? "admin" : "user",
        active: true,
        createdAt: "2024-01-01T00:00:00Z",
      })),
    },
  },

  largeUniformArray: {
    name: "Large Uniform Array (50 products)",
    data: {
      products: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        sku: `PROD-${String(i + 1).padStart(4, "0")}`,
        name: `Product ${i + 1}`,
        price: 9.99 + i * 2.5,
        stock: 100 + i * 10,
        category: ["Electronics", "Clothing", "Food"][i % 3],
        active: true,
      })),
    },
  },

  deeplyNested: {
    name: "Deeply Nested Non-uniform",
    data: {
      company: {
        name: "TechCorp",
        address: {
          street: "123 Main St",
          city: "San Francisco",
          state: "CA",
          coordinates: {
            lat: 37.7749,
            lng: -122.4194,
            elevation: 52,
          },
        },
        departments: [
          {
            name: "Engineering",
            head: { name: "Alice", age: 35 },
            teams: [
              { name: "Frontend", members: ["Bob", "Charlie"] },
              { name: "Backend", members: ["David"], lead: "Eve" },
            ],
          },
          {
            name: "Sales",
            manager: "Frank",
            regions: ["North", "South", "East", "West"],
          },
        ],
      },
    },
  },

  mixed: {
    name: "Mixed Structure",
    data: {
      metadata: {
        version: "1.0",
        timestamp: "2024-01-01T00:00:00Z",
        author: "System",
      },
      items: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        type: "task",
        status: ["pending", "completed", "failed"][i % 3],
        priority: (i % 5) + 1,
      })),
      settings: {
        theme: "dark",
        notifications: {
          email: true,
          push: false,
          frequency: "daily",
        },
      },
    },
  },

  primitiveArrays: {
    name: "Primitive Arrays",
    data: {
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      strings: ["apple", "banana", "cherry", "date", "elderberry"],
      mixed: [1, "two", 3, "four", 5, "six"],
      booleans: [true, false, true, true, false],
    },
  },
};

console.log("═══════════════════════════════════════════════════════════");
console.log("  COMPARACIÓN: Nuestro Formato vs Toon vs JSON");
console.log("═══════════════════════════════════════════════════════════\n");

const compressor = new SmartCompressor({ indent: 1, useReferences: true });
const results = [];

for (const [key, dataset] of Object.entries(datasets)) {
  console.log(`\n📊 ${dataset.name}`);
  console.log("─".repeat(60));

  const jsonStr = JSON.stringify(dataset.data);

  // Nuestro formato
  const ourCompressed = compressor.compress(dataset.data);
  const ourDecompressed = compressor.decompress(ourCompressed);

  // Toon formato
  const toonCompressed = toonEncode(dataset.data);
  const toonDecompressed = toonDecode(toonCompressed);

  // Verificar round-trip
  const ourRoundTrip =
    JSON.stringify(dataset.data) === JSON.stringify(ourDecompressed);
  const toonRoundTrip =
    JSON.stringify(dataset.data) === JSON.stringify(toonDecompressed);

  // Token counts
  const jsonTokens = TokenCounter.estimateTokens(jsonStr);
  const ourTokens = TokenCounter.estimateTokens(ourCompressed);
  const toonTokens = TokenCounter.estimateTokens(toonCompressed);

  const ourReduction = (((jsonTokens - ourTokens) / jsonTokens) * 100).toFixed(
    1,
  );
  const toonReduction = (
    ((jsonTokens - toonTokens) / jsonTokens) *
    100
  ).toFixed(1);

  // Bytes
  const jsonBytes = jsonStr.length;
  const ourBytes = ourCompressed.length;
  const toonBytes = toonCompressed.length;

  console.log(`JSON:         ${jsonTokens} tokens  |  ${jsonBytes} bytes`);
  console.log(
    `Nuestro:      ${ourTokens} tokens  |  ${ourBytes} bytes  (${ourReduction > 0 ? "-" : "+"}${Math.abs(ourReduction)}%)`,
  );
  console.log(
    `Toon:         ${toonTokens} tokens  |  ${toonBytes} bytes  (${toonReduction > 0 ? "-" : "+"}${Math.abs(toonReduction)}%)`,
  );

  // Determinar ganador
  let winner = "JSON";
  if (ourTokens < jsonTokens && ourTokens < toonTokens) {
    winner = "Nuestro";
  } else if (toonTokens < jsonTokens && toonTokens < ourTokens) {
    winner = "Toon";
  }

  console.log(`\n🏆 Ganador: ${winner}`);
  console.log(
    `${ourRoundTrip ? "✅" : "❌"} Round-trip Nuestro: ${ourRoundTrip ? "Perfect" : "FAILED"}`,
  );
  console.log(
    `${toonRoundTrip ? "✅" : "❌"} Round-trip Toon: ${toonRoundTrip ? "Perfect" : "FAILED"}`,
  );

  results.push({
    name: dataset.name,
    jsonTokens,
    ourTokens,
    toonTokens,
    ourReduction: parseFloat(ourReduction),
    toonReduction: parseFloat(toonReduction),
    winner,
    ourRoundTrip,
    toonRoundTrip,
  });
}

console.log("\n\n═══════════════════════════════════════════════════════════");
console.log("  RESUMEN FINAL");
console.log("═══════════════════════════════════════════════════════════\n");

const ourWins = results.filter((r) => r.winner === "Nuestro").length;
const toonWins = results.filter((r) => r.winner === "Toon").length;
const jsonWins = results.filter((r) => r.winner === "JSON").length;

console.log(`🏆 Victorias:`);
console.log(`   Nuestro: ${ourWins}/${results.length}`);
console.log(`   Toon:    ${toonWins}/${results.length}`);
console.log(`   JSON:    ${jsonWins}/${results.length}\n`);

const avgOurReduction = (
  results.reduce((sum, r) => sum + r.ourReduction, 0) / results.length
).toFixed(1);
const avgToonReduction = (
  results.reduce((sum, r) => sum + r.toonReduction, 0) / results.length
).toFixed(1);

console.log(`📊 Reducción promedio de tokens:`);
console.log(`   Nuestro: ${avgOurReduction}%`);
console.log(`   Toon:    ${avgToonReduction}%\n`);

console.log(`Mejor por tipo de datos:`);
results.forEach((r) => {
  const symbol =
    r.winner === "Nuestro" ? "✅" : r.winner === "Toon" ? "⚡" : "📄";
  console.log(`   ${symbol} ${r.name}: ${r.winner}`);
});

console.log("\n═══════════════════════════════════════════════════════════\n");

// Exportar para visualizador web
export { results };
