package compiler

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/ason-format/ason/go-compressor/pkg/ason/analyzer"
)

// Serializer converts data to ASON format
type Serializer struct {
	indent    int
	delimiter string
}

// NewSerializer creates a new ASON serializer
func NewSerializer(indent int, delimiter string) *Serializer {
	return &Serializer{
		indent:    indent,
		delimiter: delimiter,
	}
}

// Serialize converts data to ASON string format
func (s *Serializer) Serialize(
	data interface{},
	references map[string]interface{},
	sectionPlan *analyzer.SectionPlan,
	tabularArrays map[string]analyzer.TabularAnalysis,
) string {
	var result strings.Builder
	
	// Write reference definitions first
	if len(references) > 0 {
		for name, value := range references {
			result.WriteString("&")
			result.WriteString(name)
			result.WriteString(" = ")
			result.WriteString(s.serializeValue(value, 0, tabularArrays, ""))
			result.WriteString("\n")
		}
		result.WriteString("\n")
	}
	
	// Write sections or regular data
	if sectionPlan != nil && len(sectionPlan.Sections) > 0 {
		obj, ok := data.(map[string]interface{})
		if ok {
			for _, section := range sectionPlan.Sections {
				result.WriteString("@")
				result.WriteString(section.Name)
				result.WriteString("\n")
				
				if value, exists := obj[section.Name]; exists {
					result.WriteString(s.serializeValue(value, 0, tabularArrays, section.Name))
					result.WriteString("\n\n")
				}
			}
		}
	} else {
		result.WriteString(s.serializeValue(data, 0, tabularArrays, ""))
	}
	
	return strings.TrimSpace(result.String())
}

// serializeValue serializes a single value
func (s *Serializer) serializeValue(
	value interface{},
	depth int,
	tabularArrays map[string]analyzer.TabularAnalysis,
	path string,
) string {
	if value == nil {
		return "null"
	}
	
	switch v := value.(type) {
	case bool:
		if v {
			return "true"
		}
		return "false"
		
	case float64:
		// Format number without unnecessary decimals
		if v == float64(int64(v)) {
			return fmt.Sprintf("%d", int64(v))
		}
		return fmt.Sprintf("%g", v)
		
	case string:
		return s.serializeString(v)
		
	case map[string]interface{}:
		return s.serializeObject(v, depth, tabularArrays, path)
		
	case []interface{}:
		// Check if this should be a tabular array
		if tabular, exists := tabularArrays[path]; exists && tabular.IsTabular {
			return s.serializeTabularArray(v, tabular)
		}
		return s.serializeArray(v, depth, tabularArrays, path)
		
	default:
		// Fallback to JSON encoding
		jsonBytes, _ := json.Marshal(value)
		return string(jsonBytes)
	}
}

// serializeString serializes a string value
func (s *Serializer) serializeString(str string) string {
	// Check if string needs quotes
	needsQuotes := false
	
	// Empty strings need quotes
	if len(str) == 0 {
		needsQuotes = true
	}
	
	// Strings with special characters need quotes
	for _, ch := range str {
		if ch == ' ' || ch == '\n' || ch == '\t' || ch == '|' || ch == ':' || ch == ',' || ch == '{' || ch == '}' || ch == '@' || ch == '$' || ch == '&' || ch == '[' || ch == ']' || ch == '=' {
			needsQuotes = true
			break
		}
	}
	
	if needsQuotes {
		// Escape special characters
		escaped := strings.ReplaceAll(str, "\\", "\\\\")
		escaped = strings.ReplaceAll(escaped, "\"", "\\\"")
		escaped = strings.ReplaceAll(escaped, "\n", "\\n")
		escaped = strings.ReplaceAll(escaped, "\t", "\\t")
		escaped = strings.ReplaceAll(escaped, "\r", "\\r")
		return "\"" + escaped + "\""
	}
	
	return str
}

