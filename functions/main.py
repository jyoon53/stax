"""
process_video
─────────────
Cloud Function (Python 3.11, trigger = Storage Finalize)
Cuts gs://<CLIP_BUCKET>/master/<sessionId>.mp4 into per‑room clips,
uploads them to clips/<sessionId>/, and creates lessons/<sessionId>.
"""

from __future__ import annotations
import os, pathlib, tempfile
from typing import Dict, List

from clipper_util import slice_session  # ← local import (same folder)

# ── runtime clients are created lazily inside the handler ──────────────
BUCKET_NAME = os.environ["CLIP_BUCKET"].strip()        # e.g. roblox-lms


def _clients():
    from google.cloud import storage, firestore
    return storage.Client(), firestore.Client()


# tiny helpers ----------------------------------------------------------
def _download(bucket, key: str, dst: pathlib.Path) -> None:
    bucket.blob(key).download_to_filename(dst)


def _upload(bucket, src: pathlib.Path, key: str) -> None:
    bucket.blob(key).upload_from_filename(src)


# entry‑point -----------------------------------------------------------
def process_video(event: Dict, _ctx) -> None:
    name = event.get("name", "")                       # "master/abc123.mp4"
    if not name.startswith("master/") or not name.endswith(".mp4"):
        return                                         # ignore other objects

    if not BUCKET_NAME:
        raise RuntimeError("CLIP_BUCKET env var not set in Cloud Functions")

    session_id = pathlib.Path(name).stem               # "abc123"
    print(f"⚙︎  slicing {name} (session id {session_id})")

    gcs, db = _clients()
    bucket = gcs.bucket(BUCKET_NAME)

    # 1 · obsT0 if present
    t0 = 0.0
    sess_snap = db.document(f"sessions/{session_id}").get()
    if sess_snap.exists and "obsT0" in sess_snap.to_dict():
        t0 = sess_snap.to_dict()["obsT0"].timestamp()
        print("⏱️  obsT0 =", t0)

    # 2 · download + slice
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = pathlib.Path(tmpdir)
        local_master = tmpdir / f"{session_id}.mp4"
        _download(bucket, name, local_master)

        manifest: List[dict] = slice_session(
            session_id,
            str(local_master),
            t0=t0,
            out_dir=tmpdir,
        )

        # 3 · upload clips & rewrite URLs
        for item in manifest:
            clip_path = pathlib.Path(item["clipUrl"])
            gcs_key   = f"clips/{session_id}/{clip_path.name}"
            _upload(bucket, clip_path, gcs_key)
            item["clipUrl"] = (
                f"https://stax-roblox.vercel.app/clips/{session_id}/{clip_path.name}"
            )

    # 4 · Firestore batch write
    from google.cloud import firestore  # import inside runtime
    batch = db.batch()

    # (a) store manifest on session doc
    batch.set(
        db.document(f"sessions/{session_id}"),
        {"clips": manifest, "processedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )

    # (b) create / update lesson doc consumed by the LMS
    batch.set(
        db.document(f"lessons/{session_id}"),
        {
            "title":   session_id,
            "status":  "ready",
            "chapters": [
                {"roomId": m["roomID"], "clipUrl": m["clipUrl"], "order": i}
                for i, m in enumerate(manifest)
            ],
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    batch.commit()
    print(f"✅  {len(manifest)} clips uploaded — lesson “{session_id}” ready")
