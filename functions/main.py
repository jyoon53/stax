"""
Google Cloud Functions (2nd gen) entry‑point.
Triggered on any write to sessions/{sessionId}.
Cuts the master video, uploads the clips, patches Firestore.
"""
import os, tempfile, pathlib
from datetime import datetime, timezone

from google.cloud import storage
from firebase_admin import firestore, initialize_app

from clipper_util import slice_session

# One‑time init of Admin SDK & clients
initialize_app()
db  = firestore.client()
gcs = storage.Client()

BUCKET = os.environ.get("CLIP_BUCKET", "roblox-lms")

# ───────────────────────── helpers ──────────────────────────────
def _download(gs_uri: str, tmpdir: str) -> pathlib.Path:
    bucket, key = gs_uri.replace("gs://", "").split("/", 1)
    dst = pathlib.Path(tmpdir) / pathlib.Path(key).name
    gcs.bucket(bucket).blob(key).download_to_filename(dst)
    return dst

def _iso_to_epoch(ts: str) -> float:
    """2025-04-21T19:04:26.123Z → seconds"""
    return datetime.fromisoformat(ts.rstrip("Z")).replace(
        tzinfo=timezone.utc
    ).timestamp()

# ───────────────────────── entry point ─────────────────────────
def process_video(event, context):
    """
    Firestore trigger body (event is raw proto → dict).
    """
    snap   = event["value"]
    sid    = snap["name"].split("/")[-1]
    fields = snap.get("fields", {})

    # Already processed or not yet complete?
    if "clips" in fields:
        return
    if "masterVideoPath" not in fields or "obsT0" not in fields:
        return

    gs_uri = fields["masterVideoPath"]["stringValue"]
    t0     = _iso_to_epoch(fields["obsT0"]["timestampValue"])

    with tempfile.TemporaryDirectory() as tmp:
        video_local = _download(gs_uri, tmp)
        manifest    = slice_session(sid, video_local.as_posix(), t0, tmp)

        # -------- upload each clip & rewrite manifest -------------
        bucket = gcs.bucket(BUCKET)
        for item in manifest:
            src      = pathlib.Path(item["clipUrl"])
            gspath   = f"clips/{sid}/{src.name}"
            bucket.blob(gspath).upload_from_filename(src)
            item["clipUrl"] = f"gs://{BUCKET}/{gspath}"

        # -------- patch session doc -------------------------------
        sess_ref = db.document(f"sessions/{sid}")
        sess_ref.set(
            {"clips": manifest, "processedAt": firestore.SERVER_TIMESTAMP},
            merge=True,
        )

        # -------- (optional) build / merge lesson guide -----------
        sess    = sess_ref.get().to_dict() or {}
        lesson_id = sess.get("lessonId", sid)
        chapters = [
            {"roomId": m["roomID"], "clipUrl": m["clipUrl"], "order": idx}
            for idx, m in enumerate(manifest)
        ]
        db.document(f"lessons/{lesson_id}").set(
            {"chapters": chapters, "updatedAt": firestore.SERVER_TIMESTAMP},
            merge=True,
        )
