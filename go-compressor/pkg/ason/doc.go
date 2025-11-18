// Package ason provides an implementation of ASON (Aliased Serialization Object Notation),
// a token-optimized JSON compression format designed for Large Language Models (LLMs).
//
// ASON reduces token usage by 20-60% compared to JSON while maintaining perfect
// round-trip fidelity (lossless compression).
//
// Example:
//
//	opts := ason.DefaultOptions()
//	opts.Indent = 1
//	compressor := ason.NewSmartCompressor(opts)
//
//	data := map[string]interface{}{
//		"users": []interface{}{
//			map[string]interface{}{"id": 1, "name": "Alice", "email": "alice@ex.com"},
//			map[string]interface{}{"id": 2, "name": "Bob", "email": "bob@ex.com"},
//		},
//	}
//
//	// Compress
//	ason := compressor.Compress(data)
//	fmt.Println(ason)
//	// Output:
//	// @users [2]{id,name,email}
//	// 1|Alice|alice@ex.com
//	// 2|Bob|bob@ex.com
//
//	// Decompress (perfect round-trip)
//	original, _ := compressor.Decompress(ason)
package ason
