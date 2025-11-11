import { SmartCompressor } from "./ason.js";

const benchmarks = [
  {
    name: "Uniform Array (10 users)",
    data: {
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: 20 + (i % 50),
        active: i % 2 === 0,
      })),
    },
  },
  {
    name: "Large Uniform (50 products)",
    data: {
      products: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: (i + 1) * 10.99,
        inStock: i % 3 !== 0,
        category: ["Electronics", "Clothing", "Food"][i % 3],
      })),
    },
  },
  {
    name: "Deeply Nested",
    data: {
      config: {
        app: {
          name: "MyApp",
          version: "1.0.0",
          settings: { theme: "dark", lang: "es" },
        },
        database: {
          host: "localhost",
          port: 5432,
          credentials: { user: "admin", pass: "secret" },
        },
      },
    },
  },
  {
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
        notifications: { email: true, push: false, frequency: "daily" },
      },
    },
  },
  {
    name: "Primitive Arrays",
    data: {
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      strings: ["apple", "banana", "cherry", "date", "elderberry"],
      mixed: [1, "two", 3, "four", true, null, 7.5],
    },
  },
  {
    name: "Stripe Payment Intent (Real-world)",
    data: {
      object: "payment_intent",
      id: "pi_3OQ4xJ2eZvKYlo2C0x7fGHYZ",
      amount: 2099,
      amount_capturable: 0,
      amount_details: {
        tip: {},
      },
      amount_received: 2099,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: {
        allow_redirects: "always",
        enabled: true,
      },
      canceled_at: null,
      cancellation_reason: null,
      capture_method: "automatic",
      client_secret:
        "pi_3OQ4xJ2eZvKYlo2C0x7fGHYZ_secret_xDFg8h9J2kLmN3oPqR4sTuVwXyZ",
      confirmation_method: "automatic",
      created: 1704067200,
      currency: "usd",
      customer: "cus_PQR789XYZ012",
      description: "Premium subscription - Annual plan",
      invoice: null,
      last_payment_error: null,
      latest_charge: "ch_3OQ4xJ2eZvKYlo2C0x7fGHYZ",
      livemode: false,
      metadata: {
        order_id: "ord_abc123xyz",
        user_id: "usr_456def789",
        plan_type: "annual",
        campaign: "spring_sale_2024",
        referral_code: "SAVE20",
      },
      next_action: null,
      on_behalf_of: null,
      payment_method: "pm_1OQ4xI2eZvKYlo2C9zAbCdEf",
      payment_method_configuration_details: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: "automatic",
        },
      },
      payment_method_types: ["card"],
      processing: null,
      receipt_email: "customer@example.com",
      review: null,
      setup_future_usage: "off_session",
      shipping: {
        address: {
          city: "San Francisco",
          country: "US",
          line1: "123 Market Street",
          line2: "Suite 456",
          postal_code: "94103",
          state: "CA",
        },
        carrier: "USPS",
        name: "John Doe",
        phone: "+14155551234",
        tracking_number: "9400111899562537289457",
      },
      source: null,
      statement_descriptor: "ACME CORP",
      statement_descriptor_suffix: null,
      status: "succeeded",
      transfer_data: null,
      transfer_group: null,
      charges: {
        object: "list",
        data: [
          {
            id: "ch_3OQ4xJ2eZvKYlo2C0x7fGHYZ",
            object: "charge",
            amount: 2099,
            amount_captured: 2099,
            amount_refunded: 0,
            application: null,
            application_fee: null,
            application_fee_amount: null,
            balance_transaction: "txn_3OQ4xJ2eZvKYlo2C0x7fGHYZ",
            billing_details: {
              address: {
                city: "San Francisco",
                country: "US",
                line1: "123 Market Street",
                line2: "Suite 456",
                postal_code: "94103",
                state: "CA",
              },
              email: "customer@example.com",
              name: "John Doe",
              phone: "+14155551234",
            },
            calculated_statement_descriptor: "ACME CORP",
            captured: true,
            created: 1704067200,
            currency: "usd",
            customer: "cus_PQR789XYZ012",
            description: "Premium subscription - Annual plan",
            destination: null,
            dispute: null,
            disputed: false,
            failure_balance_transaction: null,
            failure_code: null,
            failure_message: null,
            fraud_details: {},
            invoice: null,
            livemode: false,
            metadata: {
              order_id: "ord_abc123xyz",
              user_id: "usr_456def789",
            },
            on_behalf_of: null,
            outcome: {
              network_status: "approved_by_network",
              reason: null,
              risk_level: "normal",
              risk_score: 32,
              seller_message: "Payment complete.",
              type: "authorized",
            },
            paid: true,
            payment_intent: "pi_3OQ4xJ2eZvKYlo2C0x7fGHYZ",
            payment_method: "pm_1OQ4xI2eZvKYlo2C9zAbCdEf",
            payment_method_details: {
              card: {
                amount_authorized: 2099,
                brand: "visa",
                checks: {
                  address_line1_check: "pass",
                  address_postal_code_check: "pass",
                  cvc_check: "pass",
                },
                country: "US",
                exp_month: 12,
                exp_year: 2027,
                extended_authorization: {
                  status: "disabled",
                },
                fingerprint: "AbCdEfGh12345678",
                funding: "credit",
                incremental_authorization: {
                  status: "unavailable",
                },
                installments: null,
                last4: "4242",
                mandate: null,
                multicapture: {
                  status: "unavailable",
                },
                network: "visa",
                network_token: {
                  used: false,
                },
                overcapture: {
                  maximum_amount_capturable: 2099,
                  status: "unavailable",
                },
                three_d_secure: null,
                wallet: null,
              },
              type: "card",
            },
            receipt_email: "customer@example.com",
            receipt_number: "2024-0001-5678",
            receipt_url:
              "https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFPUTR4SjJlWnZLWWxvMkMo",
            refunded: false,
            refunds: {
              object: "list",
              data: [],
              has_more: false,
              total_count: 0,
              url: "/v1/charges/ch_3OQ4xJ2eZvKYlo2C0x7fGHYZ/refunds",
            },
            review: null,
            shipping: {
              address: {
                city: "San Francisco",
                country: "US",
                line1: "123 Market Street",
                line2: "Suite 456",
                postal_code: "94103",
                state: "CA",
              },
              carrier: "USPS",
              name: "John Doe",
              phone: "+14155551234",
              tracking_number: "9400111899562537289457",
            },
            source: null,
            source_transfer: null,
            statement_descriptor: "ACME CORP",
            statement_descriptor_suffix: null,
            status: "succeeded",
            transfer_data: null,
            transfer_group: null,
          },
        ],
        has_more: false,
        total_count: 1,
        url: "/v1/charges?payment_intent=pi_3OQ4xJ2eZvKYlo2C0x7fGHYZ",
      },
    },
  },
];

