#!/usr/bin/env bash
# Render the CV section of index.html to static/cv/Yannick_Sautter_CV.pdf
# using headless Chromium and the @media print rules in static/css/input.css.
# Served over a throwaway local HTTP server, because the SVG icon sprite
# (<use href="static/img/icons.svg#...">) does not load from file://.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="$(command -v chromium || command -v google-chrome || command -v chromium-browser || true)"
[[ -n "$CHROME" ]] || { echo "chromium not found" >&2; exit 1; }

PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])')
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
PROFILE=$(mktemp -d)   # fresh profile: no cached CSS from earlier runs
trap 'kill $SERVER 2>/dev/null; rm -rf "$PROFILE"' EXIT
sleep 1

mkdir -p static/cv
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$PROFILE" \
  --virtual-time-budget=3000 \
  --print-to-pdf=static/cv/Yannick_Sautter_CV.pdf \
  "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1
echo "static/cv/Yannick_Sautter_CV.pdf ($(stat -c %s static/cv/Yannick_Sautter_CV.pdf) bytes)"
