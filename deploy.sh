#!/usr/bin/env bash
# Deploy sautter.dev to root@mx.sautter.dev:/opt/sautter.dev
#
#   ./deploy.sh           dry run (shows what rsync would change)
#   ./deploy.sh --apply   build CSS, sync, (re)start the stack, smoke test
set -euo pipefail

HOST="${HOST:-root@mx.sautter.dev}"
DEST="/opt/sautter.dev"
cd "$(dirname "$0")"

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

npm run build >/dev/null 2>&1

# Only public files go to the server. NOTES.md, email-signature/, input.css etc. stay local.
RSYNC_SITE=(rsync -rlt --delete --chmod=D755,F644
  --exclude='/static/css/input.css'
  --include='/index.html' --include='/impressum.html'
  --include='/.well-known/***' --include='/static/***'
  --exclude='*'
  ./ "$HOST:$DEST/site/")
RSYNC_STACK=(rsync -rlt --chmod=D755,F644 deploy/ "$HOST:$DEST/")

if (( ! APPLY )); then
  echo "Dry run. Use --apply to deploy."
  ssh "$HOST" "mkdir -p $DEST/site" 2>/dev/null
  "${RSYNC_STACK[@]}" -n -i
  "${RSYNC_SITE[@]}" -n -i
  exit 0
fi

ssh "$HOST" "mkdir -p $DEST/site"
"${RSYNC_STACK[@]}"
"${RSYNC_SITE[@]}"
ssh "$HOST" "cd $DEST && docker compose up -d --remove-orphans && docker exec sautter-dev nginx -t" 2>&1 | grep -v X11

# Smoke test against the container itself on the "web" network
ssh "$HOST" 'docker run --rm --network web --entrypoint sh curlimages/curl:8.17.0 -c "
  for p in / /impressum.html /.well-known/matrix/client /static/css/style.css /NOTES.md; do
    curl -s -o /dev/null -w \"%{http_code} \$p\n\" -H \"Host: sautter.dev\" http://sautter-dev:8080\$p
  done"' 2>&1 | grep -v X11
