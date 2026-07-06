#!/usr/bin/env python3
"""Generate mediamtx.yml and UI/cameras.json from the root cameras.json."""

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAMERAS_FILE = ROOT / "cameras.json"
MEDIAMTX_FILE = ROOT / "mediamtx.yml"
UI_CAMERAS_FILE = ROOT / "UI" / "cameras.json"


def load_cameras():
    if not CAMERAS_FILE.exists():
        print(f"Error: {CAMERAS_FILE} not found", file=sys.stderr)
        sys.exit(1)

    with CAMERAS_FILE.open(encoding="utf-8") as f:
        data = json.load(f)

    if "cameras" not in data or not isinstance(data["cameras"], list):
        print("Error: cameras.json must contain a 'cameras' array", file=sys.stderr)
        sys.exit(1)

    if not data["cameras"]:
        print("Error: cameras array is empty", file=sys.stderr)
        sys.exit(1)

    return data


def validate_camera(camera, index):
    required = ("id", "name", "path", "type")
    for field in required:
        if field not in camera or not camera[field]:
            print(f"Error: camera[{index}] missing required field '{field}'", file=sys.stderr)
            sys.exit(1)

    cam_type = camera["type"]
    if cam_type not in ("publisher", "rtsp"):
        print(f"Error: camera '{camera['id']}' has invalid type '{cam_type}'", file=sys.stderr)
        sys.exit(1)

    if cam_type == "rtsp" and not camera.get("rtspUrl"):
        print(f"Error: camera '{camera['id']}' type 'rtsp' requires 'rtspUrl'", file=sys.stderr)
        sys.exit(1)


def build_mediamtx_yaml(cameras):
    lines = ["paths:"]

    for camera in cameras:
        path = camera["path"]
        cam_type = camera["type"]

        lines.append(f"  {path}:")

        if cam_type == "publisher":
            lines.append("    source: publisher")
        else:
            lines.append(f"    source: {camera['rtspUrl']}")
            lines.append("    sourceOnDemand: yes")
            if camera.get("rtspTransport"):
                lines.append(f"    rtspTransport: {camera['rtspTransport']}")

    lines.append("")
    return "\n".join(lines)


def main():
    data = load_cameras()

    for i, camera in enumerate(data["cameras"]):
        validate_camera(camera, i)

    paths = {c["path"] for c in data["cameras"]}
    if len(paths) != len(data["cameras"]):
        print("Error: duplicate 'path' values found in cameras.json", file=sys.stderr)
        sys.exit(1)

    yaml_content = build_mediamtx_yaml(data["cameras"])
    MEDIAMTX_FILE.write_text(yaml_content, encoding="utf-8")
    print(f"Generated {MEDIAMTX_FILE}")

    shutil.copy2(CAMERAS_FILE, UI_CAMERAS_FILE)
    print(f"Copied  {UI_CAMERAS_FILE}")

    rtsp_count = sum(1 for c in data["cameras"] if c["type"] == "rtsp")
    pub_count = sum(1 for c in data["cameras"] if c["type"] == "publisher")
    print(f"Configured {len(data['cameras'])} camera(s): {pub_count} publisher, {rtsp_count} RTSP pull")


if __name__ == "__main__":
    main()
