package analyzer

import (
	"encoding/json"
	"fmt"
)

// ReferenceInfo stores information about a repeated value
type ReferenceInfo struct {
	Value       interface{}
	Occurrences int
	FirstPath   string
}

// ReferenceAnalyzer detects repeated values for deduplication
type ReferenceAnalyzer struct {
	minOccurrences int
	minLength      int
}

// NewReferenceAnalyzer creates a new reference analyzer
func NewReferenceAnalyzer(minOccurrences, minLength int) *ReferenceAnalyzer {
	return &ReferenceAnalyzer{
		minOccurrences: minOccurrences,
		minLength:      minLength,
	}
}

// Analyze finds repeated values in the data
func (ra *ReferenceAnalyzer) Analyze(data interface{}) map[string]interface{} {
	valueCounts := make(map[string]*ReferenceInfo)
	ra.findRepeatedValues(data, "", valueCounts)
	
	// Filter values that meet the criteria
	references := make(map[string]interface{})
	varIndex := 0
	
	for _, info := range valueCounts {
		if info.Occurrences >= ra.minOccurrences {
			// Check if value is complex enough to warrant a reference
			jsonStr, _ := json.Marshal(info.Value)
			if len(jsonStr) >= ra.minLength {
				varName := fmt.Sprintf("var%d", varIndex)
				references[varName] = info.Value
				varIndex++
			}
		}
	}
	
	return references
}

// findRepeatedValues recursively finds all values and counts occurrences
func (ra *ReferenceAnalyzer) findRepeatedValues(data interface{}, path string, counts map[string]*ReferenceInfo) {
	switch v := data.(type) {
	case map[string]interface{}:
		// Count the map itself
		ra.recordValue(v, path, counts)
		
		// Recurse into values
		for key, value := range v {
			newPath := path + "." + key
			ra.findRepeatedValues(value, newPath, counts)
		}
		
	case []interface{}:
		// Count array items
		for i, item := range v {
			newPath := fmt.Sprintf("%s[%d]", path, i)
			ra.findRepeatedValues(item, newPath, counts)
		}
		
	case string, float64, int, bool:
		ra.recordValue(v, path, counts)
	}
}

// recordValue records a value occurrence
func (ra *ReferenceAnalyzer) recordValue(value interface{}, path string, counts map[string]*ReferenceInfo) {
	// Serialize value to use as key
	jsonBytes, err := json.Marshal(value)
	if err != nil {
		return
	}
	key := string(jsonBytes)
	
	if info, exists := counts[key]; exists {
		info.Occurrences++
	} else {
		counts[key] = &ReferenceInfo{
			Value:       value,
			Occurrences: 1,
			FirstPath:   path,
		}
	}
}
