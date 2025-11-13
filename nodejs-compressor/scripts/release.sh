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

# Check if CHANGELOG already has this version
if grep -q "## \[${CURRENT_VERSION}\]" ../CHANGELOG.md 2>/dev/null; then
  echo -e "${YELLOW}⚠ CHANGELOG already updated for v${CURRENT_VERSION}${NC}"
  echo ""
  read -p "Use current version v${CURRENT_VERSION} for release? (Y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Nn]$ ]]; then
    USE_CURRENT=false
  else
    USE_CURRENT=true
  fi
else
  USE_CURRENT=false
fi

if [ "$USE_CURRENT" = true ]; then
  NEW_VERSION=$CURRENT_VERSION
  echo -e "Using current version: ${GREEN}v${NEW_VERSION}${NC}"
  echo ""
else
  # Select version bump type
  echo ""
  echo -e "${GREEN}Select version bump:${NC}"
  echo "  1) patch - Bug fixes (${CURRENT_VERSION} → v$(node -p "require('semver').inc('${CURRENT_VERSION}', 'patch')"))"
  echo "  2) minor - New features (${CURRENT_VERSION} → v$(node -p "require('semver').inc('${CURRENT_VERSION}', 'minor')"))"
  echo "  3) major - Breaking changes (${CURRENT_VERSION} → v$(node -p "require('semver').inc('${CURRENT_VERSION}', 'major')"))"
  echo "  4) Use current version v${CURRENT_VERSION}"
  echo ""
  read -p "Enter choice (1-4): " BUMP_CHOICE

  case $BUMP_CHOICE in
    1) BUMP_TYPE="patch" ;;
    2) BUMP_TYPE="minor" ;;
    3) BUMP_TYPE="major" ;;
    4)
      NEW_VERSION=$CURRENT_VERSION
      echo -e "Using current version: ${GREEN}v${NEW_VERSION}${NC}"
      echo ""
      ;;
    *)
      echo -e "${RED}Invalid choice${NC}"
      exit 1
      ;;
  esac

  # Bump version if not using current
  if [ "$BUMP_CHOICE" != "4" ]; then
    echo ""
    echo -e "${BLUE}Bumping version...${NC}"
    NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
    NEW_VERSION=${NEW_VERSION#v}
    echo -e "New version: ${GREEN}v${NEW_VERSION}${NC}"
    echo ""
  fi
fi

# Skip CHANGELOG update if already done
if grep -q "## \[${NEW_VERSION}\]" ../CHANGELOG.md 2>/dev/null; then
  echo -e "${GREEN}✓ CHANGELOG already updated for v${NEW_VERSION}${NC}"
  echo ""
else
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
  echo ""
fi

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

# Check if tag already exists
TAG_NAME="v${NEW_VERSION}"
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠ Tag ${TAG_NAME} already exists${NC}"
  read -p "Delete and recreate tag? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag -d "$TAG_NAME"
    echo -e "${GREEN}✓ Deleted existing tag${NC}"
  else
    echo -e "${RED}Aborting. Tag already exists.${NC}"
    exit 1
  fi
fi

# Add files
git add package.json CHANGELOG.md package-lock.json dist/ 2>/dev/null || true

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo -e "${YELLOW}No changes to commit (files already staged or committed)${NC}"
else
  git commit -m "chore: release v${NEW_VERSION}"
  echo -e "${GREEN}✓ Changes committed${NC}"
fi

# Create tag
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
