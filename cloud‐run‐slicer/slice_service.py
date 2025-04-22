# cloud-run-slicer/slice_service.py
import os, tempfile, pathlib, logging
from flask import Flask, request, jsonify
from google.cloud import storage, firestore
from clipper_util import slice_session  # reuse your existing slicer util

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route("/slice", methods=["POST"])
def slice_video():
    data = request.get_json(force=True)
    session_id = data["sessionId"]
    bucket_name = data["bucket"]  # e.g. "roblox-lms.firebasestorage.app"

    logging.info(f"🔔 slice_video called for session={session_id} bucket={bucket_name}")

    # 1) download master
    tmp = tempfile.mkdtemp()
    local_master = pathlib.Path(tmp) / f"{session_id}.mp4"
    storage.Client().bucket(bucket_name).blob(f"master/{session_id}.mp4") \
        .download_to_filename(local_master)
    logging.info(f"⬇️ Downloaded master to {local_master}")

    # 2) fetch obsT0
    db = firestore.Client()
    sess = db.document(f"sessions/{session_id}").get().to_dict() or {}
    t0 = sess.get("obsT0")
    if hasattr(t0, "timestamp"):
        t0 = t0.timestamp()
    else:
        t0 = float(t0 or 0.0)
    logging.info(f"⏱ Using t0 = {t0}")

    # 3) slice
    manifest = slice_session(session_id, str(local_master), t0=t0, out_dir=tmp)
    logging.info(f"✂️  slice_session returned {len(manifest)} clips")

    # 4) upload and update Firestore (same as your CF logic)
    bucket = storage.Client().bucket(bucket_name)
    batch = db.batch()
    sess_ref   = db.document(f"sessions/{session_id}")
    lesson_ref = db.document(f"lessons/{session_id}")

    for item in manifest:
        clip = pathlib.Path(item["clipUrl"])
        gcs_key = f"clips/{session_id}/{clip.name}"
        bucket.blob(gcs_key).upload_from_filename(clip)
        bucket.blob(gcs_key).make_public()
        item["clipUrl"] = bucket.blob(gcs_key).public_url

    batch.set(sess_ref, {"clips": manifest}, merge=True)
    batch.set(
        lesson_ref,
        {
            "status":   "ready",
            "chapters": [
                {"roomId": m["roomID"], "clipUrl": m["clipUrl"], "order": i}
                for i, m in enumerate(manifest)
            ],
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )
    batch.commit()
    logging.info("✅  All clips uploaded and Firestore updated")

    return jsonify({"status": "ok", "clips": manifest})
