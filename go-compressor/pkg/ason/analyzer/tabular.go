package analyzer

import (
	"reflect"
)

// ArrayInfo stores information about an array
type ArrayInfo struct {
	Path     string
	Analysis TabularAnalysis
}

// TabularAnalysis contains analysis results for an array
type TabularAnalysis struct {
	IsTabular   bool
	Uniformity  float64
	Fields      []string
	RowCount    int
	FieldTypes  map[string]string
}

// TabularAnalyzer identifies uniform arrays for tabular format
type TabularAnalyzer struct {
	minRows       int
	minUniformity float64
}

// NewTabularAnalyzer creates a new tabular analyzer
func NewTabularAnalyzer(minRows int, minUniformity float64) *TabularAnalyzer {
	return &TabularAnalyzer{
		minRows:       minRows,
		minUniformity: minUniformity,
	}
}

// FindArrays finds all arrays in the data and analyzes them
func (ta *TabularAnalyzer) FindArrays(data interface{}) []ArrayInfo {
	result := []ArrayInfo{}
	ta.findArraysRecursive(data, "", &result)
	return result
}

// findArraysRecursive recursively finds arrays
func (ta *TabularAnalyzer) findArraysRecursive(data interface{}, path string, result *[]ArrayInfo) {
	switch v := data.(type) {
	case map[string]interface{}:
		for key, value := range v {
			newPath := path
			if newPath == "" {
				newPath = key
			} else {
				newPath = path + "." + key
			}
			ta.findArraysRecursive(value, newPath, result)
		}
		
	case []interface{}:
		if len(v) >= ta.minRows {
			analysis := ta.analyzeArray(v)
			*result = append(*result, ArrayInfo{
				Path:     path,
				Analysis: analysis,
			})
		}
		
		// Also recurse into array elements
		for _, item := range v {
			ta.findArraysRecursive(item, path+"[]", result)
		}
	}
}

// analyzeArray analyzes an array for tabular format suitability
func (ta *TabularAnalyzer) analyzeArray(arr []interface{}) TabularAnalysis {
	analysis := TabularAnalysis{
		IsTabular:  false,
		Uniformity: 0.0,
		Fields:     []string{},
		RowCount:   len(arr),
		FieldTypes: make(map[string]string),
	}
	
	if len(arr) == 0 {
		return analysis
	}
	
	// Check if all elements are objects
	allObjects := true
	for _, item := range arr {
		if _, ok := item.(map[string]interface{}); !ok {
			allObjects = false
			break
		}
	}
	
	if !allObjects {
		return analysis
	}
	
	// Extract fields from all objects
	fieldSets := make([]map[string]bool, len(arr))
	for i, item := range arr {
		obj := item.(map[string]interface{})
		fieldSets[i] = make(map[string]bool)
		for key := range obj {
			fieldSets[i][key] = true
		}
	}
	
	// Find common fields
	if len(fieldSets) == 0 {
		return analysis
	}
	
	commonFields := make(map[string]bool)
	for key := range fieldSets[0] {
		isCommon := true
		for i := 1; i < len(fieldSets); i++ {
			if !fieldSets[i][key] {
				isCommon = false
				break
			}
		}
		if isCommon {
			commonFields[key] = true
		}
	}
	
	// Calculate uniformity
	totalFields := 0
	for _, fieldSet := range fieldSets {
		totalFields += len(fieldSet)
	}
	
	commonCount := len(commonFields) * len(fieldSets)
	uniformity := 0.0
	if totalFields > 0 {
		uniformity = float64(commonCount) / float64(totalFields)
	}
	
	analysis.Uniformity = uniformity
	
	// Determine if tabular
	if uniformity >= ta.minUniformity && len(commonFields) > 0 {
		analysis.IsTabular = true
		
		// Extract field names
		for field := range commonFields {
			analysis.Fields = append(analysis.Fields, field)
		}
		
		// Determine field types
		if len(arr) > 0 {
			firstObj := arr[0].(map[string]interface{})
			for field := range commonFields {
				if value, ok := firstObj[field]; ok {
					analysis.FieldTypes[field] = getType(value)
				}
			}
		}
	}
	
	return analysis
}

// GetStatistics returns statistics about analyzed arrays
func (ta *TabularAnalyzer) GetStatistics(data interface{}) map[string]interface{} {
	arrays := ta.FindArrays(data)
	
	tabularCount := 0
	for _, arr := range arrays {
		if arr.Analysis.IsTabular {
			tabularCount++
		}
	}
	
	return map[string]interface{}{
		"total_arrays":   len(arrays),
		"tabular_arrays": tabularCount,
	}
}

// getType returns a type name for a value
func getType(value interface{}) string {
	if value == nil {
		return "null"
	}
	
	switch value.(type) {
	case string:
		return "string"
	case float64, int, int64:
		return "number"
	case bool:
		return "boolean"
	case map[string]interface{}:
		return "object"
	case []interface{}:
		return "array"
	default:
		return reflect.TypeOf(value).String()
	}
}