// serializeObject serializes an object
func (s *Serializer) serializeObject(
	obj map[string]interface{},
	depth int,
	tabularArrays map[string]analyzer.TabularAnalysis,
	path string,
) string {
	if len(obj) == 0 {
		return "{}"
	}
	
	var result strings.Builder
	indent := strings.Repeat(" ", depth*s.indent)
	innerIndent := strings.Repeat(" ", (depth+1)*s.indent)
	
	result.WriteString("{\n")
	
	first := true
	for key, value := range obj {
		if !first {
			result.WriteString(",\n")
		}
		first = false
		
		result.WriteString(innerIndent)
		result.WriteString(s.serializeString(key))
		result.WriteString(": ")
		
		newPath := path
		if newPath == "" {
			newPath = key
		} else {
			newPath = path + "." + key
		}
		
		result.WriteString(s.serializeValue(value, depth+1, tabularArrays, newPath))
	}
	
	result.WriteString("\n")
	result.WriteString(indent)
	result.WriteString("}")
	
	return result.String()
}

// serializeArray serializes a regular array
func (s *Serializer) serializeArray(
	arr []interface{},
	depth int,
	tabularArrays map[string]analyzer.TabularAnalysis,
	path string,
) string {
	if len(arr) == 0 {
		return "[]"
	}
	
	// Check if inline array (short and simple)
	if len(arr) <= 3 && s.isSimpleArray(arr) {
		var items []string
		for _, item := range arr {
			items = append(items, s.serializeValue(item, depth, tabularArrays, path+"[]"))
		}
		return "[" + strings.Join(items, ", ") + "]"
	}
	
	// Multi-line array
	var result strings.Builder
	indent := strings.Repeat(" ", depth*s.indent)
	innerIndent := strings.Repeat(" ", (depth+1)*s.indent)
	
	result.WriteString("[\n")
	
	for i, item := range arr {
		if i > 0 {
			result.WriteString(",\n")
		}
		result.WriteString(innerIndent)
		result.WriteString(s.serializeValue(item, depth+1, tabularArrays, path+"[]"))
	}
	
	result.WriteString("\n")
	result.WriteString(indent)
	result.WriteString("]")
	
	return result.String()
}

// serializeTabularArray serializes an array in tabular format
func (s *Serializer) serializeTabularArray(arr []interface{}, analysis analyzer.TabularAnalysis) string {
	if len(arr) == 0 {
		return "[]"
	}
	
	var result strings.Builder
	
	// Write header: [N]{field1,field2,...}
	result.WriteString(fmt.Sprintf("[%d]{", len(arr)))
	result.WriteString(strings.Join(analysis.Fields, ","))
	result.WriteString("}\n")
	
	// Write rows
	for _, item := range arr {
		obj, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		
		values := []string{}
		for _, field := range analysis.Fields {
			if value, exists := obj[field]; exists {
				values = append(values, s.formatTabularValue(value))
			} else {
				values = append(values, "")
			}
		}
		
		result.WriteString(strings.Join(values, s.delimiter))
		result.WriteString("\n")
	}
	
	return strings.TrimSuffix(result.String(), "\n")
}

// formatTabularValue formats a value for tabular output
func (s *Serializer) formatTabularValue(value interface{}) string {
	switch v := value.(type) {
	case nil:
		return ""
	case bool:
		if v {
			return "true"
		}
		return "false"
	case float64:
		if v == float64(int64(v)) {
			return fmt.Sprintf("%d", int64(v))
		}
		return fmt.Sprintf("%g", v)
	case string:
		// In tabular format, strings don't need quotes unless they contain delimiters
		if strings.Contains(v, s.delimiter) || strings.Contains(v, "\n") {
			return s.serializeString(v)
		}
		return v
	default:
		return fmt.Sprintf("%v", value)
	}
}

// isSimpleArray checks if an array contains only simple values
func (s *Serializer) isSimpleArray(arr []interface{}) bool {
	for _, item := range arr {
		switch item.(type) {
		case map[string]interface{}, []interface{}:
			return false
		}
	}
	return true
}
