#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "$CHROME_BIN" ]; then
  CHROME_BIN="$(which google-chrome || which chromium || true)"
fi

if [ -z "$CHROME_BIN" ]; then
  echo "❌ Chrome/Chromium binary not found."
  exit 1
fi

mkdir -p docs/images

PORT=3000
SERVER_STARTED=false

# Check if port 3000 is already running
if ! curl -s -I "http://localhost:${PORT}" > /dev/null 2>&1; then
  echo "🚀 Starting Next.js production server on port ${PORT}..."
  npm run start &
  SERVER_PID=$!
  SERVER_STARTED=true
  sleep 3
fi

cleanup() {
  if [ "$SERVER_STARTED" = true ] && [ -n "$SERVER_PID" ]; then
    echo "🛑 Stopping Next.js background server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "📸 Capturing Headless Screenshots..."

echo "1/3 Capturing Universe Screener..."
"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1600,1050 \
  --virtual-time-budget=4000 \
  --screenshot="docs/images/screener-preview.png" \
  "http://localhost:${PORT}/?mode=screener"

echo "2/3 Capturing Stress Flow-Through Cockpit..."
"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1600,1050 \
  --virtual-time-budget=4000 \
  --screenshot="docs/images/cockpit-preview.png" \
  "http://localhost:${PORT}/?report=NVDA-Q2-2027-analysis&mode=cockpit"

echo "3/4 Capturing Investment Committee Memorandum..."
"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1600,1050 \
  --virtual-time-budget=4000 \
  --screenshot="docs/images/memo-preview.png" \
  "http://localhost:${PORT}/?report=NVDA-Q2-2027-analysis&mode=memo"

echo "4/4 Capturing Valuation Methodology & Calculations Page..."
"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=1600,1050 \
  --virtual-time-budget=4000 \
  --screenshot="docs/images/methodology-preview.png" \
  "http://localhost:${PORT}/methodology"

echo "✅ All screenshots captured under docs/images/:"
ls -lh docs/images/
