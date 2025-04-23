#!/usr/bin/env python3
"""
worker.py – local clip-generator
Polls Firestore every POLL_SEC; for any lesson still “uploading” it:

  • downloads the master video
  • cuts clips with clipper_util.slice_session
  • uploads clips to the same bucket
  • writes manifests, flips status → “ready”
"""

from __future__ import annotations
import os, time, pathlib, tempfile, shutil, logging, traceback
from urllib.parse import urlparse

from google.cloud import firestore, storage
from clipper_util import slice_session

# ── config ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s: %(message)s",
)

POLL_SEC    = int(os.getenv("POLL_SEC", "15"))
CLIP_BUCKET = os.getenv("CLIP_BUCKET", "roblox-lms.firebasestorage.app")

db  = firestore.Client()
gcs = storage.Client()
bucket = gcs.bucket(CLIP_BUCKET)

# ── helpers ───────────────────────────────────────────────────────────────
def _parse_gs(uri: str) -> tuple[str, str]:
    u = urlparse(uri)
    if u.scheme != "gs" or not u.netloc:
        raise ValueError(f"bad gs:// URI → {uri}")
    return u.netloc, u.path.lstrip("/")

def _earliest_event_ts(session_id: str) -> float | None:
    """Return first room-event timestamp (seconds) or None."""
    evts = (
        db.collection("sessions")
          .document(session_id)
          .collection("roomEvents")
          .order_by("timestamp")
          .limit(1)
          .stream()
    )
    for snap in evts:
        ts = snap.to_dict().get("timestamp")
        return ts.timestamp() if hasattr(ts, "timestamp") else float(ts)
    return None

# ── core ──────────────────────────────────────────────────────────────────
def handle_lesson(lesson_id: str) -> None:
    lesson = db.document(f"lessons/{lesson_id}").get().to_dict() or {}
    if lesson.get("status") != "uploading":
        return

    # ── download master ──────────────────────────────────────────────────
    bucket_name, obj_key = _parse_gs(lesson["masterVideoPath"])
    master_blob = gcs.bucket(bucket_name).blob(obj_key)

    tmpdir = pathlib.Path(tempfile.mkdtemp(prefix="roblox_clip_"))
    local  = tmpdir / pathlib.Path(obj_key).name
    logging.info("⬇️  gs://%s → %s", master_blob.name, local)
    master_blob.download_to_filename(local)

    # ── choose t0 ---------------------------------------------------------
    earliest_evt = _earliest_event_ts(lesson_id)
    sess   = db.document(f"sessions/{lesson_id}").get().to_dict() or {}

    raw    = sess.get("obsT0")
    obs_t0 = (raw.timestamp() if hasattr(raw, "timestamp") else float(raw)
            ) if raw is not None else None

    t0 = min(x for x in (earliest_evt, obs_t0) if x is not None)
    logging.info("⏱  earliestEvent=%.3f  obsT0=%.3f  → t0=%.3f",
                 earliest_evt or -1, obs_t0, t0)

    # ── slice -------------------------------------------------------------
    manifest = slice_session(lesson_id, str(local), t0=t0, out_dir=tmpdir)
    logging.info("✂️  %d clips", len(manifest))
    if not manifest:
        logging.warning("🕒 0 clips – keep status 'uploading'")
        shutil.rmtree(tmpdir, ignore_errors=True)
        return

    # ── upload clips & write Firestore -----------------------------------
    batch      = db.batch()
    sess_ref   = db.document(f"sessions/{lesson_id}")
    lesson_ref = db.document(f"lessons/{lesson_id}")

    for item in manifest:
        p = pathlib.Path(item["clipUrl"])
        gcs_key = f"clips/{lesson_id}/{p.name}"
        blob    = bucket.blob(gcs_key)

        logging.info("⬆️  %s", gcs_key)
        blob.upload_from_filename(p, content_type="video/mp4")
        blob.make_public()
        item["clipUrl"] = blob.public_url

    batch.set(sess_ref, {"clips": manifest}, merge=True)
    batch.set(
        lesson_ref,
        {
            "status": "ready",
            "chapters": [
                {"roomId": m["roomID"], "clipUrl": m["clipUrl"], "order": i}
                for i, m in enumerate(manifest)
            ],
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )
    batch.commit()
    shutil.rmtree(tmpdir, ignore_errors=True)
    logging.info("✅ lesson %s ready", lesson_id)

# ── poll loop ─────────────────────────────────────────────────────────────
def main() -> None:
    logging.info("worker polling every %ss  bucket=%s", POLL_SEC, CLIP_BUCKET)
    while True:
        try:
            for snap in (
                db.collection("lessons")
                  .where("status", "==", "uploading")
                  .stream()
            ):
                try:
                    handle_lesson(snap.id)
                except Exception:
                    logging.error("lesson %s FAILED\n%s",
                                  snap.id, traceback.format_exc())
        except Exception:
            logging.error("poll loop error\n%s", traceback.format_exc())

        time.sleep(POLL_SEC)

if __name__ == "__main__":
    main()
