#!/usr/bin/env bash

# Resolve project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR" || exit 1

echo "================================================================="
echo "🧪 Running JanSamvedan Test Suites..."
echo "================================================================="

# Execute TypeScript test runner via tsx
npx --yes tsx testing/test-runner.ts
EXIT_CODE=$?

exit $EXIT_CODE
