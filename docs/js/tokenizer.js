// Import ASON library
import { SmartCompressor } from './ason.js';

const compressor = new SmartCompressor();

// GPT Tokenizer is loaded via CDN
// Check if gpt-tokenizer is available
function isTokenizerAvailable() {
    return typeof GptTokenizer !== 'undefined';
}

// Tokenize text using real GPT tokenizer
function tokenizeText(text) {
    if (!isTokenizerAvailable()) {
        // Fallback: simple word-based tokenization
        return text.split(/(\s+|[{}[\]:,"'])/g).filter(t => t);
    }

    try {
        const tokens = GptTokenizer.encode(text);
        const decoded = tokens.map(token => GptTokenizer.decode([token]));
        return decoded;
    } catch (error) {
        console.error('Tokenization error:', error);
        return text.split(/(\s+|[{}[\]:,"'])/g).filter(t => t);
    }
}

// Count tokens (real count)
function estimateTokens(text) {
    if (!isTokenizerAvailable()) {
        return Math.ceil(text.length / 4); // Fallback estimate
    }

    try {
        return GptTokenizer.encode(text).length;
    } catch (error) {
        return Math.ceil(text.length / 4);
    }
}

// Highlight tokens with different colors
function highlightTokens(text) {
    const tokens = tokenizeText(text);

    return tokens.map((token, index) => {
        // Escape HTML
        let escaped = token
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Handle newlines
        if (token === '\n' || token.trim() === '') {
            return escaped.replace(/\n/g, '<br/>');
        }

        // Assign a color class (cycle through 16 colors)
        const colorClass = `token-${index % 16}`;

        return `<span class="token ${colorClass}">${escaped}</span>`;
    }).join('');
}

// Preset datasets
const DATASETS = {
    'small-simple': [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 }
    ],
    'small-nested': [
        {
            id: 1,
            customer: { name: 'Alice', email: 'alice@example.com' },
            items: [
                { product: 'Laptop', price: 999 },
                { product: 'Mouse', price: 29 }
            ]
        },
        {
            id: 2,
            customer: { name: 'Bob', email: 'bob@example.com' },
            items: [
                { product: 'Keyboard', price: 79 }
            ]
        }
    ],
    'medium-users': Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'][i],
        email: `user${i + 1}@example.com`,
        age: 20 + Math.floor(Math.random() * 40),
        city: ['NYC', 'LA', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)]
    })),
    'large-complex': {
        object: 'payment_intent',
        id: 'pi_3OQ4xJ2eZvKYlo2C0x7fGHYZ',
        amount: 2099,
        amount_capturable: 0,
        amount_received: 2099,
        currency: 'usd',
        customer: 'cus_PQR789XYZ012',
        description: 'Premium subscription - Annual plan',
        metadata: {
            order_id: 'ord_abc123xyz',
            user_id: 'usr_456def789',
            plan_type: 'annual'
        },
        shipping: {
            address: {
                city: 'San Francisco',
                country: 'US',
                line1: '123 Market Street',
                postal_code: '94103',
                state: 'CA'
            },
            name: 'John Doe',
            phone: '+14155551234'
        },
        status: 'succeeded'
    }
};

// Convert JSON to different formats
function convertToFormats(data) {
    const formats = {};

    // Pretty JSON
    formats['pretty-json'] = JSON.stringify(data, null, 2);

    // Compressed JSON
    formats['json'] = JSON.stringify(data);

    // YAML (using js-yaml library if available)
    try {
        if (typeof jsyaml !== 'undefined') {
            formats['yaml'] = jsyaml.dump(data, { indent: 2, lineWidth: -1 });
        } else {
            formats['yaml'] = jsonToYaml(data);
        }
    } catch (e) {
        formats['yaml'] = jsonToYaml(data);
    }

    // TOON (using @toon-format/toon if available)
    try {
        if (typeof Toon !== 'undefined' && typeof Toon.stringify === 'function') {
            formats['toon'] = Toon.stringify(data);
        } else {
            formats['toon'] = jsonToToon(data);
        }
    } catch (e) {
        formats['toon'] = jsonToToon(data);
    }

    // ASON
    try {
        formats['ason'] = compressor.compress(data);
    } catch (e) {
        formats['ason'] = `Error: ${e.message}`;
    }

    // CSV (only for flat arrays)
    formats['csv'] = jsonToCsv(data);

    return formats;
}

// Simple JSON to YAML converter
function jsonToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);

    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'object' && item !== null) {
                return `${spaces}- ${jsonToYaml(item, indent + 1).trim()}`;
            }
            return `${spaces}- ${item}`;
        }).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    return `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
                }
                return `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
            }
            return `${spaces}${key}: ${value}`;
        }).join('\n');
    }

    return `${spaces}${obj}`;
}

