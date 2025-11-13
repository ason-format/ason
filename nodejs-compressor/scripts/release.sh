#!/bin/bash

# ASON Core Library Release Script
# Usage: ./scripts/release.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ASON Core Library Release Script    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('../package.json').version")
echo -e "Current version: ${YELLOW}v${CURRENT_VERSION}${NC}"

# Select version bump type
echo ""
echo -e "${GREEN}Select version bump:${NC}"
echo "  1) patch - Bug fixes (${CURRENT_VERSION} → $(npm version patch --no-git-tag-version | tail -1 && npm version ${CURRENT_VERSION} --no-git-tag-version >/dev/null 2>&1))"
echo "  2) minor - New features (${CURRENT_VERSION} → $(npm version minor --no-git-tag-version | tail -1 && npm version ${CURRENT_VERSION} --no-git-tag-version >/dev/null 2>&1))"
echo "  3) major - Breaking changes (${CURRENT_VERSION} → $(npm version major --no-git-tag-version | tail -1 && npm version ${CURRENT_VERSION} --no-git-tag-version >/dev/null 2>&1))"
echo ""
read -p "Enter choice (1-3): " BUMP_CHOICE

case $BUMP_CHOICE in
  1) BUMP_TYPE="patch" ;;
  2) BUMP_TYPE="minor" ;;
  3) BUMP_TYPE="major" ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

# Bump version
echo ""
echo -e "${BLUE}Bumping version...${NC}"
NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
NEW_VERSION=${NEW_VERSION#v}

echo -e "New version: ${GREEN}v${NEW_VERSION}${NC}"
echo ""

# Update CHANGELOG
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}IMPORTANT: Update CHANGELOG.md${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Change from:"
echo -e "  ${RED}## [Unreleased]${NC}"
echo ""
echo "To:"
echo -e "  ${GREEN}## [${NEW_VERSION}] - $(date +%Y-%m-%d)${NC}"
echo ""
read -p "Press ENTER when you've updated CHANGELOG.md..."

# Build
echo ""
echo -e "${BLUE}Building package...${NC}"
npm run build

# Run tests
echo ""
echo -e "${BLUE}Running tests...${NC}"
npm test || {
  echo -e "${RED}Tests failed!${NC}"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
}

# Commit and tag
git add package.json CHANGELOG.md package-lock.json 2>/dev/null || true
git commit -m "Release v${NEW_VERSION}"

TAG_NAME="v${NEW_VERSION}"
git tag -a "$TAG_NAME" -m "Release v${NEW_VERSION}"

echo ""
echo -e "${GREEN}✓ Tag created: ${TAG_NAME}${NC}"
echo ""

# Push
read -p "Push changes and tag to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push origin main
  git push origin "$TAG_NAME"

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✓ Release completed!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "Version: ${GREEN}v${NEW_VERSION}${NC}"
  echo -e "Tag: ${YELLOW}${TAG_NAME}${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  → GitHub Actions will publish to NPM"
  echo "  → GitHub Release will be created automatically"
  echo ""
fi