function encodeToon(data) {
  // Basic Toon encoder - simplified implementation
  function encode(obj, indent = 0) {
    const ind = "  ".repeat(indent);

    if (obj === null) return "null";
    if (typeof obj === "boolean") return obj.toString();
    if (typeof obj === "number") return obj.toString();
    if (typeof obj === "string") return obj;

    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";

      // Check if uniform array
      if (
        obj.length > 0 &&
        obj.every(
          (item) =>
            typeof item === "object" && item !== null && !Array.isArray(item),
        )
      ) {
        const firstKeys = Object.keys(obj[0]).sort();
        const isUniform = obj.every((item) => {
          const keys = Object.keys(item).sort();
          return (
            keys.length === firstKeys.length &&
            keys.every((k, i) => k === firstKeys[i])
          );
        });

        if (isUniform) {
          let result = `items[${obj.length}]{${firstKeys.join(",")}}:\n`;
          obj.forEach((item) => {
            result +=
              ind +
              "  " +
              firstKeys.map((k) => encode(item[k], 0)).join(",") +
              "\n";
          });
          return result;
        }
      }

      // Non-uniform array
      let result = "[\n";
      obj.forEach((item, i) => {
        result += ind + "  " + encode(item, indent + 1);
        if (i < obj.length - 1) result += ",";
        result += "\n";
      });
      result += ind + "]";
      return result;
    }

    // Object
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";

    let result = "";
    keys.forEach((key, i) => {
      if (i > 0) result += "\n";
      result += ind + key + ": " + encode(obj[key], indent + 1);
    });
    return result;
  }

  return encode(data, 0);
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function runBenchmark(benchmark) {
  const jsonStr = JSON.stringify(benchmark.data);
  const compressor = new SmartCompressor({ indent: 1, useReferences: true });

  try {
    const ourCompressed = compressor.compress(benchmark.data);
    const toonCompressed = encodeToon(benchmark.data);

    const jsonTokens = estimateTokens(jsonStr);
    const ourTokens = estimateTokens(ourCompressed);
    const toonTokens = estimateTokens(toonCompressed);

    let roundTripOurs = false;
    try {
      const decompressed = compressor.decompress(ourCompressed);
      roundTripOurs = JSON.stringify(decompressed) === jsonStr;
    } catch (e) {
      roundTripOurs = false;
    }

    const scores = { ours: ourTokens, toon: toonTokens, json: jsonTokens };
    const winner = Object.keys(scores).reduce((a, b) =>
      scores[a] < scores[b] ? a : b,
    );

    return {
      name: benchmark.name,
      jsonTokens,
      ourTokens,
      toonTokens,
      ourReduction: (((jsonTokens - ourTokens) / jsonTokens) * 100).toFixed(1),
      toonReduction: (((jsonTokens - toonTokens) / jsonTokens) * 100).toFixed(
        1,
      ),
      roundTripOurs,
      roundTripToon: true,
      winner,
    };
  } catch (error) {
    console.error(`Error in benchmark ${benchmark.name}:`, error);
    return null;
  }
}

