package ason_test

import (
	"encoding/json"
	"testing"
	
	"github.com/ason-format/ason/go-compressor/pkg/ason"
)

func TestBasicCompression(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	data := map[string]interface{}{
		"name": "Alice",
		"age":  float64(30),
	}
	
	ason := compressor.Compress(data)
	
	if len(ason) == 0 {
		t.Error("Expected non-empty ASON string")
	}
}

func TestBasicDecompression(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	asonStr := `{"name": "Bob", "age": 25}`
	
	result, err := compressor.Decompress(asonStr)
	if err != nil {
		t.Fatalf("Decompression failed: %v", err)
	}
	
	obj, ok := result.(map[string]interface{})
	if !ok {
		t.Fatal("Expected object result")
	}
	
	if obj["name"] != "Bob" {
		t.Errorf("Expected name to be Bob, got %v", obj["name"])
	}
}

func TestRoundTrip(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	data := map[string]interface{}{
		"users": []interface{}{
			map[string]interface{}{"id": float64(1), "name": "Alice"},
			map[string]interface{}{"id": float64(2), "name": "Bob"},
		},
	}
	
	// Compress
	asonStr := compressor.Compress(data)
	
	// Decompress
	result, err := compressor.Decompress(asonStr)
	if err != nil {
		t.Fatalf("Decompression failed: %v", err)
	}
	
	// Compare
	originalJSON, _ := json.Marshal(data)
	resultJSON, _ := json.Marshal(result)
	
	if string(originalJSON) != string(resultJSON) {
		t.Errorf("Round-trip failed:\nOriginal: %s\nResult:   %s", originalJSON, resultJSON)
	}
}

func TestValidateRoundTrip(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	data := map[string]interface{}{
		"name":  "Charlie",
		"email": "charlie@example.com",
		"age":   float64(28),
	}
	
	validation := compressor.ValidateRoundTrip(data)
	
	valid, ok := validation["valid"].(bool)
	if !ok || !valid {
		t.Errorf("Round-trip validation failed: %v", validation)
	}
}

func TestCompressWithStats(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	data := map[string]interface{}{
		"users": []interface{}{
			map[string]interface{}{"id": float64(1), "name": "Alice", "email": "alice@ex.com"},
			map[string]interface{}{"id": float64(2), "name": "Bob", "email": "bob@ex.com"},
		},
	}
	
	result := compressor.CompressWithStats(data)
	
	if result["ason"] == nil {
		t.Error("Expected ason string in result")
	}
	
	if result["stats"] == nil {
		t.Error("Expected stats in result")
	}
}

func TestTabularArrays(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	data := map[string]interface{}{
		"products": []interface{}{
			map[string]interface{}{"id": float64(1), "name": "Apple", "price": float64(1.99)},
			map[string]interface{}{"id": float64(2), "name": "Banana", "price": float64(0.99)},
			map[string]interface{}{"id": float64(3), "name": "Cherry", "price": float64(2.49)},
		},
	}
	
	asonStr := compressor.Compress(data)
	
	// Should contain tabular format indicators
	if len(asonStr) == 0 {
		t.Error("Expected non-empty ASON string")
	}
	
	// Verify round-trip
	result, err := compressor.Decompress(asonStr)
	if err != nil {
		t.Fatalf("Decompression failed: %v", err)
	}
	
	originalJSON, _ := json.Marshal(data)
	resultJSON, _ := json.Marshal(result)
	
	if string(originalJSON) != string(resultJSON) {
		t.Error("Tabular array round-trip failed")
	}
}

func TestPrimitiveValues(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	tests := []struct {
		name  string
		value interface{}
	}{
		{"string", "hello"},
		{"number", float64(42)},
		{"boolean_true", true},
		{"boolean_false", false},
		{"null", nil},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			asonStr := compressor.Compress(tt.value)
			result, err := compressor.Decompress(asonStr)
			if err != nil {
				t.Fatalf("Failed to decompress: %v", err)
			}
			
			// Compare values
			if tt.value != result {
				t.Errorf("Expected %v, got %v", tt.value, result)
			}
		})
	}
}

func TestNestedObjects(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	data := map[string]interface{}{
		"user": map[string]interface{}{
			"profile": map[string]interface{}{
				"name":  "Alice",
				"email": "alice@example.com",
			},
			"settings": map[string]interface{}{
				"theme":         "dark",
				"notifications": true,
			},
		},
	}
	
	asonStr := compressor.Compress(data)
	result, err := compressor.Decompress(asonStr)
	if err != nil {
		t.Fatalf("Failed to decompress: %v", err)
	}
	
	originalJSON, _ := json.Marshal(data)
	resultJSON, _ := json.Marshal(result)
	
	if string(originalJSON) != string(resultJSON) {
		t.Error("Nested objects round-trip failed")
	}
}

func TestEmptyValues(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())
	
	tests := []struct {
		name  string
		value interface{}
	}{
		{"empty_object", map[string]interface{}{}},
		{"empty_array", []interface{}{}},
		{"empty_string", ""},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			asonStr := compressor.Compress(tt.value)
			result, err := compressor.Decompress(asonStr)
			if err != nil {
				t.Fatalf("Failed to decompress: %v", err)
			}
			
			originalJSON, _ := json.Marshal(tt.value)
			resultJSON, _ := json.Marshal(result)
			
			if string(originalJSON) != string(resultJSON) {
				t.Errorf("Empty value round-trip failed for %s", tt.name)
			}
		})
	}
}
