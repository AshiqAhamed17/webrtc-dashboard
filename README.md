# Mini VMS — WebRTC Camera Dashboard

A lightweight **Video Management System** that ingests live RTSP camera feeds via MediaMTX and plays them in the browser over WebRTC.

## Quick Start

```bash
# 1. Edit cameras.json with your RTSP URLs
# 2. Generate config and start services
./start.sh

# 3. In another terminal, start the UI
cd UI && python3 -m http.server 5500

# 4. Open http://localhost:5500
```

See [docs.md](docs.md) for full setup, architecture, and camera configuration.

## Features

- **Multi-camera** — each RTSP source gets its own MediaMTX path and WHEP endpoint
- **Config-driven** — add cameras by editing `cameras.json`, no code changes
- **Live status** — per-camera LIVE / RECONNECTING badges with reconnect counters
- **Demo mode** — built-in FFmpeg sample video on the `demo` path

## Tech Stack

MediaMTX · FFmpeg · WebRTC · HTML/CSS/JS
