#!/bin/bash

# Go Release Script for ASON
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 1.0.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version number required"
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.0.0"
  exit 1
fi

echo "🚀 Releasing ASON Go Compressor v$VERSION"
echo ""

# Validate we're in the right directory
if [ ! -f "go.mod" ]; then
  echo "❌ Error: Must be run from go-compressor directory"
  exit 1
fi

# Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Git working directory not clean"
  echo "Please commit or stash changes before releasing"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
go test ./tests/... -v

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting release."
  exit 1
fi

echo "✅ Tests passed!"
echo ""

# For Go, we don't need to update version in files
# Go modules use git tags directly

# Create git tag
TAG="go-v$VERSION"
echo "🏷️  Creating tag: $TAG"
git tag -a "$TAG" -m "Go Release v$VERSION"

# Also create a tag for the go module path
MODULE_TAG="go-compressor/v$VERSION"
echo "🏷️  Creating module tag: $MODULE_TAG"
git tag -a "$MODULE_TAG" -m "Go Module Release v$VERSION"

echo ""
echo "✅ Release prepared successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes: git tag -l 'go*'"
echo "   2. Push the tags: git push origin $TAG $MODULE_TAG"
echo ""
echo "   The GitHub Action will automatically:"
echo "   • Run tests"
echo "   • Create a GitHub release"
echo ""
echo "   📦 Go users can then install with:"
echo "   go get github.com/ason-format/ason/go-compressor@$MODULE_TAG"
