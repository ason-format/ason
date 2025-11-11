# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The ASON team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Preferred**: Open a [Security Advisory](https://github.com/your-username/ason/security/advisories/new) on GitHub
2. **Alternative**: Email us at security@your-domain.com with details

### What to Include in Your Report

To help us better understand the nature and scope of the possible issue, please include as much of the following information as possible:

* **Type of issue** (e.g., buffer overflow, injection, etc.)
* **Full paths** of source file(s) related to the manifestation of the issue
* **Location** of the affected source code (tag/branch/commit or direct URL)
* **Step-by-step instructions** to reproduce the issue
* **Proof-of-concept or exploit code** (if possible)
* **Impact** of the issue, including how an attacker might exploit it

### What to Expect

* **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
* **Assessment**: We will assess the report and determine the severity and impact
* **Updates**: We will send you regular updates about our progress
* **Fix Timeline**: We aim to release a fix within 90 days of acknowledgment
* **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Considerations for ASON

### Data Validation

ASON processes user-provided JSON data. When using ASON:

* **Validate input** before compression
* **Sanitize data** from untrusted sources
* **Be aware** that compressed output is still text-based and not encrypted
* **Don't compress sensitive data** without additional encryption

### Decompression Safety

The decompression process parses structured text:

* **Avoid decompressing** untrusted ASON data without validation
* **Be cautious** with very large inputs (potential memory issues)
* **Implement timeouts** for decompression operations in production
* **Validate output** after decompression

### Common Security Best Practices

When integrating ASON into your application:

1. **Input Validation**
   ```javascript
   // Validate JSON before compression
   if (!isValidJSON(input)) {
     throw new Error('Invalid JSON input');
   }
   const compressed = compressor.compress(input);
   ```

2. **Size Limits**
   ```javascript
   // Limit input size
   const MAX_SIZE = 10 * 1024 * 1024; // 10MB
   if (input.length > MAX_SIZE) {
     throw new Error('Input too large');
   }
   ```

3. **Timeouts**
   ```javascript
   // Add timeout for compression operations
   const result = await Promise.race([
     compressor.compress(data),
     timeout(5000) // 5 second timeout
   ]);
   ```

4. **Error Handling**
   ```javascript
   try {
     const result = compressor.decompress(input);
   } catch (error) {
     // Log error securely
     logger.error('Decompression failed', {
       error: error.message
       // Don't log sensitive data
     });
   }
   ```

## Known Security Considerations

### 1. Denial of Service (DoS)

**Risk**: Very large or deeply nested JSON structures could cause performance issues.

**Mitigation**:
* Implement input size limits
* Set timeouts for compression/decompression
* Monitor resource usage in production

### 2. Code Injection

**Risk**: Low. ASON does not use `eval()` or execute code from compressed data.

**Mitigation**:
* All parsing is done with safe string operations
* No dynamic code execution

### 3. Information Disclosure

**Risk**: Compressed data retains the structure and content of original JSON.

**Mitigation**:
* Don't rely on ASON for data obfuscation
* Use encryption for sensitive data
* Sanitize logs containing compressed data

### 4. Regular Expression Denial of Service (ReDoS)

**Risk**: Pattern detection uses regular expressions.

**Mitigation**:
* Regular expressions are designed to be efficient
* Input size limits help prevent abuse
* Report any ReDoS vulnerabilities immediately

## Security Updates

Security updates will be announced:

* In the GitHub Security Advisories section
* In release notes for patched versions
* Via GitHub notifications if you watch the repository

## Scope

This security policy applies to:

* **nodejs-compressor**: Node.js implementation
* **docs (Web Visualizer)**: Browser-based implementation
* **All published npm packages** (if applicable)

This policy does **not** cover:

* Third-party dependencies (report to respective projects)
* User applications built with ASON
* Configurations and deployments by users

## Bug Bounty Program

We currently do not have a bug bounty program. However, we deeply appreciate security research and will:

* Publicly acknowledge contributors (with permission)
* Provide credit in security advisories
* Consider featuring significant contributions in project updates

## Questions

If you have questions about this security policy, please:

* Open a general issue (for non-sensitive questions)
* Contact the maintainers via GitHub discussions
* Email security@your-domain.com for sensitive inquiries

Thank you for helping keep ASON and our users safe!