// Simple JSON to TOON converter (for uniform arrays)
function jsonToToon(data) {
    if (!Array.isArray(data)) {
        return 'N/A (not an array)';
    }

    if (data.length === 0) {
        return 'N/A (empty array)';
    }

    // Get first object keys
    const firstObj = data[0];
    if (typeof firstObj !== 'object' || firstObj === null) {
        return 'N/A (not objects)';
    }

    const firstKeys = Object.keys(firstObj);

    // Check if all objects have the same keys (uniform)
    const isUniform = data.every(obj => {
        if (typeof obj !== 'object' || obj === null) return false;
        const keys = Object.keys(obj);
        return keys.length === firstKeys.length &&
               keys.every(key => firstKeys.includes(key));
    });

    if (!isUniform) {
        return 'N/A (non-uniform)';
    }

    // Check for nested objects
    const hasNested = data.some(obj =>
        Object.values(obj).some(val => typeof val === 'object' && val !== null)
    );

    if (hasNested) {
        return 'N/A (nested objects)';
    }

    // Generate TOON format: [count]{key1,key2,...}:\n  val1,val2,...
    let toon = `[${data.length}]{${firstKeys.join(',')}}:\n`;
    data.forEach(obj => {
        const values = firstKeys.map(key => {
            const val = obj[key];
            // Quote strings with commas or spaces
            if (typeof val === 'string' && (val.includes(',') || val.includes(' '))) {
                return `"${val}"`;
            }
            return val;
        });
        toon += `  ${values.join(',')}\n`;
    });

    return toon.trim();
}

// Simple JSON to CSV converter
function jsonToCsv(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return 'N/A (not an array)';
    }

    if (data.length === 0) {
        return 'N/A (empty array)';
    }

    // Get all unique keys from all objects
    const allKeys = new Set();
    data.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => allKeys.add(key));
        }
    });

    const keys = Array.from(allKeys);

    // Check if data can be represented as CSV (only primitives)
    const hasNestedData = data.some(obj => {
        if (typeof obj !== 'object' || obj === null) return true;
        return Object.values(obj).some(val =>
            typeof val === 'object' && val !== null
        );
    });

    if (hasNestedData) {
        return 'N/A (nested objects)';
    }

    // Generate CSV
    let csv = keys.join(',') + '\n';
    data.forEach(obj => {
        const row = keys.map(key => {
            const val = obj[key];
            if (val === null || val === undefined) return '';
            // Quote values that contain commas
            if (String(val).includes(',')) {
                return `"${val}"`;
            }
            return val;
        });
        csv += row.join(',') + '\n';
    });

    return csv.trim();
}

// Calculate token counts for all formats
function calculateTokenCounts(formats) {
    const counts = {};
    Object.entries(formats).forEach(([format, text]) => {
        counts[format] = {
            tokens: estimateTokens(text),
            text: text
        };
    });
    return counts;
}

