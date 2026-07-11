#!/bin/bash
# Tube Screamer Explorer — local launcher (macOS: double-click to run)
cd "$(dirname "$0")" || exit 1
PORT=8123
echo "Starting Tube Screamer Explorer on http://localhost:$PORT/ ..."
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
sleep 1
open "http://localhost:$PORT/index.html"
echo ""
echo "  Running.  Close this window (or press Ctrl-C) to stop the server."
echo ""
trap "kill $SRV 2>/dev/null" EXIT
wait $SRV
