#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Generating MediaMTX config from cameras.json"
python3 scripts/generate_mediamtx.py

echo "==> Starting MediaMTX and FFmpeg"
docker compose up
