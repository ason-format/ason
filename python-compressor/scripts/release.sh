#!/bin/bash

# Python Release Script for ASON
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 2.0.1

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version number required"
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 2.0.1"
  exit 1
fi

echo "🚀 Releasing ASON Python Compressor v$VERSION"
echo ""

# Validate we're in the right directory
if [ ! -f "pyproject.toml" ]; then
  echo "❌ Error: Must be run from python-compressor directory"
  exit 1
fi

# Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Git working directory not clean"
  echo "Please commit or stash changes before releasing"
  exit 1
fi

# Update version in pyproject.toml
echo "📝 Updating version in pyproject.toml..."
sed -i.bak "s/^version = .*/version = \"$VERSION\"/" pyproject.toml
rm pyproject.toml.bak

# Run tests
echo "🧪 Running tests..."
uv run pytest tests/ -v

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting release."
  git checkout pyproject.toml
  exit 1
fi

echo "✅ Tests passed!"
echo ""

# Commit version bump
echo "📦 Committing version bump..."
git add pyproject.toml
git commit -m "chore(python): bump version to $VERSION"

# Create git tag
TAG="python-v$VERSION"
echo "🏷️  Creating tag: $TAG"
git tag -a "$TAG" -m "Python Release v$VERSION"

echo ""
echo "✅ Release prepared successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes: git show"
echo "   2. Push the commit: git push"
echo "   3. Push the tag: git push origin $TAG"
echo ""
echo "   💡 Or push both at once: git push && git push origin $TAG"
echo ""
echo "   The GitHub Action will automatically:"
echo "   • Build the package"
echo "   • Publish to PyPI"
echo "   • Create a GitHub release"
