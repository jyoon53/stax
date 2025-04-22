"""
clipper_util.py
Shared helpers for both:
  • local CLI (scripts/clipper.py)
  • Cloud Function (functions/main.py)
"""
import subprocess, pathlib, tempfile
from collections import defaultdict
from typing import List, Dict

import firebase_admin
from firebase_admin import credentials, firestore

# Initialise once (both locally & in Cloud Functions)
firebase_admin.initialize_app()
db = firestore.client()

# ---------- low‑level helpers -------------------------------------------------
def _ffmpeg_cut(src: str, start_s: float, end_s: float, dst: pathlib.Path) -> None:
    """
    Fast, copy‑codec clip (≈ instant for MP4/MOV).
    """
    dur = max(0.1, end_s - start_s)
    cmd = [
        "ffmpeg", "-nostdin", "-loglevel", "error", "-y",
        "-ss", f"{start_s:.3f}", "-t", f"{dur:.3f}",
        "-i", src, "-c", "copy", dst.as_posix(),
    ]
    subprocess.run(cmd, check=True)

def _fetch_events(session_id: str):
    return (
        db.collection("sessions").document(session_id)
          .collection("roomEvents")
          .order_by("timestamp")
          .stream()
    )

def _pair_enter_exit(events) -> Dict[str, List[tuple]]:
    rooms = defaultdict(list)
    for d in events:
        e = d.to_dict()
        if e["eventType"] in ("enter", "exit"):
            rooms[e["roomID"]].append((e["eventType"], e["timestamp"]))
    ranges = defaultdict(list)
    for rid, evts in rooms.items():
        stack: List[int] = []
        for typ, ts in evts:
            if typ == "enter":
                stack.append(ts)
            elif typ == "exit" and stack:
                ranges[rid].append((stack.pop(0), ts))
    return ranges

# ---------- public API --------------------------------------------------------
def slice_session(session_id: str,
                  video_path: str,
                  t0_epoch: float,
                  out_dir: str | pathlib.Path | None = None) -> List[Dict]:
    """
    Cuts <video_path> according to Roblox enter/exit events and returns a manifest.
    Each manifest item = {
        roomID, clipUrl (local path), startOffset, endOffset, idx
    }
    """
    out_dir = pathlib.Path(out_dir or tempfile.gettempdir()) / "roblox_clips"
    out_dir.mkdir(parents=True, exist_ok=True)

    events = list(_fetch_events(session_id))
    ranges = _pair_enter_exit(events)

    manifest: List[Dict] = []
    for rid, spans in ranges.items():
        for idx, (a, b) in enumerate(spans, 1):
            start = a - t0_epoch
            end   = b - t0_epoch
            if start < 0 or end <= start:
                continue
            dst = out_dir / f"{session_id}_{rid}_{idx}.mp4"
            _ffmpeg_cut(video_path, start, end, dst)
            manifest.append({
                "roomID": rid,
                "clipUrl": dst.as_posix(),
                "startOffset": start,
                "endOffset": end,
                "idx": idx,
            })
    return manifest
