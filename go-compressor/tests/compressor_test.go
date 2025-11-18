package tests

import (
	"encoding/json"
	"testing"

	"github.com/ason-format/ason/go-compressor/pkg/ason"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestBasicCompression verifies basic compression functionality
func TestBasicCompression(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	data := map[string]interface{}{
		"name": "Alice",
		"age":  float64(30),
		"city": "NYC",
	}

	compressed := compressor.Compress(data)
	
	assert.NotEmpty(t, compressed, "Compressed output should not be empty")
	assert.IsType(t, "", compressed, "Compressed output should be a string")
}

// TestBasicDecompression verifies basic decompression functionality
func TestBasicDecompression(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	// Use proper ASON format
	asonStr := "name:Bob\nage:25"
	
	result, err := compressor.Decompress(asonStr)
	require.NoError(t, err, "Decompression should not error")
	assert.NotNil(t, result, "Decompressed result should not be nil")
	
	// Verify expected fields
	dataMap, ok := result.(map[string]interface{})
	require.True(t, ok, "Result should be a map")
	assert.Equal(t, "Bob", dataMap["name"])
	assert.Equal(t, float64(25), dataMap["age"])
}

// TestRoundTrip verifies lossless round-trip compression
func TestRoundTrip(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	original := map[string]interface{}{
		"user": map[string]interface{}{
			"id":   float64(1),
			"name": "Bob",
		},
		"active": true,
	}

	// Compress then decompress
	compressed := compressor.Compress(original)
	decompressed, err := compressor.Decompress(compressed)

	require.NoError(t, err, "Decompression should not error")
	
	// Convert both to JSON for comparison
	originalJSON, _ := json.Marshal(original)
	decompressedJSON, _ := json.Marshal(decompressed)
	
	assert.JSONEq(t, string(originalJSON), string(decompressedJSON), 
		"Round-trip should preserve data")
}

// TestValidateRoundTrip uses the built-in validation method
func TestValidateRoundTrip(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	data := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "John Doe",
			"email": "john@example.com",
		},
	}

	result := compressor.ValidateRoundTrip(data)
	
	valid, hasValid := result["valid"].(bool)
	assert.True(t, hasValid, "Should have 'valid' field")
	assert.True(t, valid, "Round-trip validation should pass")
}

// TestCompressWithStats verifies statistics generation
func TestCompressWithStats(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	data := map[string]interface{}{
		"test":   "data",
		"nested": map[string]interface{}{"value": float64(123)},
	}

	result := compressor.CompressWithStats(data)
	
	assert.Contains(t, result, "ason", "Should have 'ason' field")
	assert.Contains(t, result, "stats", "Should have 'stats' field")
}

// TestTabularArrays verifies tabular array compression
func TestTabularArrays(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	data := map[string]interface{}{
		"users": []interface{}{
			map[string]interface{}{"id": float64(1), "name": "Alice"},
			map[string]interface{}{"id": float64(2), "name": "Bob"},
		},
	}

	compressed := compressor.Compress(data)
	
	// Should contain tabular array format
	assert.Contains(t, compressed, "[", "Should have array bracket")
	assert.Contains(t, compressed, "{", "Should have schema bracket")
	
	// Verify round-trip
	decompressed, err := compressor.Decompress(compressed)
	require.NoError(t, err)
	
	originalJSON, _ := json.Marshal(data)
	decompressedJSON, _ := json.Marshal(decompressed)
	assert.JSONEq(t, string(originalJSON), string(decompressedJSON))
}

// TestPrimitiveValues tests various primitive value types
func TestPrimitiveValues(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	tests := []struct {
		name     string
		data     interface{}
		expected interface{}
	}{
		{"string", "hello", "hello"},
		{"number", float64(42), float64(42)},
		{"boolean_true", true, true},
		{"boolean_false", false, false},
		{"null", nil, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data := map[string]interface{}{"value": tt.data}
			
			compressed := compressor.Compress(data)
			decompressed, err := compressor.Decompress(compressed)
			
			require.NoError(t, err)
			
			dataMap, ok := decompressed.(map[string]interface{})
			require.True(t, ok, "Result should be a map")
			assert.Equal(t, tt.expected, dataMap["value"])
		})
	}
}

// TestNestedObjects verifies deep nesting support
func TestNestedObjects(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	data := map[string]interface{}{
		"level1": map[string]interface{}{
			"level2": map[string]interface{}{
				"level3": map[string]interface{}{
					"value": "deep",
				},
			},
		},
	}

	compressed := compressor.Compress(data)
	decompressed, err := compressor.Decompress(compressed)

	require.NoError(t, err)
	
	originalJSON, _ := json.Marshal(data)
	decompressedJSON, _ := json.Marshal(decompressed)
	assert.JSONEq(t, string(originalJSON), string(decompressedJSON))
}

// TestEmptyValues verifies handling of empty structures
func TestEmptyValues(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	tests := []struct {
		name string
		data map[string]interface{}
	}{
		{
			"empty_object",
			map[string]interface{}{"empty": map[string]interface{}{}},
		},
		{
			"empty_array",
			map[string]interface{}{"empty": []interface{}{}},
		},
		{
			"empty_string",
			map[string]interface{}{"empty": ""},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			compressed := compressor.Compress(tt.data)
			decompressed, err := compressor.Decompress(compressed)

			require.NoError(t, err)
			
			originalJSON, _ := json.Marshal(tt.data)
			decompressedJSON, _ := json.Marshal(decompressed)
			assert.JSONEq(t, string(originalJSON), string(decompressedJSON))
		})
	}
}

// TestSpecialCharacters verifies handling of special ASON characters
func TestSpecialCharacters(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	data := map[string]interface{}{
		"email":   "user@example.com",
		"price":   "$19.99",
		"company": "Smith & Co",
	}

	compressed := compressor.Compress(data)
	decompressed, err := compressor.Decompress(compressed)

	require.NoError(t, err)
	
	originalJSON, _ := json.Marshal(data)
	decompressedJSON, _ := json.Marshal(decompressed)
	assert.JSONEq(t, string(originalJSON), string(decompressedJSON))
}

// TestLargeUniformArray verifies compression efficiency on large datasets
func TestLargeUniformArray(t *testing.T) {
	compressor := ason.NewSmartCompressor(ason.DefaultOptions())

	// Generate 10 uniform objects with simple data
	users := make([]interface{}, 10)
	for i := 0; i < 10; i++ {
		users[i] = map[string]interface{}{
			"id":   float64(i + 1),
			"name": "User",
			"value": float64(i * 10),
		}
	}

	compressed := compressor.Compress(users)
	decompressed, err := compressor.Decompress(compressed)

	require.NoError(t, err, "Decompression should not error")
	
	// Verify compression occurred
	originalJSON, _ := json.Marshal(users)
	assert.Less(t, len(compressed), len(string(originalJSON)), 
		"Compressed size should be smaller than JSON")
	
	// Verify round-trip by comparing JSON strings
	decompressedJSON, _ := json.Marshal(decompressed)
	assert.JSONEq(t, string(originalJSON), string(decompressedJSON),
		"Round-trip should preserve data")
}
