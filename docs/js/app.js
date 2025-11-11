import { SmartCompressor } from "./compressor.js";

// DOM elements - Mode tabs
const compressModeTab = document.getElementById("compressModeTab");
const decompressModeTab = document.getElementById("decompressModeTab");
const compressMode = document.getElementById("compressMode");
const decompressMode = document.getElementById("decompressMode");

// DOM elements - Compress mode
const compressInput = document.getElementById("compressInput");
const compressOutput = document.getElementById("compressOutput");
const compressBtn = document.getElementById("compressBtn");
const copyCompressed = document.getElementById("copyCompressed");
const loadExample = document.getElementById("loadExample");
const compressStats = document.getElementById("compressStats");

// DOM elements - Decompress mode
const decompressInput = document.getElementById("decompressInput");
const decompressOutput = document.getElementById("decompressOutput");
const decompressBtn = document.getElementById("decompressBtn");
const copyDecompressed = document.getElementById("copyDecompressed");

// Global tooltip
const globalTooltip = document.getElementById("globalTooltip");
let tooltipTimeout;

// Compressor instance
let compressor = new SmartCompressor({ indent: 1, useReferences: true });
let lastCompressedRaw = "";

// Example data - Matches Stripe benchmark
const exampleData = {
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
};

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Mode switching
function switchToCompressMode() {
  compressModeTab.classList.add("active");
  decompressModeTab.classList.remove("active");
  compressMode.classList.remove("hidden");
  decompressMode.classList.add("hidden");
  lucide.createIcons();
}

function switchToDecompressMode() {
  decompressModeTab.classList.add("active");
  compressModeTab.classList.remove("active");
  decompressMode.classList.remove("hidden");
  compressMode.classList.add("hidden");

  // Pre-fill with last compressed output if available
  if (lastCompressedRaw) {
    decompressInput.value = lastCompressedRaw;
  }

  lucide.createIcons();
}

// Global tooltip management
function showTooltip(element, text) {
  clearTimeout(tooltipTimeout);

  const rect = element.getBoundingClientRect();

  globalTooltip.textContent = text;
  globalTooltip.style.left = rect.left + rect.width / 2 + "px";
  globalTooltip.style.top = rect.top - 10 + "px";
  globalTooltip.style.transform = "translate(-50%, -100%)";

  tooltipTimeout = setTimeout(() => {
    globalTooltip.classList.add("show");
  }, 50);
}

function hideTooltip() {
  clearTimeout(tooltipTimeout);
  globalTooltip.classList.remove("show");
}

// Interactive visualization
function createInteractiveOutput(compressed) {
  const lines = compressed.split("\n");
  const container = document.createElement("div");

  lines.forEach((line, idx) => {
    const lineDiv = document.createElement("div");
    let processed = false;

    // Schema line
    if (line.startsWith("$schema:")) {
      const parts = line.split(":");
      lineDiv.innerHTML =
        `<span class="hover-part text-purple-600" data-tooltip="Format version">$schema</span>:` +
        `<span class="hover-part text-blue-600" data-tooltip="Version number">${parts[1]}</span>`;
      processed = true;
    }
    // Data marker
    else if (line.startsWith("$data:")) {
      lineDiv.innerHTML = `<span class="hover-part text-purple-600" data-tooltip="Start of compressed data">$data:</span>`;
      processed = true;
    }
    // Uniform array with [N]@keys pattern
    else if (line.match(/^(\s*)(\w+)\[(\d+)\]@(.+):$/)) {
      const match = line.match(/^(\s*)(\w+)\[(\d+)\]@(.+):$/);
      const indent = match[1];
      const key = match[2];
      const count = match[3];
      const keys = match[4];

      lineDiv.innerHTML =
        `${indent}<span class="hover-part text-green-600" data-tooltip="Array name">${key}</span>` +
        `<span class="hover-part text-orange-600" data-tooltip="Number of elements">[${count}]</span>` +
        `<span class="hover-part text-red-600" data-tooltip="Uniform array indicator">@</span>` +
        `<span class="hover-part text-blue-600" data-tooltip="Common object keys">${keys}</span>:`;
      processed = true;
    }

    if (!processed) {
      // Process inline patterns in any line
      let html = line;

      // Object reference &obj0
      if (html.includes("&obj")) {
        html = html.replace(
          /(&obj\d+)/g,
          `<span class="hover-part text-purple-600" data-tooltip="Reference to defined object">$1</span>`,
        );
        processed = true;
      }

      // Only highlight keys at the start of a line (after whitespace)
      // This avoids false positives with dates like "2025-01-10T10:30:00Z"
      if (html.match(/^\s+\w+:/)) {
        html = html.replace(
          /^(\s+)(\w+):/,
          `$1<span class="hover-part text-green-600" data-tooltip="Object key">$2</span>:`,
        );
        processed = true;
      }

      // Arrays at start of line (with optional indent)
      if (html.match(/^\s*\[.*\]$/)) {
        html = html.replace(
          /^(\s*)(\[.*?\])$/,
          `$1<span class="hover-part text-cyan-600" data-tooltip="Value array">$2</span>`,
        );
        processed = true;
      }

      if (processed) {
        lineDiv.innerHTML = html;
      } else {
        lineDiv.textContent = line;
      }
    }

    container.appendChild(lineDiv);
  });

  // Add event listeners to all hover parts
  container.querySelectorAll(".hover-part").forEach((part) => {
    part.addEventListener("mouseenter", (e) => {
      const tooltip = e.target.getAttribute("data-tooltip");
      if (tooltip) {
        showTooltip(e.target, tooltip);
      }
    });
    part.addEventListener("mouseleave", hideTooltip);
  });

  return container;
}

