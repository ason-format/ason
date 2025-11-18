package analyzer

// SectionInfo stores information about a potential section
type SectionInfo struct {
	Name   string
	Fields []string
	Size   int
}

// SectionPlan describes how to organize data into sections
type SectionPlan struct {
	Sections []SectionInfo
}

// SectionAnalyzer analyzes objects for optimal section organization
type SectionAnalyzer struct {
	minFieldsForSection int
}

// NewSectionAnalyzer creates a new section analyzer
func NewSectionAnalyzer(minFields int) *SectionAnalyzer {
	return &SectionAnalyzer{
		minFieldsForSection: minFields,
	}
}

// Analyze determines optimal section organization
func (sa *SectionAnalyzer) Analyze(data interface{}) *SectionPlan {
	obj, ok := data.(map[string]interface{})
	if !ok {
		return nil
	}
	
	plan := &SectionPlan{
		Sections: []SectionInfo{},
	}
	
	// Analyze each top-level field
	for key, value := range obj {
		// Check if value is an object or array with enough fields
		if objValue, ok := value.(map[string]interface{}); ok {
			if len(objValue) >= sa.minFieldsForSection {
				fields := []string{}
				for k := range objValue {
					fields = append(fields, k)
				}
				plan.Sections = append(plan.Sections, SectionInfo{
					Name:   key,
					Fields: fields,
					Size:   len(objValue),
				})
			}
		}
	}
	
	if len(plan.Sections) == 0 {
		return nil
	}
	
	return plan
}

// GetStatistics returns statistics about the section plan
func (sa *SectionAnalyzer) GetStatistics(plan *SectionPlan) map[string]interface{} {
	if plan == nil {
		return map[string]interface{}{
			"section_count": 0,
		}
	}
	
	return map[string]interface{}{
		"section_count": len(plan.Sections),
		"sections":      plan.Sections,
	}
}
