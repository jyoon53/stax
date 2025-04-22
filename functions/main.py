"""
functions/main.py
──────────────────────────────────────────────────────────────────────────────
Cloud Function (Python 3.11, Storage *finalize* trigger)

  • Listens to:  gs://<CLIP_BUCKET>/master/<sessionId>.mp4  (or .mov)
  • Runs        clipper_util.slice_session()  → per‑room clips
  • Writes      clips/<sessionId>/<clip>.mp4   (public‑read for demo)
  • Updates     lessons/<sessionId>            (Firestore doc the LMS watches)
"""

import os
import pathlib
import tempfile
import logging
from typing import List, Dict

from firebase_functions import storage_fn
import firebase_functions
from google.cloud import storage, firestore

# ─────────────────────────── ffmpeg on PATH setup ───────────────────────────
# Use imageio-ffmpeg for a bundled ffmpeg binary
from imageio_ffmpeg import get_ffmpeg_exe

_ffmpeg_exe = get_ffmpeg_exe()
_ffmpeg_dir = os.path.dirname(_ffmpeg_exe)
# Prepend ffmpeg binary directory so subprocess can call 'ffmpeg'
os.environ["PATH"] = f"{_ffmpeg_dir}{os.pathsep}{os.environ['PATH']}"

from clipper_util import slice_session  # local slicing helper

# ───────────────────────────── 1. bucket name ──────────────────────────────
# Prefer env var CLIP_BUCKET, then functions config "clip.bucket"
_bucket_env = os.getenv("CLIP_BUCKET", "").strip()
_bucket_cfg = (
    firebase_functions.runtime().config().get("clip", {}).get("bucket", "")
    if hasattr(firebase_functions, "runtime") else ""
)
BUCKET_NAME: str = _bucket_env or _bucket_cfg

if not BUCKET_NAME:
    logging.warning(
        "⚠️  CLIP_BUCKET not set (env or functions:config). "
        "Emulator will use wildcard bucket."
    )

# ───────────────────────────── 2. Cloud Function ───────────────────────────
# Use wildcard bucket when BUCKET_NAME is empty (for emulator introspection)
@storage_fn.on_object_finalized(
    bucket=BUCKET_NAME or "*",
    event_type="google.cloud.storage.object.v1.finalized",
)
def process_video(
    event: storage_fn.CloudEvent[storage_fn.StorageObjectData], _ctx=None
) -> None:
    """Auto‑clips new master videos uploaded under 'master/' prefix."""
    if not BUCKET_NAME:
        logging.error("❌  No CLIP_BUCKET configured; skipping processing.")
        return

    obj_name: str = event.data.name or ""
    # Only process files under 'master/'
    if not obj_name.startswith("master/"):
        return
    # Only handle .mp4 or .mov
    if not obj_name.lower().endswith((".mp4", ".mov")):
        logging.info("Ignoring non-video file %s", obj_name)
        return

    # Derive sessionId from filename stem
    session_id = pathlib.Path(obj_name).stem
    logging.info("⚙︎  Slicing %s  (session id=%s)", obj_name, session_id)

    # Initialize GCS and Firestore clients
    gcs = storage.Client()
    db = firestore.Client()
    bucket = gcs.bucket(BUCKET_NAME)

    # ── 1. Fetch OBS t0 offset if present ───────────────────────────────
    t0 = 0.0
    sess_ref = db.document(f"sessions/{session_id}")
    sess_doc = sess_ref.get()
    if sess_doc.exists:
        data = sess_doc.to_dict() or {}
        obs_t0 = data.get("obsT0")
        if hasattr(obs_t0, "timestamp"):
            t0 = obs_t0.timestamp()
            logging.info("⏱️  obsT0 = %s", t0)

    # ── 2. Download master & slice ───────────────────────────────────────
    with tempfile.TemporaryDirectory() as tmpdir:
        local_master = pathlib.Path(tmpdir) / f"{session_id}.mp4"
        bucket.blob(obj_name).download_to_filename(local_master)

        try:
            manifest: List[Dict] = slice_session(
                session_id, str(local_master), t0=t0, out_dir=tmpdir
            )
        except Exception as err:
            logging.exception("slice_session failed: %s", err)
            sess_ref.set({"status": "error", "processingError": str(err)}, merge=True)
            return

        # ── 3. Upload clips (public-read for demo) ────────────────────────
        for item in manifest:
            clip_path = pathlib.Path(item.get("clipUrl", ""))
            gcs_key = f"clips/{session_id}/{clip_path.name}"
            clip_blob = bucket.blob(gcs_key)
            clip_blob.upload_from_filename(clip_path)
            clip_blob.make_public()
            item["clipUrl"] = clip_blob.public_url

    # ── 4. Firestore batch write ────────────────────────────────────────
    batch = db.batch()

    # (a) Attach manifest to sessions/{id}
    batch.set(
        sess_ref,
        {"clips": manifest, "processedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )

    # (b) Update lessons/{id} for the LMS UI
    lesson_ref = db.document(f"lessons/{session_id}")
    batch.set(
        lesson_ref,
        {
            "title": session_id,
            "status": "ready",
            "chapters": [
                {"roomId": m.get("roomID"), "clipUrl": m.get("clipUrl"), "order": i}
                for i, m in enumerate(manifest)
            ],
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    batch.commit()
    logging.info(
        "✅  %d clips uploaded — lesson '%s' ready",
        len(manifest), session_id
    )
