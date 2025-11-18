package utils

import (
	"strings"
	"unicode"
)

// TokenCounter estimates token usage for compression statistics
type TokenCounter struct{}

// NewTokenCounter creates a new token counter
func NewTokenCounter() *TokenCounter {
	return &TokenCounter{}
}

// CountTokens estimates the number of tokens in a string
// This is a simple approximation based on GPT tokenization patterns
func (tc *TokenCounter) CountTokens(text string) int {
	// Basic tokenization: split on whitespace and punctuation
	tokens := 0
	inWord := false
	
	for _, ch := range text {
		if unicode.IsSpace(ch) || unicode.IsPunct(ch) {
			if inWord {
				tokens++
				inWord = false
			}
			// Punctuation and whitespace count as separate tokens
			tokens++
		} else {
			inWord = true
		}
	}
	
	if inWord {
		tokens++
	}
	
	// Adjust for typical GPT tokenization (rough approximation)
	// GPT typically uses ~0.75 tokens per word on average
	return int(float64(tokens) * 0.75)
}

// CompareFormats compares token usage between JSON and ASON
func CompareFormats(data interface{}, jsonString, asonString string) map[string]interface{} {
	counter := NewTokenCounter()
	
	jsonTokens := counter.CountTokens(jsonString)
	asonTokens := counter.CountTokens(asonString)
	
	reduction := 0.0
	if jsonTokens > 0 {
		reduction = float64(jsonTokens-asonTokens) / float64(jsonTokens) * 100
	}
	
	return map[string]interface{}{
		"original_tokens":    jsonTokens,
		"compressed_tokens":  asonTokens,
		"reduction_tokens":   jsonTokens - asonTokens,
		"reduction_percent":  reduction,
		"original_size":      len(jsonString),
		"compressed_size":    len(asonString),
		"size_reduction":     len(jsonString) - len(asonString),
		"size_reduction_pct": float64(len(jsonString)-len(asonString)) / float64(len(jsonString)) * 100,
	}
}

// FormatStats formats statistics for display
func FormatStats(stats map[string]interface{}) string {
	var result strings.Builder
	var helper TokenCounter
	
	result.WriteString("📊 COMPRESSION STATS:\n")
	result.WriteString("┌─────────────────┬──────────┬────────────┬──────────────┐\n")
	result.WriteString("│ Format          │ Tokens   │ Size       │ Reduction    │\n")
	result.WriteString("├─────────────────┼──────────┼────────────┼──────────────┤\n")
	
	result.WriteString(helper.formatRow("JSON",
		stats["original_tokens"].(int),
		stats["original_size"].(int),
		"-"))
	
	result.WriteString(helper.formatRow("ASON 2.0",
		stats["compressed_tokens"].(int),
		stats["compressed_size"].(int),
		helper.formatPercent(stats["reduction_percent"].(float64))))
	
	result.WriteString("└─────────────────┴──────────┴────────────┴──────────────┘\n")
	
	result.WriteString(helper.formatSummary(stats))
	
	return result.String()
}

func (tc *TokenCounter) formatRow(format string, tokens int, size int, reduction string) string {
	return tc.sprintf("│ %-15s │ %-8d │ %-10s │ %-12s │\n",
		format, tokens, tc.formatBytes(size), reduction)
}

func (tc *TokenCounter) formatBytes(bytes int) string {
	if bytes < 1024 {
		return tc.sprintf("%d B", bytes)
	}
	return tc.sprintf("%.1f KB", float64(bytes)/1024)
}

func (tc *TokenCounter) formatPercent(pct float64) string {
	if pct > 0 {
		return tc.sprintf("%.2f%%", pct)
	}
	return tc.sprintf("+%.2f%%", -pct)
}

func (tc *TokenCounter) formatSummary(stats map[string]interface{}) string {
	tokenReduction := stats["reduction_tokens"].(int)
	tokenPct := stats["reduction_percent"].(float64)
	sizeReduction := stats["size_reduction"].(int)
	sizePct := stats["size_reduction_pct"].(float64)
	
	if tokenReduction > 0 {
		return tc.sprintf("✓ Saved %d tokens (%.2f%%) • %d B (%.2f%%)\n",
			tokenReduction, tokenPct, sizeReduction, sizePct)
	}
	return tc.sprintf("⚠ Increased by %d tokens (%.2f%%) • %d B (%.2f%%)\n",
		-tokenReduction, -tokenPct, -sizeReduction, -sizePct)
}

func (tc *TokenCounter) sprintf(format string, args ...interface{}) string {
	// Simple sprintf implementation
	result := format
	for _, arg := range args {
		switch v := arg.(type) {
		case int:
			result = strings.Replace(result, "%d", tc.itoa(v), 1)
			result = strings.Replace(result, "%-8d", tc.pad(tc.itoa(v), 8, false), 1)
		case float64:
			result = strings.Replace(result, "%.2f", tc.ftoa(v, 2), 1)
			result = strings.Replace(result, "%.1f", tc.ftoa(v, 1), 1)
		case string:
			result = strings.Replace(result, "%s", v, 1)
			result = strings.Replace(result, "%-15s", tc.pad(v, 15, false), 1)
			result = strings.Replace(result, "%-10s", tc.pad(v, 10, false), 1)
			result = strings.Replace(result, "%-12s", tc.pad(v, 12, false), 1)
		}
	}
	return result
}

func (tc *TokenCounter) itoa(i int) string {
	if i == 0 {
		return "0"
	}
	
	negative := i < 0
	if negative {
		i = -i
	}
	
	var result []byte
	for i > 0 {
		result = append([]byte{byte('0' + i%10)}, result...)
		i /= 10
	}
	
	if negative {
		result = append([]byte{'-'}, result...)
	}
	
	return string(result)
}

func (tc *TokenCounter) ftoa(f float64, precision int) string {
	// Simple float to string conversion
	intPart := int(f)
	fracPart := f - float64(intPart)
	
	result := tc.itoa(intPart) + "."
	
	for i := 0; i < precision; i++ {
		fracPart *= 10
		digit := int(fracPart)
		result += tc.itoa(digit)
		fracPart -= float64(digit)
	}
	
	return result
}

func (tc *TokenCounter) pad(s string, width int, left bool) string {
	if len(s) >= width {
		return s
	}
	
	padding := strings.Repeat(" ", width-len(s))
	if left {
		return padding + s
	}
	return s + padding
}
