"use strict";

let cameras = [];
let mediamtxConfig = {};

const STATUS = {
    LIVE: {
        label: "LIVE",
        dotClass: "badge-dot--live",
        badgeClass: "badge--live",
        cardClass: "camera-card--live",
    },
    RECONNECTING: {
        label: "RECONNECTING",
        dotClass: "badge-dot--reconnecting",
        badgeClass: "badge--reconnecting",
        cardClass: "camera-card--reconnecting",
    },
};

const readers = [];
const cameraStates = [];

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatTime() {
    return new Date().toLocaleTimeString();
}

function buildWhepUrl(path) {
    const { protocol, host, webrtcPort } = mediamtxConfig;
    return `${protocol}://${host}:${webrtcPort}/${path}/whep`;
}

function sourceLabel(type) {
    return type === "publisher" ? "Publisher" : "RTSP";
}

async function loadConfig() {
    const response = await fetch("cameras.json");

    if (!response.ok) {
        throw new Error(`Failed to load cameras.json (${response.status})`);
    }

    const config = await response.json();

    if (!config.cameras || !Array.isArray(config.cameras) || config.cameras.length === 0) {
        throw new Error("cameras.json must contain a non-empty cameras array");
    }

    if (!config.mediamtx || !config.mediamtx.host || !config.mediamtx.webrtcPort) {
        throw new Error("cameras.json must contain mediamtx.host and mediamtx.webrtcPort");
    }

    mediamtxConfig = {
        protocol: config.mediamtx.protocol || "http",
        host: config.mediamtx.host,
        webrtcPort: config.mediamtx.webrtcPort,
    };

    cameras = config.cameras.map((cam) => ({
        ...cam,
        location: cam.location || "—",
        whepUrl: buildWhepUrl(cam.path),
    }));
}

function setGridLayout() {
    const grid = document.getElementById("grid");
    const count = cameras.length;

    grid.classList.remove("grid--1", "grid--2", "grid--3", "grid--4");

    if (count === 1) {
        grid.classList.add("grid--1");
    } else if (count === 2) {
        grid.classList.add("grid--2");
    } else if (count === 3) {
        grid.classList.add("grid--3");
    } else {
        grid.classList.add("grid--4");
    }
}

function createCameraCard(cam) {
    const name = escapeHtml(cam.name);
    const location = escapeHtml(cam.location);
    const path = escapeHtml(cam.path);
    const source = escapeHtml(sourceLabel(cam.type));

    return `
        <article class="camera-card camera-card--reconnecting" id="card-${cam.id}">
            <div class="camera-card__header">
                <div class="camera-card__title">
                    <span class="camera-card__icon" aria-hidden="true">⏺</span>
                    <div>
                        <h2 class="camera-card__name">${name}</h2>
                        <p class="camera-card__location">${location}</p>
                    </div>
                </div>
                <div class="badge badge--reconnecting" id="${cam.id}-badge">
                    <span class="badge-dot badge-dot--reconnecting" id="${cam.id}-dot"></span>
                    <span class="badge-label" id="${cam.id}-label">RECONNECTING</span>
                </div>
            </div>

            <div class="camera-card__video-wrap">
                <video id="${cam.id}" autoplay muted playsinline></video>
                <div class="video-overlay" id="${cam.id}-overlay">
                    <span class="video-overlay__spinner"></span>
                    <span id="${cam.id}-overlay-msg">Connecting…</span>
                </div>
            </div>

            <div class="camera-card__event" id="${cam.id}-event" data-type="waiting">
                Waiting for connection…
            </div>

            <div class="camera-card__meta">
                <div class="meta-item">
                    <span class="meta-item__label">Source</span>
                    <span class="meta-item__value">${source}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-item__label">Protocol</span>
                    <span class="meta-item__value">WebRTC</span>
                </div>
                <div class="meta-item">
                    <span class="meta-item__label">Path</span>
                    <span class="meta-item__value">${path}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-item__label">Reconnects</span>
                    <span class="meta-item__value" id="${cam.id}-reconnects">0</span>
                </div>
            </div>
        </article>
    `;
}

function buildGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = cameras.map(createCameraCard).join("");
    setGridLayout();
}

function getCameraState(cam) {
    return {
        ...cam,
        card: document.getElementById(`card-${cam.id}`),
        video: document.getElementById(cam.id),
        badge: document.getElementById(`${cam.id}-badge`),
        badgeDot: document.getElementById(`${cam.id}-dot`),
        badgeLabel: document.getElementById(`${cam.id}-label`),
        overlay: document.getElementById(`${cam.id}-overlay`),
        overlayMsg: document.getElementById(`${cam.id}-overlay-msg`),
        eventLine: document.getElementById(`${cam.id}-event`),
        reconnectsEl: document.getElementById(`${cam.id}-reconnects`),
        reconnectCount: 0,
        isLive: false,
        track: null,
    };
}

function updateHeaderStats() {
    const active = cameraStates.filter((c) => c.isLive).length;
    const total = cameras.length;
    const totalReconnects = cameraStates.reduce((sum, c) => sum + c.reconnectCount, 0);

    const activeEl = document.getElementById("stat-active");
    activeEl.textContent = `${active} / ${total}`;
    activeEl.dataset.level = active === total ? "ok" : active === 0 ? "down" : "partial";

    document.getElementById("stat-cameras").textContent = String(total);
    document.getElementById("stat-reconnects").textContent = String(totalReconnects);
}

function setStatus(camera, statusKey) {
    const { label, dotClass, badgeClass, cardClass } = STATUS[statusKey];

    camera.isLive = statusKey === "LIVE";
    camera.card.className = `camera-card ${cardClass}`;
    camera.badge.className = `badge ${badgeClass}`;
    camera.badgeDot.className = `badge-dot ${dotClass}`;
    camera.badgeLabel.textContent = label;

    camera.overlay.hidden = camera.isLive;
    if (!camera.isLive) {
        camera.overlayMsg.textContent = camera.reconnectCount > 0 ? "Reconnecting…" : "Connecting…";
    }

    updateHeaderStats();
}

function setEvent(camera, message) {
    camera.eventLine.textContent = `${message} @ ${formatTime()}`;
    camera.eventLine.dataset.type = message.toLowerCase();
}

function bindTrack(camera, track) {
    if (camera.track) {
        camera.track.onended = null;
    }

    camera.track = track;
    track.onended = () => {
        setStatus(camera, "RECONNECTING");
        setEvent(camera, "Stream ended");
    };
}

function handleTrack(camera, evt) {
    if (evt.track.kind !== "video") {
        return;
    }

    camera.video.srcObject = evt.streams[0];
    bindTrack(camera, evt.track);
    setStatus(camera, "LIVE");
    setEvent(camera, "Connected");
}

function handleError(camera, err) {
    console.warn(`[${camera.id}] ${camera.whepUrl}`, err);

    camera.reconnectCount += 1;
    camera.reconnectsEl.textContent = String(camera.reconnectCount);

    setStatus(camera, "RECONNECTING");
    setEvent(camera, "Reconnecting");
}

function createReader(camera) {
    return new MediaMTXWebRTCReader({
        url: camera.whepUrl,
        onTrack: (evt) => handleTrack(camera, evt),
        onError: (err) => handleError(camera, err),
    });
}

function showError(message) {
    const grid = document.getElementById("grid");
    grid.innerHTML = `
        <div class="error-state">
            <h2>Configuration Error</h2>
            <p>${escapeHtml(message)}</p>
            <p class="error-state__hint">Make sure <code>cameras.json</code> exists in the UI folder. Run <code>python3 scripts/generate_mediamtx.py</code> first.</p>
        </div>
    `;
}

function startReaders() {
    cameras.forEach((cam) => {
        const camera = getCameraState(cam);
        cameraStates.push(camera);
        readers.push(createReader(camera));
    });

    updateHeaderStats();
}

async function init() {
    try {
        await loadConfig();
        buildGrid();
        startReaders();
    } catch (err) {
        console.error(err);
        showError(err.message);
    }
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("beforeunload", () => {
    readers.forEach((reader) => reader.close());
});
