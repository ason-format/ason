package ason

import (
	"encoding/json"
	
	"github.com/ason-format/ason/go-compressor/pkg/ason/analyzer"
	"github.com/ason-format/ason/go-compressor/pkg/ason/compiler"
	"github.com/ason-format/ason/go-compressor/pkg/ason/lexer"
	"github.com/ason-format/ason/go-compressor/pkg/ason/parser"
	"github.com/ason-format/ason/go-compressor/pkg/ason/utils"
)

// SmartCompressor handles compression and decompression for ASON 2.0
type SmartCompressor struct {
	// Configuration
	Indent                  int
	Delimiter               string
	UseReferences           bool
	UseSections             bool
	UseTabular              bool
	MinFieldsForSection     int
	MinRowsForTabular       int
	MinReferenceOccurrences int
	
	// Components
	referenceAnalyzer *analyzer.ReferenceAnalyzer
	sectionAnalyzer   *analyzer.SectionAnalyzer
	tabularAnalyzer   *analyzer.TabularAnalyzer
	serializer        *compiler.Serializer
}

// CompressorOptions holds configuration options for SmartCompressor
type CompressorOptions struct {
	Indent                  int
	Delimiter               string
	UseReferences           bool
	UseSections             bool
	UseTabular              bool
	MinFieldsForSection     int
	MinRowsForTabular       int
	MinReferenceOccurrences int
}

// DefaultOptions returns default compressor options
func DefaultOptions() CompressorOptions {
	return CompressorOptions{
		Indent:                  1,
		Delimiter:               "|",
		UseReferences:           true,
		UseSections:             true,
		UseTabular:              true,
		MinFieldsForSection:     3,
		MinRowsForTabular:       2,
		MinReferenceOccurrences: 2,
	}
}

// NewSmartCompressor creates a new SmartCompressor with the given options
func NewSmartCompressor(opts CompressorOptions) *SmartCompressor {
	// Ensure indent is at least 1
	if opts.Indent < 1 {
		opts.Indent = 1
	}
	
	return &SmartCompressor{
		Indent:                  opts.Indent,
		Delimiter:               opts.Delimiter,
		UseReferences:           opts.UseReferences,
		UseSections:             opts.UseSections,
		UseTabular:              opts.UseTabular,
		MinFieldsForSection:     opts.MinFieldsForSection,
		MinRowsForTabular:       opts.MinRowsForTabular,
		MinReferenceOccurrences: opts.MinReferenceOccurrences,
		
		referenceAnalyzer: analyzer.NewReferenceAnalyzer(opts.MinReferenceOccurrences, 5),
		sectionAnalyzer:   analyzer.NewSectionAnalyzer(opts.MinFieldsForSection),
		tabularAnalyzer:   analyzer.NewTabularAnalyzer(opts.MinRowsForTabular, 0.8),
		serializer:        compiler.NewSerializer(opts.Indent, opts.Delimiter),
	}
}

// Compress compresses JSON data to ASON 2.0 format
//
// Pipeline:
// 1. Analyze references (repeated values → $var)
// 2. Analyze sections (object organization → @section)
// 3. Analyze arrays (uniform arrays → tabular format)
// 4. Serialize to ASON 2.0 string
func (sc *SmartCompressor) Compress(data interface{}) string {
	// Step 1: Analyze references
	references := make(map[string]interface{})
	if sc.UseReferences {
		references = sc.referenceAnalyzer.Analyze(data)
	}
	
	// Step 2: Analyze sections
	var sectionPlan *analyzer.SectionPlan
	if sc.UseSections {
		sectionPlan = sc.sectionAnalyzer.Analyze(data)
	}
	
	// Step 3: Analyze tabular arrays
	tabularArrays := make(map[string]analyzer.TabularAnalysis)
	if sc.UseTabular {
		arrayInfos := sc.tabularAnalyzer.FindArrays(data)
		for _, info := range arrayInfos {
			if info.Analysis.IsTabular {
				tabularArrays[info.Path] = info.Analysis
			}
		}
	}
	
	// Step 4: Serialize
	return sc.serializer.Serialize(data, references, sectionPlan, tabularArrays)
}

// Decompress decompresses ASON 2.0 format back to JSON
//
// Pipeline:
// 1. Tokenize (Lexer)
// 2. Parse (Parser → AST)
// 3. Convert AST to Go value
func (sc *SmartCompressor) Decompress(ason string) (interface{}, error) {
	// Step 1: Tokenize
	lex := lexer.New(ason)
	tokens := lex.Tokenize()
	
	// Step 2: Parse
	p := parser.New(tokens)
	ast, err := p.Parse()
	if err != nil {
		return nil, err
	}
	
	// Step 3: Convert AST to value
	return ast.ToValue(), nil
}

// CompressWithStats compresses data and returns detailed statistics
func (sc *SmartCompressor) CompressWithStats(data interface{}) map[string]interface{} {
	jsonBytes, _ := json.Marshal(data)
	jsonString := string(jsonBytes)
	
	asonString := sc.Compress(data)
	
	stats := utils.CompareFormats(data, jsonString, asonString)
	
	return map[string]interface{}{
		"ason":               asonString,
		"stats":              stats,
		"original_tokens":    stats["original_tokens"],
		"compressed_tokens":  stats["compressed_tokens"],
		"reduction_percent":  stats["reduction_percent"],
	}
}

// ValidateRoundTrip validates that compress/decompress round-trips correctly
func (sc *SmartCompressor) ValidateRoundTrip(data interface{}) map[string]interface{} {
	compressed := sc.Compress(data)
	decompressed, err := sc.Decompress(compressed)
	
	if err != nil {
		return map[string]interface{}{
			"valid": false,
			"error": err.Error(),
		}
	}
	
	// Marshal both to JSON for comparison
	originalJSON, _ := json.Marshal(data)
	decompressedJSON, _ := json.Marshal(decompressed)
	
	valid := string(originalJSON) == string(decompressedJSON)
	
	result := map[string]interface{}{
		"valid":        valid,
		"compressed":   compressed,
		"original":     data,
		"decompressed": decompressed,
	}
	
	if !valid {
		result["error"] = "Data mismatch after round-trip"
	}
	
	return result
}

// GetOptimizationStats gets optimization statistics without compressing
func (sc *SmartCompressor) GetOptimizationStats(data interface{}) map[string]interface{} {
	references := make(map[string]interface{})
	if sc.UseReferences {
		references = sc.referenceAnalyzer.Analyze(data)
	}
	
	var sectionPlan *analyzer.SectionPlan
	if sc.UseSections {
		sectionPlan = sc.sectionAnalyzer.Analyze(data)
	}
	
	var tabularStats map[string]interface{}
	if sc.UseTabular {
		tabularStats = sc.tabularAnalyzer.GetStatistics(data)
	}
	
	var sectionStats map[string]interface{}
	if sectionPlan != nil {
		sectionStats = sc.sectionAnalyzer.GetStatistics(sectionPlan)
	}
	
	refNames := []string{}
	for name := range references {
		refNames = append(refNames, name)
	}
	
	return map[string]interface{}{
		"references": map[string]interface{}{
			"count": len(references),
			"names": refNames,
		},
		"sections": sectionStats,
		"tabular":  tabularStats,
	}
}