// Render format cards
function renderFormatCards(counts, baseline) {
    const formatCards = document.getElementById('formatCards');
    const baselineTokens = counts[baseline].tokens;

    const formatNames = {
        'pretty-json': 'Pretty JSON',
        'json': 'JSON',
        'yaml': 'YAML',
        'toon': 'TOON',
        'ason': 'ASON',
        'csv': 'CSV'
    };

    formatCards.innerHTML = Object.entries(counts).map(([format, data]) => {
        const tokens = data.tokens;
        const percentage = baseline === format ? 0 :
            ((tokens - baselineTokens) / baselineTokens * 100).toFixed(1);
        const percentageText = baseline === format
            ? '<span class="text-xs text-gray-500">baseline</span>'
            : `<span class="text-xs font-medium ${percentage < 0 ? 'text-green-600' : 'text-red-600'}">${percentage}%</span>`;

        const highlighted = highlightTokens(data.text);

        return `
            <div class="border rounded-lg overflow-hidden">
                <div class="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                    <h3 class="text-sm font-medium">${formatNames[format]}</h3>
                    <div class="flex items-baseline gap-2">
                        <span class="text-lg font-semibold">${tokens}</span>
                        <span class="text-xs text-gray-600">tokens</span>
                        ${percentageText}
                    </div>
                </div>
                <div class="p-3 bg-gray-50 overflow-x-auto" style="max-height: 300px; font-size: 12px;">
                    <div class="format-output">${highlighted}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render comparison table with all datasets
function renderComparisonTable(baselineFormat) {
    const table = document.getElementById('comparisonTable');

    const datasetLabels = {
        'small-simple': 'small-simple (uniform-flat)',
        'small-nested': 'small-simple (uniform-nested)',
        'medium-users': 'medium-complex (non-uniform-flat)',
        'large-complex': 'large-complex (stripe payment)'
    };

    const rows = Object.entries(DATASETS).map(([datasetName, data]) => {
        const formats = convertToFormats(data);
        const counts = calculateTokenCounts(formats);
        const baselineTokens = counts[baselineFormat].tokens;

        const formatNames = ['pretty-json', 'json', 'yaml', 'toon', 'ason', 'csv'];

        const cells = formatNames.map(format => {
            const tokens = counts[format].tokens;
            const percentage = format === baselineFormat ? 0 :
                ((tokens - baselineTokens) / baselineTokens * 100).toFixed(1);

            const isBaseline = format === baselineFormat;
            const isAson = format === 'ason';
            const color = isBaseline ? 'text-gray-600' :
                percentage < 0 ? 'text-green-600' : 'text-red-600';
            const bgColor = isAson ? 'bg-teal-50' : '';

            return `
                <td class="text-center px-3 py-2 ${bgColor}">
                    <div class="font-medium text-gray-900 text-xs">${tokens}</div>
                    ${!isBaseline ? `<div class="text-xs ${color}">${percentage > 0 ? '+' : ''}${percentage}%</div>` : '<div class="text-xs text-gray-500">baseline</div>'}
                </td>
            `;
        }).join('');

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-3 py-2 font-medium text-gray-700 text-xs">${datasetLabels[datasetName]}</td>
                ${cells}
            </tr>
        `;
    }).join('');

    table.innerHTML = rows;
}

// Initialize
function init() {
    // Log available libraries
    console.log('Libraries loaded:');
    console.log('- GptTokenizer:', isTokenizerAvailable() ? '✓' : '✗');
    console.log('- Toon:', typeof Toon !== 'undefined' ? '✓' : '✗');
    console.log('- js-yaml:', typeof jsyaml !== 'undefined' ? '✓' : '✗');
    console.log('- ASON:', typeof SmartCompressor !== 'undefined' ? '✓' : '✗');

    const datasetSelect = document.getElementById('datasetSelect');
    const baselineSelect = document.getElementById('baselineSelect');
    const tableBaselineSelect = document.getElementById('tableBaselineSelect');
    const presetTab = document.getElementById('presetTab');
    const customTab = document.getElementById('customTab');
    const presetSection = document.getElementById('presetSection');
    const customSection = document.getElementById('customSection');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const customData = document.getElementById('customData');

    // Tab switching
    presetTab.addEventListener('click', () => {
        presetTab.classList.add('active');
        customTab.classList.remove('active');
        presetSection.classList.remove('hidden');
        customSection.classList.add('hidden');
    });

    customTab.addEventListener('click', () => {
        customTab.classList.add('active');
        presetTab.classList.remove('active');
        customSection.classList.remove('hidden');
        presetSection.classList.add('hidden');
    });

    // Update visualization
    function updateViz() {
        const dataset = DATASETS[datasetSelect.value];
        const formats = convertToFormats(dataset);
        const counts = calculateTokenCounts(formats);
        renderFormatCards(counts, baselineSelect.value);
    }

    // Analyze custom data
    analyzeBtn.addEventListener('click', () => {
        try {
            const data = JSON.parse(customData.value);
            const formats = convertToFormats(data);
            const counts = calculateTokenCounts(formats);
            renderFormatCards(counts, baselineSelect.value);
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
        }
    });

    datasetSelect.addEventListener('change', updateViz);
    baselineSelect.addEventListener('change', updateViz);
    tableBaselineSelect.addEventListener('change', () => {
        renderComparisonTable(tableBaselineSelect.value);
    });

    // Initial render
    updateViz();
    renderComparisonTable('pretty-json');
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
