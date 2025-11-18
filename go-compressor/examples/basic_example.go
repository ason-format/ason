package main

import (
	"encoding/json"
	"fmt"
	
	"github.com/ason-format/ason/go-compressor/pkg/ason"
)

func main() {
	fmt.Println("=== ASON Go Compressor - Basic Example ===\n")
	
	// Create compressor with default options
	opts := ason.DefaultOptions()
	opts.Indent = 1
	compressor := ason.NewSmartCompressor(opts)
	
	// Example 1: Simple object
	fmt.Println("Example 1: Simple Object")
	fmt.Println("-------------------------")
	
	simpleData := map[string]interface{}{
		"name":  "Alice",
		"email": "alice@example.com",
		"age":   float64(30),
	}
	
	simpleJSON, _ := json.MarshalIndent(simpleData, "", "  ")
	fmt.Println("JSON:")
	fmt.Println(string(simpleJSON))
	
	simpleASON := compressor.Compress(simpleData)
	fmt.Println("\nASON:")
	fmt.Println(simpleASON)
	fmt.Println()
	
	// Example 2: Array of objects (tabular format)
	fmt.Println("Example 2: Tabular Array")
	fmt.Println("------------------------")
	
	tabularData := map[string]interface{}{
		"users": []interface{}{
			map[string]interface{}{"id": float64(1), "name": "Alice", "email": "alice@ex.com"},
			map[string]interface{}{"id": float64(2), "name": "Bob", "email": "bob@ex.com"},
			map[string]interface{}{"id": float64(3), "name": "Charlie", "email": "charlie@ex.com"},
		},
	}
	
	tabularJSON, _ := json.MarshalIndent(tabularData, "", "  ")
	fmt.Println("JSON:")
	fmt.Println(string(tabularJSON))
	
	tabularASON := compressor.Compress(tabularData)
	fmt.Println("\nASON:")
	fmt.Println(tabularASON)
	fmt.Println()
	
	// Example 3: Compression with stats
	fmt.Println("Example 3: Compression Stats")
	fmt.Println("----------------------------")
	
	statsData := map[string]interface{}{
		"products": []interface{}{
			map[string]interface{}{"id": float64(1), "name": "Laptop", "price": float64(999.99), "stock": float64(15)},
			map[string]interface{}{"id": float64(2), "name": "Mouse", "price": float64(29.99), "stock": float64(50)},
			map[string]interface{}{"id": float64(3), "name": "Keyboard", "price": float64(79.99), "stock": float64(30)},
			map[string]interface{}{"id": float64(4), "name": "Monitor", "price": float64(299.99), "stock": float64(20)},
		},
	}
	
	result := compressor.CompressWithStats(statsData)
	
	fmt.Println("ASON:")
	fmt.Println(result["ason"])
	
	stats := result["stats"].(map[string]interface{})
	fmt.Printf("\nOriginal tokens: %d\n", stats["original_tokens"])
	fmt.Printf("Compressed tokens: %d\n", stats["compressed_tokens"])
	fmt.Printf("Token reduction: %.2f%%\n", stats["reduction_percent"])
	fmt.Printf("Original size: %d bytes\n", stats["original_size"])
	fmt.Printf("Compressed size: %d bytes\n", stats["compressed_size"])
	fmt.Printf("Size reduction: %.2f%%\n", stats["size_reduction_pct"])
	fmt.Println()
	
	// Example 4: Round-trip validation
	fmt.Println("Example 4: Round-trip Validation")
	fmt.Println("--------------------------------")
	
	validationData := map[string]interface{}{
		"order": map[string]interface{}{
			"id":       "ORD-12345",
			"customer": "Alice Johnson",
			"items": []interface{}{
				map[string]interface{}{"product": "Widget", "quantity": float64(2), "price": float64(19.99)},
				map[string]interface{}{"product": "Gadget", "quantity": float64(1), "price": float64(49.99)},
			},
			"total": float64(89.97),
		},
	}
	
	validation := compressor.ValidateRoundTrip(validationData)
	
	if validation["valid"].(bool) {
		fmt.Println("✓ Round-trip validation: PASSED")
		fmt.Println("\nCompressed ASON:")
		fmt.Println(validation["compressed"])
	} else {
		fmt.Println("✗ Round-trip validation: FAILED")
		if err, ok := validation["error"]; ok {
			fmt.Printf("Error: %v\n", err)
		}
	}
	
	fmt.Println("\n=== Examples Complete ===")
}