function createBenchmarkRow(result, benchmarkData, index) {
  const row = document.createElement("tr");
  row.className = "hover:bg-gray-50 transition-colors cursor-pointer";
  row.dataset.index = index;

  const ourReduction = parseFloat(result.ourReduction);
  const toonReduction = parseFloat(result.toonReduction);

  // Determine winner with subtle colors
  let winnerDisplay = "";
  let winnerBadgeClass = "";
  if (result.winner === "ours") {
    winnerDisplay = "ASON";
    winnerBadgeClass = "text-emerald-700 bg-emerald-50 border border-emerald-200";
  } else if (result.winner === "toon") {
    winnerDisplay = "Toon";
    winnerBadgeClass = "text-blue-700 bg-blue-50 border border-blue-200";
  } else {
    winnerDisplay = "JSON";
    winnerBadgeClass = "text-gray-600 bg-gray-50 border border-gray-200";
  }

  // Subtle color coding for reductions (Vercel/GitHub style)
  const ourColor = ourReduction > 0 ? "text-emerald-600" : "text-rose-600";
  const toonColor = toonReduction > 0 ? "text-emerald-600" : "text-rose-600";

  row.innerHTML = `
        <td class="px-4 py-3 font-medium text-gray-900">
            <div class="flex items-center gap-2">
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400 transition-transform toggle-icon-${index}"></i>
                ${result.name}
            </div>
        </td>
        <td class="px-4 py-3 text-center text-gray-600 font-mono">${result.jsonTokens}</td>
        <td class="px-4 py-3 text-center font-mono ${result.winner === "ours" ? "text-emerald-700 font-semibold" : "text-gray-700"}">${result.ourTokens}</td>
        <td class="px-4 py-3 text-center font-mono ${result.winner === "toon" ? "text-blue-700 font-semibold" : "text-gray-700"}">${result.toonTokens}</td>
        <td class="px-4 py-3 text-center">
            <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${winnerBadgeClass}">${winnerDisplay}</span>
        </td>
        <td class="px-4 py-3 text-center ${ourColor} font-medium font-mono text-sm">
            ${ourReduction > 0 ? "+" : ""}${ourReduction}%
        </td>
        <td class="px-4 py-3 text-center ${toonColor} font-medium font-mono text-sm">
            ${toonReduction > 0 ? "+" : ""}${toonReduction}%
        </td>
    `;

  // Create expandable row with data
  const expandRow = document.createElement("tr");
  expandRow.className = "hidden expandable-row bg-gray-50";
  expandRow.dataset.index = index;
  expandRow.innerHTML = `
        <td colspan="7" class="px-4 py-0">
            <div class="py-3 border-t border-gray-200">
                <div class="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <i data-lucide="database" class="w-3.5 h-3.5"></i>
                    Sample Data Used
                </div>
                <pre class="text-xs font-mono overflow-auto max-h-96 bg-white border border-gray-200 rounded p-3 text-gray-800">${JSON.stringify(benchmarkData, null, 2)}</pre>
            </div>
        </td>
    `;

  return { row, expandRow };
}

