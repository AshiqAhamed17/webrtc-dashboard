# WebRTC Camera Dashboard

## Objective

Build a simple single-page dashboard that plays **WebRTC video streams** in a tiled view using **MediaMTX** for restreaming a sample video.

---

## Tech Stack

- **FFmpeg** – Publishes the sample video as an RTSP stream
- **MediaMTX** – Receives the RTSP stream and republishes it as WebRTC
- **Docker** – Runs FFmpeg and MediaMTX
- **HTML, CSS, JavaScript** – Frontend dashboard
- **reader.js** – Official MediaMTX WebRTC client

---

## Architecture

```text
sampleVid.mp4
      │
      ▼
   FFmpeg
      │
   RTSP Stream
      │
      ▼
  MediaMTX
      │
 WebRTC Stream
      │
      ▼
 reader.js
      │
      ▼
HTML Dashboard
```

---

## Project Structure

```text
webrtc-dashboard/
│
├── docker-compose.yml
├── mediamtx.yml
├── sampleVid.mp4
│
└── UI/
    ├── index.html
    ├── style.css
    ├── script.js
    └── reader.js
```
---

## Dashboard

![Dashboard](assets/dashboard.png)


## Implementation Steps

### 1. Setup MediaMTX

Configured MediaMTX using `mediamtx.yml` to accept an RTSP publisher on the `live` path.

### 2. Stream the Video

Used FFmpeg to:

- Read the sample video
- Loop it continuously
- Publish it to MediaMTX via RTSP

Output stream:

```text
rtsp://mediamtx:8554/live
```

### 3. WebRTC Playback

MediaMTX republishes the RTSP stream as WebRTC.

The frontend uses the official `reader.js` client to establish a WebRTC connection and receive the video stream.

### 4. Dashboard UI

Built a lightweight dashboard using:

- HTML
- CSS Grid
- JavaScript

The UI displays the stream in a responsive **2 × 2 tiled layout**.

---

## Running the Project

### Start MediaMTX & FFmpeg

```bash
docker compose up
```

### Start the UI

```bash
cd UI
python3 -m http.server 5500
```

### Open the Dashboard

```text
http://localhost:5500
```

---

## Result

- Sample video streamed using FFmpeg
- MediaMTX receives RTSP stream
- MediaMTX republishes as WebRTC
- Browser connects using `reader.js`
- Live video displayed in a clean 2 × 2 dashboard

---

## Key Learnings

- Basics of FFmpeg publishing
- RTSP and WebRTC streaming
- MediaMTX as a media server
- Docker-based media pipeline
- Building a simple WebRTC dashboard