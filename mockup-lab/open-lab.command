#!/bin/bash
# Double-click this file to open the Premed HQ mockup variant lab.
# It serves this folder on port 8765 and opens the lab in your browser.
# The lab must run over http:// — variant injection needs the parent page
# and the embedded mockup to share one origin, so file:// will not work.

cd "$(dirname "$0")" || exit 1

PORT=8765
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Port $PORT is already serving — reusing it."
else
  echo "Starting server on http://localhost:$PORT ..."
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi

open "http://localhost:$PORT/variant-lab.html"

echo ""
echo "Lab is open at http://localhost:$PORT/variant-lab.html"
echo ""
echo "  ← / →   compare design variants A / B / C"
echo "  ↑ / ↓   move between pages"
echo "  Full screen button, top right"
echo ""
echo "Close this Terminal window to stop the server."
wait
