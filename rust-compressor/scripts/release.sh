#!/bin/bash

# Rust Release Script for ASON
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

echo "🚀 Releasing ASON Rust Compressor v$VERSION"
echo ""

# Validate we're in the right directory
if [ ! -f "Cargo.toml" ]; then
  echo "❌ Error: Must be run from rust-compressor directory"
  exit 1
fi

# Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Git working directory not clean"
  echo "Please commit or stash changes before releasing"
  exit 1
fi

# Update version in Cargo.toml
echo "📝 Updating version in Cargo.toml..."
sed -i.bak "s/^version = .*/version = \"$VERSION\"/" Cargo.toml
rm Cargo.toml.bak

# Run tests
echo "🧪 Running tests..."
cargo test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting release."
  git checkout Cargo.toml
  exit 1
fi

echo "✅ Tests passed!"
echo ""

# Build release
echo "📦 Building release..."
cargo build --release

#Update Cargo.lock
cargo update --workspace

# Commit version bump
echo "📦 Committing version bump..."
git add Cargo.toml Cargo.lock
git commit -m "chore(rust): bump version to $VERSION"

# Create git tag
TAG="rust-v$VERSION"
echo "🏷️  Creating tag: $TAG"
git tag -a "$TAG" -m "Rust Release v$VERSION"

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
echo "   • Run tests"
echo "   • Publish to crates.io"
echo "   • Create a GitHub release"
