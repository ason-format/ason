// TOON Format Library Wrapper
// Wraps the ES module to expose it globally as window.Toon

import { encode, decode } from './toon.js';

// Expose globally
window.Toon = {
    stringify: encode,
    parse: decode,
    encode,
    decode
};

console.log('TOON library loaded');
