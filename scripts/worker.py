#!/usr/bin/env python3
"""
worker.py
~~~~~~~~~
Polls Firestore for lessons whose status == 'uploading', downloads the master
video, slices it locally with clipper_util, uploads clips to Cloud-Storage, and
marks the lesson ready.

Run this in a screen/tmux session or a systemd service.
"""

import os, time, pathlib, tempfile, shutil, logging, traceback
from google.cloud import firestore, storage
from clipper_util import slice_session

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

POLL_SEC = 15                # how often to poll Firestore
CLIP_BUCKET = os.environ.get("CLIP_BUCKET", "roblox-lms.firebasestorage.app")

db     = firestore.Client()
gcs    = storage.Client()
bucket = gcs.bucket(CLIP_BUCKET)


def handle_lesson(lesson_id: str) -> None:
    doc  = db.document(f"lessons/{lesson_id}").get()
    data = doc.to_dict() or {}
    if data.get("status") != "uploading":
        return                                               # nothing to do

    blob_path = data["masterVideoPath"].replace(f"gs://{CLIP_BUCKET}/", "")
    master_blob = bucket.blob(blob_path)

    tmpdir  = pathlib.Path(tempfile.mkdtemp(prefix="roblox_clip_"))
    local   = tmpdir / master_blob.name.split("/")[-1]

    logging.info("⬇️  downloading gs://%s → %s", master_blob.name, local)
    master_blob.download_to_filename(local)

    # --- find the correct t0 -------------------------------------------------
    sess = db.document(f"sessions/{lesson_id}").get().to_dict() or {}
    raw  = sess.get("obsT0")
    t0   = raw.timestamp() if hasattr(raw, "timestamp") else float(raw or 0.0)
    logging.info("⏱  obsT0 = %s", t0)

    # --- slice ---------------------------------------------------------------
    manifest = slice_session(lesson_id, str(local), t0=t0, out_dir=tmpdir)
    logging.info("✂️  %d clips cut", len(manifest))

    # --- upload back ---------------------------------------------------------
    batch       = db.batch()
    sess_ref    = db.document(f"sessions/{lesson_id}")
    lesson_ref  = db.document(f"lessons/{lesson_id}")

    for item in manifest:
        p        = pathlib.Path(item["clipUrl"])
        gcs_key  = f"clips/{lesson_id}/{p.name}"
        clip_blob = bucket.blob(gcs_key)

        logging.info("⬆️  uploading %s", gcs_key)
        clip_blob.upload_from_filename(p, content_type="video/mp4")
        clip_blob.make_public()
        item["clipUrl"] = clip_blob.public_url

    batch.set(sess_ref, {"clips": manifest}, merge=True)
    batch.set(lesson_ref, {
        "status"  : "ready",
        "chapters": [
            {"roomId": m["roomID"], "clipUrl": m["clipUrl"], "order": i}
            for i, m in enumerate(manifest)
        ],
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    batch.commit()

    shutil.rmtree(tmpdir, ignore_errors=True)
    logging.info("✅ lesson %s ready", lesson_id)


def main() -> None:
    logging.info("worker started - polling every %s s", POLL_SEC)
    while True:
        try:
            for snap in db.collection("lessons")\
                          .where("status", "==", "uploading")\
                          .stream():
                try:
                    handle_lesson(snap.id)
                except Exception:
                    logging.error("lesson %s FAILED\n%s", snap.id, traceback.format_exc())
        except Exception:
            logging.error("poll loop error\n%s", traceback.format_exc())

        time.sleep(POLL_SEC)


if __name__ == "__main__":
    main()