function compress() {
  try {
    const input = compressInput.value.trim();
    if (!input) {
      alert("Please enter a valid JSON");
      return;
    }

    const data = JSON.parse(input);
    const compressed = compressor.compress(data);
    lastCompressedRaw = compressed;

    // Create interactive visualization
    compressOutput.innerHTML = "";
    compressOutput.appendChild(createInteractiveOutput(compressed));

    // Update stats
    const originalTokens = estimateTokens(input);
    const compressedTokens = estimateTokens(compressed);
    const reduction = (
      ((originalTokens - compressedTokens) / originalTokens) *
      100
    ).toFixed(1);

    document.getElementById("compressOriginalTokens").textContent =
      originalTokens;
    document.getElementById("compressCompressedTokens").textContent =
      compressedTokens;
    document.getElementById("compressReduction").textContent = reduction + "%";
    document.getElementById("compressReduction").className =
      `font-semibold ${parseFloat(reduction) > 0 ? "text-green-600" : "text-red-600"}`;

    compressStats.classList.remove("hidden");
  } catch (error) {
    alert("Error compressing: " + error.message);
    console.error(error);
  }
}

function decompress() {
  try {
    const input = decompressInput.value.trim();
    if (!input) {
      alert("Please enter a compressed format");
      return;
    }

    const decompressed = compressor.decompress(input);
    const prettyJson = JSON.stringify(decompressed, null, 2);

    decompressOutput.value = prettyJson;
  } catch (error) {
    alert("Error decompressing: " + error.message);
    console.error(error);
  }
}

function copyToClipboard(text, button) {
  if (!text) {
    alert("Nothing to copy");
    return;
  }

  // Fallback for environments without clipboard API
  if (!navigator.clipboard) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      const originalHTML = button.innerHTML;
      button.innerHTML =
        '<i data-lucide="check" class="w-3.5 h-3.5"></i> Copied';
      lucide.createIcons();
      setTimeout(() => {
        button.innerHTML = originalHTML;
        lucide.createIcons();
      }, 2000);
    } catch (err) {
      alert("Error copying: " + err.message);
    }
    document.body.removeChild(textarea);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalHTML = button.innerHTML;
      button.innerHTML =
        '<i data-lucide="check" class="w-3.5 h-3.5"></i> Copied';
      lucide.createIcons();
      setTimeout(() => {
        button.innerHTML = originalHTML;
        lucide.createIcons();
      }, 2000);
    })
    .catch((err) => {
      alert("Error copying: " + err.message);
    });
}

function loadExampleData() {
  compressInput.value = JSON.stringify(exampleData, null, 2);
}

// Event listeners - Mode tabs
compressModeTab.addEventListener("click", switchToCompressMode);
decompressModeTab.addEventListener("click", switchToDecompressMode);

// Event listeners - Compress mode
compressBtn.addEventListener("click", compress);
copyCompressed.addEventListener("click", () => {
  copyToClipboard(lastCompressedRaw, copyCompressed);
});
loadExample.addEventListener("click", loadExampleData);

// Event listeners - Decompress mode
decompressBtn.addEventListener("click", decompress);
copyDecompressed.addEventListener("click", () => {
  copyToClipboard(decompressOutput.value, copyDecompressed);
});

// Allow Ctrl+Enter to compress/decompress
compressInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    compress();
  }
});

decompressInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    decompress();
  }
});
