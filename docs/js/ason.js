var O=class{constructor(t={}){this.indent=t.indent!==void 0?Math.max(1,t.indent):1,this.delimiter=t.delimiter||",",this.useReferences=t.useReferences!==void 0?t.useReferences:true,this.useDictionary=t.useDictionary!==void 0?t.useDictionary:true,this.structureRefs=new Map,this.objectAliases=new Map,this.valueDictionary=new Map,this.valueFirstOccurrence=new Map,this.refCounter=0,this.aliasCounter=0,this.dictCounter=0;}compress(t){this.structureRefs.clear(),this.objectAliases.clear(),this.valueDictionary.clear(),this.valueFirstOccurrence.clear(),this.refCounter=0,this.aliasCounter=0,this.dictCounter=0,this.useReferences&&(this._autoDetectPatterns(t),this._detectRepeatedObjects(t),this.useDictionary&&this._detectFrequentValues(t));let s="",n=this.structureRefs.size>0||this.objectAliases.size>0;if(n){s+=`$def:
`;for(let[r,l]of this.structureRefs.entries())s+=this._sp(1)+`${l.name}:@${l.keys.join(this.delimiter)}
`;let e=this.objectAliases;this.objectAliases=new Map;for(let[r,l]of e.entries()){let p=JSON.parse(r),c=this._serialize(p,2);s+=this._sp(1)+`${l}:${c}
`;}this.objectAliases=e,s+=`$data:
`;}let i=this._serialize(t,n?1:0);return s+i.replace(/^\n/,"").replace(/\n+$/,"")}_autoDetectPatterns(t,s=[],n=new Map){if(Array.isArray(t)&&this._isUniformObjects(t)&&t.length>0){let{keys:i}=this._getMostCommonKeys(t),e=i.join("|");n.has(e)||n.set(e,{keys:i,count:0}),n.get(e).count++;for(let r of t)for(let l of i)this._autoDetectPatterns(r[l],[...s,l],n);}else if(Array.isArray(t))t.forEach((i,e)=>this._autoDetectPatterns(i,[...s,e],n));else if(t&&typeof t=="object")for(let[i,e]of Object.entries(t))this._autoDetectPatterns(e,[...s,i],n);if(s.length===0)for(let[i,e]of n.entries())e.count>=3&&this.structureRefs.set(i,{name:`$${this.refCounter++}`,keys:e.keys,count:e.count});return n}_detectFrequentValues(t,s=new Map,n=true){if(Array.isArray(t))t.forEach(i=>this._detectFrequentValues(i,s,false));else if(t&&typeof t=="object")for(let i of Object.values(t))typeof i=="string"&&i.length>=5&&s.set(i,(s.get(i)||0)+1),this._detectFrequentValues(i,s,false);if(n&&s.size>0){let i=[];for(let[e,r]of s.entries())if(r>=2){let p=e.length*r,c=e.length+3+2*(r-1),a=p-c;a>0&&i.push({value:e,count:r,savings:a});}i.sort((e,r)=>r.savings-e.savings);for(let{value:e}of i)this.valueDictionary.set(e,`#${this.dictCounter++}`);}}_detectRepeatedObjects(t,s=new Map){if(Array.isArray(t))t.forEach(n=>this._detectRepeatedObjects(n,s));else if(t&&typeof t=="object"){let n=Object.keys(t);if(n.length>0&&n.length<=3&&!n.some(e=>{let r=t[e];return Array.isArray(r)?r.length>0:r&&typeof r=="object"?Object.keys(r).length>0:false})){let e=JSON.stringify(t);s.set(e,(s.get(e)||0)+1);}for(let i of Object.values(t))this._detectRepeatedObjects(i,s);}if(s.size>0&&this.objectAliases.size===0)for(let[n,i]of s.entries())i>=2&&this.objectAliases.set(n,`&obj${this.aliasCounter++}`);}decompress(t){var p;let s=t.split(`
`),n=new Map,i=new Map,e=new Map,r=0;if(((p=s[0])==null?void 0:p.trim())==="$def:"){let c=1;for(;c<s.length&&s[c].trim()!=="$data:";){let a=s[c],o=a.length-a.trimStart().length,u=a.trim(),f=u.indexOf(":");if(f>0){let h=u.slice(0,f).trim(),d=u.slice(f+1).trim();if(d.startsWith("@")){let y=d.slice(1).split(this.delimiter);n.set(h,y),c++;}else if(h.startsWith("#")){let y=d.startsWith('"')?JSON.parse(d):d;e.set(h,y),c++;}else if(h.startsWith("&obj"))if(d===""){c++;let y=[];for(;c<s.length&&s[c].trim()!=="$data:"&&s[c].length-s[c].trimStart().length>o;)y.push(s[c]),c++;let g=this._parseLines(y,0);i.set(h,g);}else {let y=this._parseVal(d);i.set(h,y),c++;}else c++;}else c++;}r=c+1;}return this.structureDefs=n,this.parsedAliases=i,this.parsedValueDict=e,this._parseLines(s,r)}_sp(t){return this.indent===0?"":" ".repeat(this.indent*t)}_serialize(t,s){let n=this._sp(s);if(t==null)return "null";if(typeof t=="boolean")return t?"true":"false";if(typeof t=="number")return String(t);if(typeof t=="string"){let i=this.valueDictionary.get(t);return i&&this.useDictionary?this.valueFirstOccurrence.has(t)?i:(this.valueFirstOccurrence.set(t,true),/[\n\r\t]/.test(t)||t===""||t==="null"||t==="true"||t==="false"||/^-?\d+\.?\d*$/.test(t)?`${JSON.stringify(t)} ${i}`:`${t} ${i}`):/[\n\r\t]/.test(t)||t===""||t==="null"||t==="true"||t==="false"||/^-?\d+\.?\d*$/.test(t)?JSON.stringify(t):t}if(Array.isArray(t)){if(t.length===0)return "[]";if(this._isUniformObjects(t)){let{keys:e}=this._getMostCommonKeys(t),r=e.join("|"),l=this.structureRefs.get(r);if(t.every(a=>e.every(o=>{let u=a[o];return u===null||typeof u!="object"}))&&t.every(o=>Object.keys(o).every(f=>e.includes(f)))){let o=l?`$${l.name}`:`@${e.join(this.delimiter)}`,u=`[${t.length}]${o}
`;for(let f of t){let h=e.map(d=>this._escVal(f[d]));u+=n+h.join(this.delimiter)+`
`;}return u.trimEnd()}let c=`
`;for(let a of t){c+=n+`- 
`;for(let o of Object.keys(a)){let u=a[o],f=this._serialize(u,s+2);f.startsWith(`
`)?c+=this._sp(s+1)+o+":"+f+`
`:c+=this._sp(s+1)+o+":"+f+`
`;}}return c.trimEnd()}if(t.every(e=>e===null||typeof e!="object"))return `[${t.map(r=>this._escVal(r)).join(this.delimiter)}]`;let i=`
`;for(let e of t)i+=n+"- "+this._serialize(e,s+1).trim()+`
`;return i.trimEnd()}if(typeof t=="object"){if(Object.keys(t).length===0)return "{}";let i=JSON.stringify(t),e=this.objectAliases.get(i);if(e)return e;let r=s===0?"":`
`;for(let[l,p]of Object.entries(t)){let c=l,a=p;for(;a&&typeof a=="object"&&!Array.isArray(a)&&Object.keys(a).length===1&&!this.objectAliases.has(JSON.stringify(a));){let f=Object.keys(a)[0];c+="."+f,a=a[f];}let o=/[\n\r\t]/.test(c)?JSON.stringify(c):c,u=this._serialize(a,s+1);if(u.startsWith(`
`))r+=n+o+":"+u+`
`;else if(u.includes(`
`))r+=n+o+":"+u+`
`;else {let h=/[\n\r\t]/.test(u)?JSON.stringify(u):u;r+=n+o+":"+h+`
`;}}return r.trimEnd()}return String(t)}_escVal(t){if(t===null)return "null";if(typeof t=="boolean")return t?"true":"false";if(typeof t=="number")return String(t);if(typeof t=="string"){let s=this.valueDictionary.get(t);return s&&this.useDictionary?this.valueFirstOccurrence.has(t)?s:(this.valueFirstOccurrence.set(t,true),new RegExp(`[${this.delimiter}\\n\\r\\t]`).test(t)||t===""||t==="null"||t==="true"||t==="false"||/^-?\d+\.?\d*$/.test(t)?`${JSON.stringify(t)} ${s}`:`${t} ${s}`):new RegExp(`[${this.delimiter}\\n\\r\\t"]`).test(t)||t===""||t==="null"||t==="true"||t==="false"||/^-?\d+\.?\d*$/.test(t)?JSON.stringify(t):t}if(typeof t=="object"){let s=this._serialize(t,0).trim();return s.includes(`
`)?JSON.stringify(t):s}return JSON.stringify(t)}_deepMerge(t,s){for(let n in s)s[n]&&typeof s[n]=="object"&&!Array.isArray(s[n])?(t[n]||(t[n]={}),this._deepMerge(t[n],s[n])):t[n]=s[n];}_getMostCommonKeys(t){let s=new Map,n=new Map;for(let r of t){let l=Object.keys(r),p=l.slice().sort().join("|");s.set(p,(s.get(p)||0)+1),n.has(p)||n.set(p,l);}let i="",e=0;for(let[r,l]of s.entries())l>e&&(e=l,i=r);return {keys:n.get(i)||[],uniformity:e/t.length}}_isUniformObjects(t){if(t.length===0||!t.every(i=>i&&typeof i=="object"&&!Array.isArray(i)))return  false;let{uniformity:s}=this._getMostCommonKeys(t);return s>=.6}_parseLines(t,s){let n=s;return this._parseValue(t,n,-1).value}_getIndent(t){if(!t||t.trim()==="")return  -1;let s=t.match(/^(\s*)/);return s?s[1].length:0}_parseValue(t,s,n){if(s>=t.length)return {value:null,nextIdx:s};let i=t[s],e=this._getIndent(i),r=i.trim();return r===""?{value:null,nextIdx:s+1}:r==="-"||r.startsWith("- ")?this._parseList(t,s,n):r.startsWith("@")||r.startsWith("[")&&r.includes("]@")||r.startsWith("$")&&!r.startsWith("$def")&&!r.startsWith("$data")?this._parseUniformArray(t,s,n):r.indexOf(":")>0&&e>n?this._parseObject(t,s,n):{value:this._parseVal(r),nextIdx:s+1}}_parseObject(t,s,n){let i={},e=s;for(;e<t.length;){let r=t[e],l=this._getIndent(r),p=r.trim();if(l<=n)break;if(p===""){e++;continue}let c=p.indexOf(":");if(c<=0){e++;continue}let a=p.slice(0,c).trim(),o=p.slice(c+1).trim(),u=a.startsWith('"')?JSON.parse(a):a;if(u.includes(".")&&!a.startsWith('"')){let f=u.split("."),h=f[0],d;if(o==="")if(e++,e<t.length&&this._getIndent(t[e])>l){let y=this._parseValue(t,e,l);d=y.value,e=y.nextIdx;}else d=null;else d=this._parseVal(o),e++;for(let y=f.length-1;y>=1;y--)d={[f[y]]:d};i[h]&&typeof i[h]=="object"&&!Array.isArray(i[h])?this._deepMerge(i[h],d):i[h]=d;continue}if(o==="")if(e++,e<t.length&&this._getIndent(t[e])>l){let f=this._parseValue(t,e,l);i[u]=f.value,e=f.nextIdx;}else i[u]=null;else if(o.startsWith("@")||o.startsWith("[")&&o.includes("]@")){let f=o;if(o.startsWith("[")){let g=o.indexOf("]");g>0&&(parseInt(o.slice(1,g)),f=o.slice(g+1));}let d=f.slice(1).split(this.delimiter),y=[];for(e++;e<t.length&&this._getIndent(t[e])>l;){let g=this._parseCsv(t[e].trim()),m={};d.forEach((_,j)=>{let b=g[j];b!==void 0&&b!==""&&(m[_]=this._parseVal(b));}),y.push(m),e++;}i[u]=y;}else if(o.startsWith("$")&&o.length>1&&o[1]!=="{"){let f=o.slice(1),h=this.structureDefs.get(f);if(h){let d=[];for(e++;e<t.length&&this._getIndent(t[e])>l;){let y=this._parseCsv(t[e].trim()),g={};h.forEach((m,_)=>{let j=y[_];j!==void 0&&j!==""&&(g[m]=this._parseVal(j));}),d.push(g),e++;}i[u]=d;}else i[u]=this._parseVal(o),e++;}else i[u]=this._parseVal(o),e++;}return {value:i,nextIdx:e}}_parseUniformArray(t,s,n){let i=t[s].trim(),r;if(i.startsWith("[")){let a=i.indexOf("]");a>0&&(parseInt(i.slice(1,a)),i=i.slice(a+1));}if(i.startsWith("@"))r=i.slice(1).split(this.delimiter);else if(i.startsWith("$")){let a=i.slice(1);if(r=this.structureDefs.get(a),!r)return {value:[],nextIdx:s+1}}else return {value:[],nextIdx:s+1};let l=[],p=s+1;this._getIndent(t[s]);for(;p<t.length&&!(this._getIndent(t[p])<=n);){let o=t[p].trim();if(o===""){p++;continue}if(o.startsWith("- ")){let u=o.slice(2).split(/\s+(?=\w+:)/),f={};for(let h of u){let d=h.indexOf(":");if(d>0){let y=h.slice(0,d),g=h.slice(d+1);f[y]=this._parseVal(g);}}l.push(f),p++;}else {let u=this._parseCsv(o),f={};r.forEach((h,d)=>{let y=u[d];y!==void 0&&y!==""&&(f[h]=this._parseVal(y));}),l.push(f),p++;}}return {value:l,nextIdx:p}}_parseList(t,s,n){let i=[],e=s,r=this._getIndent(t[s]);for(;e<t.length;){let l=this._getIndent(t[e]);if(l<=n)break;let p=t[e].trim();if(p!=="-"&&!p.startsWith("- ")||l!==r)break;let c=p.slice(2).trim();if(c==="")if(e++,e<t.length&&this._getIndent(t[e])>l){let a=this._parseValue(t,e,l);i.push(a.value),e=a.nextIdx;}else i.push(null);else {let a=e+1<t.length?this._getIndent(t[e+1]):0;if(a>l){let o={},u=c.indexOf(":");if(u>0){let f=c.slice(0,u).trim(),h=c.slice(u+1).trim();o[f]=this._parseVal(h);}for(e++;e<t.length&&this._getIndent(t[e])>l;){let f=t[e],h=this._getIndent(f),d=f.trim();if(h===a&&d.indexOf(":")>0){let y=d.indexOf(":"),g=d.slice(0,y).trim(),m=d.slice(y+1).trim();if(m==="")if(e++,e<t.length&&this._getIndent(t[e])>h){let _=this._parseValue(t,e,h);o[g]=_.value,e=_.nextIdx;}else o[g]=null;else o[g]=this._parseVal(m),e++;}else break}i.push(o);}else {let o=c.indexOf(":");if(o>0&&!c.startsWith("[")&&!c.startsWith("{")){let u=c.slice(0,o).trim(),f=c.slice(o+1).trim();i.push({[u]:this._parseVal(f)});}else i.push(this._parseVal(c));e++;}}}return {value:i,nextIdx:e}}_parseCsv(t){let s=[],n="",i=false;for(let e=0;e<t.length;e++){let r=t[e];r==='"'&&(e===0||t[e-1]!=="\\")?i&&t[e+1]==='"'?(n+='"',e++):(i=!i,n+=r):r===this.delimiter&&!i?(s.push(n),n=""):n+=r;}return s.push(n),s}_parseVal(t){if(t=t.trim(),t==="null")return null;if(t==="true")return  true;if(t==="false")return  false;if(t==="[]")return [];if(t==="{}")return {};if(t.startsWith("#")&&this.parsedValueDict){let n=this.parsedValueDict.get(t);if(n!==void 0)return n}let s=t.match(/^(.+?)\s+(#\d+)$/);if(s&&this.parsedValueDict){let n=s[1],i=s[2];if(!this.parsedValueDict.has(i)){let e=n.startsWith('"')?JSON.parse(n):n;this.parsedValueDict.set(i,e);}return n.startsWith('"')?JSON.parse(n):n}if(t.startsWith("&obj")&&this.parsedAliases){let n=this.parsedAliases.get(t);if(n!==void 0)return n}if(t.startsWith("[")&&t.endsWith("]")){let n=t.slice(1,-1).trim();return n===""?[]:this._parseCsv(n).map(e=>this._parseVal(e))}if(t.startsWith('"'))try{return JSON.parse(t)}catch{return t}if(/^-?\d+\.?\d*$/.test(t)){let n=parseFloat(t);if(!isNaN(n)&&isFinite(n))return n}return t}},k=class{static estimateTokens(t){return typeof t!="string"&&(t=JSON.stringify(t)),Math.ceil(t.length/4)}static compareFormats(t,s){let n=JSON.stringify(t),i=typeof s=="string"?s:JSON.stringify(s),e=this.estimateTokens(n),r=this.estimateTokens(i);return {original_tokens:e,compressed_tokens:r,reduction_percent:parseFloat((100*(1-r/e)).toFixed(2)),original_size:n.length,compressed_size:i.length}}};/**
 * ASON - Aliased Serialization Object Notation
 *
 * @fileoverview Main compression engine for converting JSON to ASON format.
 * ASON is a token-optimized serialization format designed specifically for LLMs,
 * reducing token usage by 20-60% compared to JSON while maintaining full round-trip fidelity.
 *
 * Key Features:
 * - Automatic pattern detection (no hardcoding required)
 * - Uniform array compression with schema extraction
 * - Object aliasing for repeated structures
 * - Inline-first value dictionary for LLM readability
 * - Path flattening for nested single-property objects
 * - Configurable indentation and delimiters
 *
 * @module SmartCompressor
 * @license MIT
 * @version 1.0.0
 */
/**
 * @fileoverview ASON (Aliased Serialization Object Notation) - Main Entry Point
 *
 * This module exports the main compression engine and token counter utilities
 * for converting JSON to ASON format, a token-optimized serialization format
 * designed for Large Language Models (LLMs).
 *
 * ASON reduces token usage by 20-60% compared to JSON while maintaining
 * perfect round-trip fidelity (lossless compression).
 *
 * @module ason
 * @see {@link SmartCompressor} for compression/decompression
 * @see {@link TokenCounter} for token estimation utilities
 * @license MIT
 * @version 1.0.0
 *
 * @example
 * import { SmartCompressor, TokenCounter } from 'ason';
 *
 * const compressor = new SmartCompressor({ indent: 1, useReferences: true });
 * const data = { users: [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}] };
 *
 * // Compress
 * const ason = compressor.compress(data);
 * // Output: users:[2]@id,name\n1,Alice\n2,Bob
 *
 * // Decompress
 * const original = compressor.decompress(ason);
 *
 * // Compare
 * const stats = TokenCounter.compareFormats(data, ason);
 * console.log(`Reduced tokens by ${stats.reduction_percent}%`);
 */export{O as SmartCompressor,k as TokenCounter};