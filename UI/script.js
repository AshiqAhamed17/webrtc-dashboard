"use strict";

const WHEP_URL = "http://localhost:8889/live/whep";

const CAMERAS = [
    { id: "cam1", name: "Camera 1" },
    { id: "cam2", name: "Camera 2" },
    { id: "cam3", name: "Camera 3" },
    { id: "cam4", name: "Camera 4" },
];

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

function formatTime() {
    return new Date().toLocaleTimeString();
}

function createCameraCard({ id, name }) {
    return `
        <article class="camera-card camera-card--reconnecting" id="card-${id}">
            <div class="camera-card__header">
                <div class="camera-card__title">
                    <span class="camera-card__icon" aria-hidden="true">⏺</span>
                    <h2 class="camera-card__name">${name}</h2>
                </div>
                <div class="badge badge--reconnecting" id="${id}-badge">
                    <span class="badge-dot badge-dot--reconnecting" id="${id}-dot"></span>
                    <span class="badge-label" id="${id}-label">RECONNECTING</span>
                </div>
            </div>

            <div class="camera-card__video-wrap">
                <video id="${id}" autoplay muted playsinline></video>
                <div class="video-overlay" id="${id}-overlay">
                    <span class="video-overlay__spinner"></span>
                    <span id="${id}-overlay-msg">Connecting…</span>
                </div>
            </div>

            <div class="camera-card__event" id="${id}-event" data-type="waiting">
                Waiting for connection…
            </div>

            <div class="camera-card__meta">
                <div class="meta-item">
                    <span class="meta-item__label">Source</span>
                    <span class="meta-item__value">RTSP</span>
                </div>
                <div class="meta-item">
                    <span class="meta-item__label">Protocol</span>
                    <span class="meta-item__value">WebRTC</span>
                </div>
                <div class="meta-item">
                    <span class="meta-item__label">Codec</span>
                    <span class="meta-item__value">H.264</span>
                </div>
                <div class="meta-item">
                    <span class="meta-item__label">Reconnects</span>
                    <span class="meta-item__value" id="${id}-reconnects">0</span>
                </div>
            </div>
        </article>
    `;
}

function buildGrid() {
    document.getElementById("grid").innerHTML = CAMERAS.map(createCameraCard).join("");
}

function getCameraState({ id }) {
    return {
        id,
        card: document.getElementById(`card-${id}`),
        video: document.getElementById(id),
        badge: document.getElementById(`${id}-badge`),
        badgeDot: document.getElementById(`${id}-dot`),
        badgeLabel: document.getElementById(`${id}-label`),
        overlay: document.getElementById(`${id}-overlay`),
        overlayMsg: document.getElementById(`${id}-overlay-msg`),
        eventLine: document.getElementById(`${id}-event`),
        reconnectsEl: document.getElementById(`${id}-reconnects`),
        reconnectCount: 0,
        isLive: false,
        track: null,
    };
}

function updateHeaderStats() {
    const active = cameraStates.filter((c) => c.isLive).length;
    const total = CAMERAS.length;
    const totalReconnects = cameraStates.reduce((sum, c) => sum + c.reconnectCount, 0);

    const activeEl = document.getElementById("stat-active");
    activeEl.textContent = `${active} / ${total}`;
    activeEl.dataset.level = active === total ? "ok" : active === 0 ? "down" : "partial";

    document.getElementById("stat-reconnects").textContent = String(totalReconnects);
}

function setStatus(camera, statusKey) {
    const { label, dotClass, badgeClass, cardClass } = STATUS[statusKey];

    camera.isLive = statusKey === "LIVE";
    camera.card.className = `camera-card ${cardClass}`;
    camera.badge.className = `badge ${badgeClass}`;
    camera.badgeDot.className = `badge-dot ${dotClass}`;
    camera.badgeLabel.textContent = label;

    // Hide overlay only when live; show spinner when reconnecting
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
    console.warn(`[${camera.id}]`, err);

    camera.reconnectCount += 1;
    camera.reconnectsEl.textContent = String(camera.reconnectCount);

    setStatus(camera, "RECONNECTING");
    setEvent(camera, "Reconnecting");
}

function createReader(camera) {
    return new MediaMTXWebRTCReader({
        url: WHEP_URL,
        onTrack: (evt) => handleTrack(camera, evt),
        onError: (err) => handleError(camera, err),
    });
}

function init() {
    buildGrid();

    CAMERAS.forEach((config) => {
        const camera = getCameraState(config);
        cameraStates.push(camera);
        readers.push(createReader(camera));
    });

    updateHeaderStats();
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("beforeunload", () => {
    readers.forEach((reader) => reader.close());
});