function createOldBenchmarkCard(result, benchmarkData) {
  const card = document.createElement("div");
  const isWinner = result.winner === "ours";
  card.className = `border border-gray-200 rounded-lg overflow-hidden ${isWinner ? "ring-2 ring-gray-900" : ""}`;

  const ourReduction = parseFloat(result.ourReduction);
  const toonReduction = parseFloat(result.toonReduction);

  // Green for reduction (good), red for increase (bad)
  const ourColor = ourReduction > 0 ? "text-green-600" : "text-red-600";
  const toonColor = toonReduction > 0 ? "text-green-600" : "text-red-600";

  const cardId = `benchmark-${result.name.replace(/\s+/g, "-").toLowerCase()}`;
  const dataId = `data-${cardId}`;

  card.innerHTML = `
        <div class="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div class="font-medium text-sm">${result.name}</div>
            ${isWinner ? '<div class="text-xs px-2 py-0.5 bg-gray-900 text-white rounded">Ganador</div>' : ""}
        </div>

        <div class="p-4">
            <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="text-center p-3 bg-gray-50 rounded">
                    <div class="text-xs text-gray-600 mb-1">JSON</div>
                    <div class="text-lg font-semibold">${result.jsonTokens}</div>
                </div>
                <div class="text-center p-3 bg-gray-50 rounded">
                    <div class="text-xs text-gray-600 mb-1">ASON</div>
                    <div class="text-lg font-semibold">${result.ourTokens}</div>
                    <div class="text-xs ${ourColor} font-medium">${ourReduction > 0 ? "-" : "+"}${Math.abs(ourReduction)}%</div>
                </div>
                <div class="text-center p-3 bg-gray-50 rounded">
                    <div class="text-xs text-gray-600 mb-1">Toon</div>
                    <div class="text-lg font-semibold">${result.toonTokens}</div>
                    <div class="text-xs ${toonColor} font-medium">${toonReduction > 0 ? "-" : "+"}${Math.abs(toonReduction)}%</div>
                </div>
            </div>

            <div class="h-2 flex gap-1 rounded-lg overflow-hidden mb-4 bg-gray-100">
                <div class="bg-blue-500" style="width: ${((result.ourTokens / result.jsonTokens) * 100).toFixed(1)}%"></div>
                <div class="bg-gray-300" style="width: ${((result.toonTokens / result.jsonTokens) * 100).toFixed(1)}%"></div>
            </div>

            <button
                id="${cardId}"
                class="w-full px-3 py-2 text-xs text-left border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-between"
            >
                <div class="flex items-center gap-2">
                    <i data-lucide="code" class="w-3.5 h-3.5"></i>
                    <span>Ver datos de prueba</span>
                </div>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 toggle-icon"></i>
            </button>
            <div id="${dataId}" class="hidden mt-2 border border-gray-200 rounded overflow-hidden">
                <pre class="p-3 text-xs font-mono overflow-auto max-h-64 bg-gray-50">${JSON.stringify(benchmarkData, null, 2)}</pre>
            </div>
        </div>


    `;

  return card;
}

