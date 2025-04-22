"""
clipper_util.py
───────────────────────────────────────────────────────────────────────────────
Shared helpers for

  • scripts/clipper.py   (local slicing on your laptop)
  • functions/main.py    (Cloud Function in GCP)

Heavy dependencies (Firestore, ffmpeg) are pulled lazily so that **importing**
this module never needs ADC (Application‑Default‑Credentials).
"""
from __future__ import annotations

import pathlib
import subprocess
import tempfile
import functools
import collections
from typing import List, Dict, Tuple, Union

# ────────────────────────────── 1. Firestore (lazy) ─────────────────────────
@functools.lru_cache(maxsize=1)
def _db():
    """
    Returns a memoised google.cloud.firestore.Client.
    First call happens from slice_session → OK when running in GCP.
    """
    from google.cloud import firestore
    return firestore.Client()


def _to_seconds(ts: Union[int, float, "google.cloud.firestore_v1._helpers.Timestamp"]) -> float:
    """
    Normalize a Firestore Timestamp or numeric value to a Python float (seconds).
    """
    if hasattr(ts, "timestamp"):
        # Firestore Timestamp
        return ts.timestamp()
    return float(ts)

# ────────────────────────────── 2. ffmpeg helper ────────────────────────────
def _ffmpeg_cut(src: str, start_s: float, end_s: float, dst: pathlib.Path) -> None:
    """
    Copy‐codec clip (≈ instant for MP4/MOV). Requires ffmpeg in $PATH.
    """
    dur = max(0.10, end_s - start_s)
    cmd = [
        "ffmpeg",
        "-nostdin",
        "-loglevel", "error",
        "-y",
        "-ss", f"{start_s:.3f}",
        "-t",  f"{dur:.3f}",
        "-i",  src,
        "-c",  "copy",
        dst.as_posix(),
    ]
    subprocess.run(cmd, check=True)

# ────────────────────────────── 3. helpers on roomEvents ────────────────────
def _fetch_events(session_id: str):
    """Yields roomEvents ordered by timestamp."""
    return (
        _db()
        .collection("sessions").document(session_id)
        .collection("roomEvents")
        .order_by("timestamp")
        .stream()
    )


def _pair_enter_exit(events) -> Dict[str, List[Tuple[Union[int, float], Union[int, float]]]]:
    """
    Returns { roomID: [(enterTS, exitTS), …] }.
    Unmatched events are ignored (robust against missing “exit”).
    """
    by_room: Dict[str, List[Tuple[str, Union[int, float]]]] = collections.defaultdict(list)
    for snap in events:
        e = snap.to_dict() or {}
        typ = e.get("eventType")
        ts  = e.get("timestamp")
        if typ in ("enter", "exit") and ts is not None:
            by_room[e["roomID"]].append((typ, ts))

    ranges: Dict[str, List[Tuple[Union[int, float], Union[int, float]]]] = collections.defaultdict(list)
    for rid, evts in by_room.items():
        stack: List[Union[int, float]] = []
        for typ, ts in evts:
            if typ == "enter":
                stack.append(ts)
            elif typ == "exit" and stack:
                start_ts = stack.pop(0)
                ranges[rid].append((start_ts, ts))
    return ranges

# ────────────────────────────── 4. public API ───────────────────────────────
def slice_session(
    session_id: str,
    video_path: str,
    *,
    t0: float = 0.0,
    out_dir: Union[str, pathlib.Path, None] = None,
) -> List[Dict]:
    """
    Cuts <video_path> into per‐room clips according to enter/exit events.

    Returns a *manifest* list – each item:
        {
          "roomID":      "R2",
          "clipUrl":     "/tmp/roblox_clips/abc_R2_1.mp4",
          "startOffset": 12.3,
          "endOffset":   45.6,
          "idx":         1
        }
    """
    out_dir = pathlib.Path(out_dir or tempfile.gettempdir()) / "roblox_clips"
    out_dir.mkdir(parents=True, exist_ok=True)

    events = list(_fetch_events(session_id))
    ranges = _pair_enter_exit(events)

    manifest: List[Dict] = []
    for rid, spans in ranges.items():
        for idx, (enter_ts, exit_ts) in enumerate(spans, 1):
            # Normalize timestamps to seconds
            enter_s = _to_seconds(enter_ts)
            exit_s  = _to_seconds(exit_ts)

            start = enter_s - t0
            end   = exit_s  - t0
            if start < 0 or end <= start:
                continue  # ignore corrupt pairs

            dst = out_dir / f"{session_id}_{rid}_{idx}.mp4"
            _ffmpeg_cut(video_path, start, end, dst)

            manifest.append({
                "roomID":      rid,
                "clipUrl":     dst.as_posix(),
                "startOffset": start,
                "endOffset":   end,
                "idx":         idx,
            })

    return manifest
