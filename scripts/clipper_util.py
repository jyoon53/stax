"""
clipper_util.py
~~~~~~~~~~~~~~~
Pure-python helper used by worker.py
"""
from __future__ import annotations
import pathlib, subprocess, tempfile, functools, collections, logging
from typing import List, Dict, Tuple, Union

# ───────────────── Firestore (lazy) ─────────────────
@functools.lru_cache(maxsize=1)
def _db():
    from google.cloud import firestore
    return firestore.Client()

def _to_seconds(ts: Union[int, float, "google.cloud.firestore_v1._helpers.Timestamp"]) -> float:
    return ts.timestamp() if hasattr(ts, "timestamp") else float(ts)

# ───────────────── ffmpeg clip helper ───────────────
def _ffmpeg_cut(src: str, start_s: float, end_s: float, dst: pathlib.Path) -> None:
    dur = max(0.10, end_s - start_s)
    cmd = [
        "ffmpeg", "-nostdin", "-loglevel", "error", "-y",
        "-ss", f"{start_s:.3f}", "-t", f"{dur:.3f}",
        "-i", src, "-c", "copy", dst.as_posix()
    ]
    subprocess.run(cmd, check=True)

# ───────────────── pair enter/exit helper ───────────
def _fetch_events(session_id: str):
    return (_db().collection("sessions").document(session_id)
                 .collection("roomEvents").order_by("timestamp").stream())

def _pair_enter_exit(events):
    by_room = collections.defaultdict(list)
    for snap in events:
        e   = snap.to_dict() or {}
        typ = e.get("eventType")
        ts  = e.get("timestamp")
        if typ in ("enter", "exit") and ts is not None:
            by_room[e["roomID"]].append((typ, ts))

    ranges = collections.defaultdict(list)
    for rid, evts in by_room.items():
        stack = []
        for typ, ts in evts:
            if typ == "enter":
                stack.append(ts)
            elif typ == "exit" and stack:
                ranges[rid].append((stack.pop(0), ts))
    return ranges

# ───────────────── public API ───────────────────────
def slice_session(
    session_id: str,
    video_path: str,
    *, t0: float = 0.0,
    out_dir: Union[str, pathlib.Path, None] = None
) -> List[Dict]:
    out_dir = pathlib.Path(out_dir or tempfile.gettempdir()) / "roblox_clips"
    out_dir.mkdir(parents=True, exist_ok=True)

    events  = list(_fetch_events(session_id))
    ranges  = _pair_enter_exit(events)

    manifest = []
    for rid, spans in ranges.items():
        for idx, (enter_ts, exit_ts) in enumerate(spans, 1):
            enter_s = _to_seconds(enter_ts)
            exit_s  = _to_seconds(exit_ts)
            start   = enter_s - t0
            end     = exit_s  - t0
            if start < 0 or end <= start:
                continue
            dst = out_dir / f"{session_id}_{rid}_{idx}.mp4"
            _ffmpeg_cut(video_path, start, end, dst)
            manifest.append({
                "roomID"     : rid,
                "clipUrl"    : dst.as_posix(),
                "startOffset": start,
                "endOffset"  : end,
                "idx"        : idx,
            })
    return manifest
