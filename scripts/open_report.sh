#!/usr/bin/env bash
# Open a StressAlpha report in the web application
set -e

REPORT_SLUG="$1"
PORT="${2:-3000}"

if [ -z "$REPORT_SLUG" ]; then
  echo "Usage: $0 <report-folder-name> [port]"
  echo "Example: $0 AMZN-Q2-2026-analysis"
  exit 1
fi

URL="http://localhost:${PORT}/?report=${REPORT_SLUG}"

echo "🚀 Opening StressAlpha Web App at: ${URL}"

# Check if Next.js dev server is running on port
if ! nc -z localhost "$PORT" 2>/dev/null; then
  echo "⚠️ Web app is not running on port ${PORT}. Starting in background..."
  cd /Users/krding/Projects/stress-alpha
  npm run dev -- -p "$PORT" > /dev/null 2>&1 &
  sleep 3
fi

# Open in macOS default browser
open "${URL}" || xdg-open "${URL}" 2>/dev/null || true
echo "✅ Report opened in browser."
