#!/usr/bin/env bash
# Build the web versions of the photography gallery from assets-src/photos/
# into static/img/photos/. All metadata (EXIF incl. GPS, camera serial) is
# stripped; only an sRGB profile is kept implicitly by converting to sRGB.
#
#   <slug>-640.webp, <slug>-1280.webp   thumbnails (srcset in the grid)
#   <slug>-2400.webp                    full size (lightbox)
#
# Re-run after adding a photo to the PHOTOS list. Existing outputs that are
# newer than their source are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets-src/photos
OUT=static/img/photos
mkdir -p "$OUT"

# source file             slug
PHOTOS=(
  "DSC08607.jpg           sahara-sunrise"
  "DSC05856.jpg           mezquita-mihrab"
  "DSC06449.jpg           alhambra-sierra-nevada"
  "DSC00738.jpg           roses"
  "DSC05967.jpg           camel-beach"
  "DSC04649.jpg           lighthouse-mist"
  "DSC05307.jpg           palm-sunset"
  "DSC00117.jpg           cantabrian-coast"
  "DSC09496_01.jpg        parakeet"
  "DSC06152_02.jpg        reservoir"
  "DSC02944.jpg           granada-rooftops"
  "DSC09856_01.jpg        alhambra-dusk"
  "DSC01499.jpg           mountain-light"
  "DSC08552.JPG           sahara-milky-way"
  "DSC08180.JPG           desert-bird"
  "DSC08412.JPG           sahara-sunset"
)

# Warn about source photos that are not in the list (and would be skipped).
for f in "$SRC"/*; do
  name=$(basename "$f")
  printf '%s\n' "${PHOTOS[@]}" | grep -q "^$name " ||
    echo "warning: $name is not in PHOTOS, skipped" >&2
done

for entry in "${PHOTOS[@]}"; do
  read -r file slug <<<"$entry"
  src="$SRC/$file"
  for w in 640 1280 2400; do
    dst="$OUT/$slug-$w.webp"
    [[ -f "$dst" && "$dst" -nt "$src" ]] && continue
    q=80; (( w == 2400 )) && q=85
    magick "$src" -auto-orient -colorspace sRGB -resize "${w}x>" -strip \
      -define webp:method=6 -quality "$q" "$dst"
  done
  echo "$slug $(magick identify -format '%wx%h' "$OUT/$slug-2400.webp") $(du -ch "$OUT/$slug"-*.webp | tail -1 | cut -f1)"
done
