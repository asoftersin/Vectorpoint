#!/bin/sh
# Builds the site copies of the launch film from the --nohud masters:
#   node launch-video/render.mjs --nohud && node launch-video/render.mjs --nohud --vertical
set -e
cd "$(dirname "$0")/.."
mkdir -p assets/launch
enc() { # src dst crf
  ffmpeg -v error -y -i "$1" -vf "fps=30" -c:v libx264 -preset slow -crf "$3" -pix_fmt yuv420p \
    -c:a aac -b:a 128k -movflags +faststart "$2"
}
enc launch-video/vectorpoint-launch-nohud.mp4 assets/launch/film.mp4 24
enc launch-video/vectorpoint-reel-nohud.mp4 assets/launch/film-v.mp4 25
# Posters: the logo frame, shown before playback starts or with reduced motion.
ffmpeg -v error -y -ss 1.0 -i launch-video/vectorpoint-launch-nohud.mp4 -frames:v 1 -vf "scale=1280:720:flags=lanczos" -q:v 4 assets/launch/poster.jpg
ffmpeg -v error -y -ss 1.0 -i launch-video/vectorpoint-reel-nohud.mp4 -frames:v 1 -vf "scale=720:1280:flags=lanczos" -q:v 4 assets/launch/poster-v.jpg
ls -lh assets/launch
