#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

PORT=3000
SERVER_STARTED=false

# Check if port 3000 is already running
if ! curl -s -I "http://localhost:${PORT}" > /dev/null 2>&1; then
  echo "🚀 Starting Next.js production server on port ${PORT}..."
  npm run start &
  SERVER_PID=$!
  SERVER_STARTED=true
  for i in {1..30}; do
    if curl -s -I "http://localhost:${PORT}" > /dev/null 2>&1; then
      echo "✅ Server is ready on port ${PORT}!"
      break
    fi
    sleep 1
  done
fi

cleanup() {
  if [ "$SERVER_STARTED" = true ] && [ -n "$SERVER_PID" ]; then
    echo "🛑 Stopping Next.js background server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

node scripts/capture_screenshots.mjs

echo "✅ All screenshots captured under docs/images/:"
ls -lh docs/images/
