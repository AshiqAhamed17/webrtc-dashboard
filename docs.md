# Mini VMS — WebRTC Camera Dashboard

A lightweight **Video Management System** that ingests live RTSP camera feeds via MediaMTX and plays them in the browser over WebRTC.

---

## Architecture

```text
cameras.json  ──►  generate_mediamtx.py  ──►  mediamtx.yml
                                                    │
Live RTSP URLs ─────────────────────────────────────┤
                                                    ▼
                                              MediaMTX
                                         (one path per camera)
                                                    │
                              WHEP / WebRTC  (per-camera endpoint)
                                                    │
                                                    ▼
                                           Browser Dashboard
                                         (one reader per tile)
```

Each camera gets its own MediaMTX path and WHEP endpoint:

```text
cam1  →  rtsp://camera1/...     →  http://localhost:8889/cam1/whep
cam2  →  rtsp://camera2/...     →  http://localhost:8889/cam2/whep
demo  →  FFmpeg publisher       →  http://localhost:8889/demo/whep
```

---

## Project Structure

```text
webrtc-dashboard/
├── cameras.json              # Camera registry (edit this)
├── mediamtx.yml                # Generated — do not edit manually
├── docker-compose.yml
├── start.sh                    # Generate config + start Docker
├── scripts/
│   └── generate_mediamtx.py    # cameras.json → mediamtx.yml
└── UI/
    ├── cameras.json            # Copied from root (served to browser)
    ├── index.html
    ├── style.css
    ├── script.js
    └── reader.js
```

---

## Quick Start

### 1. Configure cameras

Edit `cameras.json` with your RTSP URLs:

```json
{
  "id": "cam1",
  "name": "Front Entrance",
  "path": "cam1",
  "location": "Building A",
  "type": "rtsp",
  "rtspUrl": "rtsp://admin:password@192.168.1.10:554/stream1"
}
```

Camera types:
- **`rtsp`** — MediaMTX pulls from the RTSP URL (your live cameras)
- **`publisher`** — Something pushes RTSP to MediaMTX (the demo FFmpeg feed)

### 2. Generate config and start services

```bash
./start.sh
```

Or manually:

```bash
python3 scripts/generate_mediamtx.py
docker compose up
```

### 3. Start the UI

```bash
cd UI
python3 -m http.server 5500
```

### 4. Open the dashboard

```text
http://localhost:5500
```

---

## Adding / Removing Cameras

1. Edit `cameras.json`
2. Run `python3 scripts/generate_mediamtx.py`
3. Restart MediaMTX: `docker compose restart mediamtx`
4. Refresh the browser

No code changes required.

---

## Demo Camera

The included `demo` camera uses FFmpeg to loop `sampleVid.mp4` into MediaMTX. Place `sampleVid.mp4` in the project root (it is gitignored).

The three `cam1`–`cam3` entries are RTSP placeholders — replace `rtspUrl` with your real camera URLs.

---

## Ports

| Port  | Service              |
|-------|----------------------|
| 8554  | RTSP                 |
| 8888  | MediaMTX HTTP API    |
| 8889  | WebRTC / WHEP        |
| 8189  | WebRTC ICE (UDP)     |
| 5500  | UI (python server)   |

---

## Tech Stack

- **MediaMTX** — RTSP ingest + WebRTC republish
- **FFmpeg** — Demo video publisher
- **reader.js** — Official MediaMTX WebRTC client
- **HTML / CSS / JavaScript** — Dashboard UI (no framework, no database)
