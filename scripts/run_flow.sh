#!/usr/bin/env bash
# Complete flow runner for StressAlpha
# Validates artifacts, runs deterministic engine, and displays in web app
set -e

REPORT_TARGET="$1"

if [ -z "$REPORT_TARGET" ]; then
  echo "Usage: $0 <report-slug-or-directory>"
  echo "Example: $0 AMZN-Q2-2026-analysis"
  exit 1
fi

BASE_DIR="/Users/krding/Projects/stress-alpha"
cd "$BASE_DIR"

echo "=================================================="
echo "⚡ STRESSALPHA EARNINGS PIPELINE FLOW RUNNER"
echo "=================================================="

# 1. Resolve report path
if [ -d "$REPORT_TARGET" ]; then
  REPORT_DIR="$REPORT_TARGET"
  SLUG="$(basename "$REPORT_TARGET")"
elif [ -d "$BASE_DIR/reports/$REPORT_TARGET" ]; then
  REPORT_DIR="$BASE_DIR/reports/$REPORT_TARGET"
  SLUG="$REPORT_TARGET"
else
  echo "❌ Error: Report directory '$REPORT_TARGET' not found."
  exit 1
fi

echo "📁 Target Report: $REPORT_DIR (slug: $SLUG)"

# 2. Run deterministic valuation engine
echo "🧮 Executing deterministic valuation engine..."
npx tsx "$BASE_DIR/scripts/analyze.ts" "$REPORT_DIR"

# 3. Open in Next.js web application
echo "🌐 Displaying final output in StressAlpha web app..."
"$BASE_DIR/scripts/open_report.sh" "$SLUG"

echo "✅ Flow execution completed successfully."
