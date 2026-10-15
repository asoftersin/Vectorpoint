#!/bin/sh
# Builds the site copies of the launch film from the 60 fps master.
set -e
cd "$(dirname "$0")/.."
src=launch-video/vectorpoint-launch.mp4
mkdir -p assets/launch
# Muted 720p loop for the hero.
ffmpeg -v error -y -i "$src" -an -vf "fps=30,scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart assets/launch/teaser.mp4
# Full 1080p version with sound for the dialog.
ffmpeg -v error -y -i "$src" -vf "fps=30" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart assets/launch/vectorpoint-launch.mp4
# Poster: the lead card, fully built.
ffmpeg -v error -y -ss 6.2 -i "$src" -frames:v 1 -vf "scale=1280:720:flags=lanczos" -q:v 4 assets/launch/poster.jpg
ls -lh assets/launch
