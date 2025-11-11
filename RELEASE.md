# Release Guide

This document explains how to create and publish a new release of ASON.

## Prerequisites

1. **NPM Account**: Create account at [npmjs.com](https://www.npmjs.com/)
2. **NPM Token**: Generate token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
   - Choose "Automation" token type
   - Copy the token (you'll only see it once)
3. **GitHub Secret**: Add NPM token to repository
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM token
   - Click "Add secret"

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

## Release Process

### 1. Update Version

Edit `nodejs-compressor/package.json`:

```json
{
  "version": "1.0.0"  // Update this
}
```

### 2. Update CHANGELOG.md

Add a new section at the top:

```markdown
## [1.0.0] - 2025-01-15

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z

### Changed
- Improvement W
```

### 3. Commit Changes

```bash
git add nodejs-compressor/package.json CHANGELOG.md
git commit -m "Release v1.0.0"
git push origin main
```

### 4. Create Git Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0

- New feature X
- New feature Y
- Bug fix Z"

# Push tag to GitHub
git push origin v1.0.0
```

### 5. Create GitHub Release

**Option A: Using GitHub UI**

1. Go to: https://github.com/ason-format/ason/releases/new
2. Choose tag: `v1.0.0`
3. Release title: `v1.0.0`
4. Description: Copy from CHANGELOG.md
5. Click "Publish release"

**Option B: Using GitHub CLI**

```bash
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes-file - <<EOF
## What's New

- New feature X
- New feature Y
- Bug fix Z

## Installation

\`\`\`bash
npm install @ason-format/ason
\`\`\`

## Full Changelog

See [CHANGELOG.md](https://github.com/ason-format/ason/blob/main/CHANGELOG.md)
EOF
```

### 6. Automatic NPM Publish

Once you create the GitHub release:

1. GitHub Actions will automatically trigger
2. Tests will run on Node 16.x, 18.x, 20.x
3. If tests pass, package publishes to NPM
4. Check workflow: https://github.com/ason-format/ason/actions

### 7. Verify Publication

```bash
# Check NPM
npm view @ason-format/ason

# Install and test
npm install @ason-format/ason@latest
```

## Quick Release Checklist

- [ ] Update version in `nodejs-compressor/package.json`
- [ ] Update `CHANGELOG.md` with changes
- [ ] Commit and push changes
- [ ] Create and push git tag `v1.x.x`
- [ ] Create GitHub release
- [ ] Verify GitHub Actions workflow passes
- [ ] Verify package published to NPM
- [ ] Test installation: `npm install @ason-format/ason@latest`

## Release Example

```bash
# 1. Update files (package.json, CHANGELOG.md)
# 2. Commit
git add -A
git commit -m "Release v1.0.0"
git push origin main

# 3. Tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 4. Create release on GitHub
# → GitHub Actions automatically publishes to NPM

# 5. Verify
npm view @ason-format/ason
```

## Troubleshooting

### GitHub Action Fails

1. Check workflow logs: https://github.com/ason-format/ason/actions
2. Common issues:
   - `NPM_TOKEN` not set in secrets
   - Tests failing
   - Version already exists on NPM

### NPM Token Issues

1. Regenerate token at npmjs.com
2. Update `NPM_TOKEN` secret in GitHub
3. Re-run failed workflow

### Version Conflicts

If version already exists on NPM:

```bash
# Increment patch version
# package.json: "1.0.0" → "1.0.1"

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push --delete origin v1.0.0

# Create new tag
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

## Post-Release

1. Announce on GitHub Discussions
2. Update documentation site if needed
3. Tweet/share on social media (optional)
4. Close related issues/PRs

## Beta/Pre-releases

For beta versions:

```bash
# Update version to pre-release
# package.json: "1.1.0-beta.1"

# Tag as pre-release
git tag -a v1.0.0-beta.1 -m "Beta release"
git push origin v1.0.0-beta.1

# On GitHub, mark as "pre-release"
```

Install beta:
```bash
npm install @ason-format/ason@beta
```

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [NPM Publishing](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
