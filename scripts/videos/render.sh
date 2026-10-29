#!/bin/sh
# Turns the raw Playwright recordings (WebM) into the MP4s and posters the site serves.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out="$here/../../public/videos/recorder"
mkdir -p "$out"
for raw in "$here"/raw/*.webm; do
  name=$(basename "$raw" .webm)
  # A loop starts after the page has loaded, so it does not flash white on every
  # turn, and shows only the login form and the toolbar beside it (16:9).
  case "$name" in
    # The account form, the toolbar and the argument dialog below it.
    loop-create-account) skip=1.2 ; frame="crop=960:540:30:0" ;;
    loop-*) skip=1.2 ; frame="crop=810:456:470:0" ;;
    *) skip=0 ; frame="null" ;;
  esac
  ffmpeg -v error -y -ss "$skip" -i "$raw" -vf "$frame" -c:v libx264 -preset slow -crf 24 \
    -pix_fmt yuv420p -movflags +faststart -an "$out/$name.mp4"
  # The poster shows the outcome: a frame shortly before the end.
  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$raw")
  at=$(echo "$duration - 2.2" | bc)
  ffmpeg -v error -y -ss "$at" -i "$raw" -vf "$frame" -frames:v 1 -q:v 4 "$out/$name.jpg"
done
ls -la "$out"
