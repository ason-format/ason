//! Token counter stub

pub struct TokenCounter;

impl TokenCounter {
    pub fn new() -> Self {
        Self
    }

    pub fn count_tokens(&self, text: &str) -> usize {
        // Basic approximation
        (text.len() as f64 / 4.0).ceil() as usize
    }
}

impl Default for TokenCounter {
    fn default() -> Self {
        Self::new()
    }
}
