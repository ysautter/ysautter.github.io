#!/usr/bin/env bash
# Build the side-project images from assets-src/projects/ into static/img/projects/.
# Mockups (phone/browser frames) are composited on a transparent canvas; all
# metadata is stripped.
#
#   <name>-800.webp, <name>-1600.webp
#
# Sources (screenshots, gitignored):
#   hyprland.png                      1920x1080 desktop (private task list already overwritten!)
#   dasohr-week.png, dasohr-invoice.png  390x844 @3x phone screenshots (fictional demo data)
#   dasohr-invoice-pdf.png            invoice PDF page 1 (fictional demo data)
#   <site>-desktop.png                1440x900 @2x, <site>-mobile.png 390x844 @3x
#
# Re-run after replacing a screenshot. Outputs newer than all their sources are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets-src/projects
OUT=static/img/projects
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

fresh() {  # fresh <name> <sources...>: true if outputs are newer than all sources
  local name=$1; shift
  [[ -f "$OUT/$name-1600.webp" ]] || return 1
  for s in "$@"; do [[ "$OUT/$name-1600.webp" -nt "$s" ]] || return 1; done
}

export_webp() {  # export_webp <png> <name>
  for w in 800 1600; do
    magick "$1" -resize "${w}x>" -strip -define webp:method=6 -define webp:alpha-quality=90 \
      -quality 82 "$OUT/$2-$w.webp"
  done
  echo "$2 $(magick identify -format '%wx%h' "$OUT/$2-1600.webp") $(du -ch "$OUT/$2"-*.webp | tail -1 | cut -f1)"
}

shadow() {  # shadow <in> <out>: soft drop shadow, transparent background
  magick "$1" \( +clone -background black -shadow 55x22+0+18 \) +swap -background none \
    -layers merge +repage "$2"
}

phone() {  # phone <screenshot> <height> <out>: rounded screen in a dark bezel, with shadow
  local h=$2 b=14
  magick "$1" -resize "x$h" "$TMP/screen.png"
  local w; w=$(magick identify -format %w "$TMP/screen.png")
  magick "$TMP/screen.png" \
    \( +clone -alpha extract -fill black -colorize 100 -fill white \
       -draw "roundrectangle 0,0,$((w-1)),$((h-1)),40,40" \) \
    -alpha off -compose CopyOpacity -composite "$TMP/screen-r.png"
  magick -size "$((w+2*b))x$((h+2*b))" xc:none \
    -fill "#0b0f14" -stroke "rgba(255,255,255,0.18)" -strokewidth 2 \
    -draw "roundrectangle 1,1,$((w+2*b-2)),$((h+2*b-2)),52,52" \
    "$TMP/screen-r.png" -geometry "+$b+$b" -composite "$TMP/phone-raw.png"
  shadow "$TMP/phone-raw.png" "$3"
}

browser() {  # browser <screenshot> <width> <url> <out>: window with title bar, with shadow
  local w=$2 bar=44
  magick "$1" -resize "${w}x" "$TMP/page.png"
  local h; h=$(magick identify -format %h "$TMP/page.png")
  magick -size "${w}x$((h+bar))" xc:none \
    -fill "#1b2431" -draw "roundrectangle 0,0,$((w-1)),$((h+bar-1)),16,16" \
    -fill "#ff5f57" -draw "circle 26,22 32,22" \
    -fill "#febc2e" -draw "circle 48,22 54,22" \
    -fill "#28c840" -draw "circle 70,22 76,22" \
    -fill "rgba(255,255,255,0.08)" -draw "roundrectangle $((w/2-170)),10 $((w/2+170)),34,12,12" \
    -fill "rgba(255,255,255,0.7)" -font static/css/vendor/webfonts/SourceCodePro-Regular.ttf -pointsize 16 -gravity north \
    -annotate "+0+14" "$3" -gravity northwest \
    "$TMP/page.png" -geometry "+0+$bar" -composite \
    \( +clone -alpha extract -fill black -colorize 100 -fill white \
       -draw "roundrectangle 0,0,$((w-1)),$((h+bar-1)),16,16" \) \
    -alpha off -compose CopyOpacity -composite "$TMP/browser-raw.png"
  shadow "$TMP/browser-raw.png" "$4"
}

# ── Hyprland: plain screenshot ───────────────────────────────────────────────
if ! fresh hyprland "$SRC/hyprland.png"; then
  export_webp "$SRC/hyprland.png" hyprland
fi

# ── Websites: browser window + phone, 4:3 canvas ─────────────────────────────
for site in nora-dreyer.de horstdreyer.de; do
  name=${site%%.*}
  fresh "$name" "$SRC/$site-desktop.png" "$SRC/$site-mobile.png" && continue
  browser "$SRC/$site-desktop.png" 1300 "$site" "$TMP/b.png"
  phone "$SRC/$site-mobile.png" 820 "$TMP/p.png"
  magick -size 1600x1200 xc:none \
    "$TMP/b.png" -geometry +40+60 -composite \
    "$TMP/p.png" -geometry +1130+270 -composite "$TMP/$name.png"
  export_webp "$TMP/$name.png" "$name"
done

# ── das Ohr: invoice PDF sheet behind two phones, 4:3 canvas ─────────────────
if ! fresh dasohr "$SRC/dasohr-week.png" "$SRC/dasohr-invoice.png" "$SRC/dasohr-invoice-pdf.png"; then
  magick "$SRC/dasohr-invoice-pdf.png" -resize x1000 -bordercolor "#d9dde3" -border 1 \
    -background none -rotate 7 "$TMP/pdf-r.png"
  shadow "$TMP/pdf-r.png" "$TMP/pdf.png"
  phone "$SRC/dasohr-week.png" 940 "$TMP/p1.png"
  phone "$SRC/dasohr-invoice.png" 940 "$TMP/p2.png"
  magick -size 1600x1200 xc:none \
    "$TMP/pdf.png" -geometry +730+50 -composite \
    "$TMP/p1.png" -geometry +90+50 -composite \
    "$TMP/p2.png" -geometry +480+150 -composite "$TMP/dasohr.png"
  export_webp "$TMP/dasohr.png" dasohr
fi