function updateSummary(results) {
  const validResults = results.filter((r) => r !== null);
  const ourWins = validResults.filter((r) => r.winner === "ours").length;

  const avgReduction = (
    validResults.reduce((sum, r) => sum + parseFloat(r.ourReduction), 0) /
    validResults.length
  ).toFixed(1);

  const avgToonReduction = (
    validResults.reduce((sum, r) => sum + parseFloat(r.toonReduction), 0) /
    validResults.length
  ).toFixed(1);

  const vsToon = (
    parseFloat(avgReduction) - parseFloat(avgToonReduction)
  ).toFixed(1);

  // Update summary cards with subtle Vercel/GitHub colors
  document.getElementById("asonWins").textContent = `${ourWins}`;

  const avgReductionEl = document.getElementById("avgReduction");
  avgReductionEl.textContent = `${avgReduction > 0 ? "+" : ""}${avgReduction}%`;
  avgReductionEl.className = `text-3xl font-semibold ${avgReduction > 0 ? "text-emerald-600" : "text-rose-600"}`;

  const vsToonEl = document.getElementById("vsToon");
  vsToonEl.textContent = `${vsToon > 0 ? "+" : ""}${vsToon}%`;
  vsToonEl.className = `text-3xl font-semibold ${vsToon > 0 ? "text-emerald-600" : "text-rose-600"}`;

  // Update summary text
  document.getElementById("summaryWins").textContent =
    `ASON wins ${ourWins} out of ${validResults.length}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("benchmarksTable");
  const results = benchmarks.map(runBenchmark);

  // Populate table
  results.forEach((result, index) => {
    if (result) {
      const { row, expandRow } = createBenchmarkRow(result, benchmarks[index].data, index);
      tableBody.appendChild(row);
      tableBody.appendChild(expandRow);

      // Add click handler for expand/collapse
      row.addEventListener("click", () => {
        const icon = row.querySelector(`.toggle-icon-${index}`);
        const isHidden = expandRow.classList.contains("hidden");

        expandRow.classList.toggle("hidden");

        if (icon) {
          icon.style.transform = isHidden ? "rotate(90deg)" : "rotate(0deg)";
        }

        // Reinitialize lucide icons for the newly shown expandRow
        if (isHidden) {
          setTimeout(() => lucide.createIcons(), 10);
        }
      });
    }
  });

  // Update summary
  updateSummary(results);

  // Initialize lucide icons
  lucide.createIcons();
});

// Old implementation kept for reference
function oldDOMContentLoaded() {
  const container = document.getElementById("benchmarksContainer");
  const results = benchmarks.map(runBenchmark);

  results.forEach((result, index) => {
    if (result) {
      const card = createOldBenchmarkCard(result, benchmarks[index].data);
      container.appendChild(card);

      // Setup toggle for this card's data
      const cardId = `benchmark-${result.name.replace(/\s+/g, "-").toLowerCase()}`;
      const dataId = `data-${cardId}`;
      const toggleBtn = document.getElementById(cardId);
      const dataContainer = document.getElementById(dataId);

      if (toggleBtn && dataContainer) {
        toggleBtn.addEventListener("click", () => {
          dataContainer.classList.toggle("hidden");
          const icon = toggleBtn.querySelector(".toggle-icon");
          if (icon) {
            icon.style.transform = dataContainer.classList.contains("hidden")
              ? "rotate(0deg)"
              : "rotate(180deg)";
          }
        });
      }
    }
  });

  updateSummary(results);
  setTimeout(() => lucide.createIcons(), 100);
}
