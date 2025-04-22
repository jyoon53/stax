# cloud-run-slicer/slice_service.py
import os
import tempfile
import pathlib
import logging
import shutil
from flask import Flask, request, jsonify
from google.cloud import storage, firestore
from clipper_util import slice_session  # reuse your existing slicer util

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

@app.route("/slice", methods=["POST"])
def slice_video():
    try:
        data = request.get_json(force=True)
        session_id = data.get("sessionId")
        bucket_name = data.get("bucket")
        logging.info(f"🔔 slice_video called for session={session_id}, bucket={bucket_name}")

        if not session_id or not bucket_name:
            raise ValueError("Missing sessionId or bucket in request")

        # 1) Download master (list existing blobs for debugging)
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        tmpdir = tempfile.mkdtemp()
        logging.debug(f"Created temporary dir {tmpdir}")

        # List all blobs under master/ prefix to see what's present
        blobs = list(bucket.list_blobs(prefix=f"master/{session_id}"))
        logging.debug(f"Existing master blobs: {[b.name for b in blobs]}")

        local_master = None
        # Download the first matching blob
        for blob in blobs:
            ext = pathlib.Path(blob.name).suffix
            local_master = pathlib.Path(tmpdir) / f"{session_id}{ext}"
            logging.info(f"⬇️ Downloading {blob.name} to {local_master}")
            blob.download_to_filename(local_master)
            logging.info("Download complete.")
            break

        if local_master is None:
            msg = f"No master video found for session '{session_id}' in bucket '{bucket_name}'"
            logging.error(msg)
            return jsonify({"status": "error", "message": msg}), 404

        # 2) Fetch obsT0
        db = firestore.Client()
        sess_doc = db.document(f"sessions/{session_id}").get()
        if not sess_doc.exists:
            logging.warning(f"No sessions/{session_id} doc; defaulting obsT0=0")
            t0 = 0.0
        else:
            data = sess_doc.to_dict() or {}
            obs = data.get("obsT0")
            if hasattr(obs, "timestamp"):
                t0 = obs.timestamp()
            else:
                t0 = float(obs or 0.0)
            logging.info(f"⏱ Using obsT0 = {t0}")

        # 3) Slice
        logging.debug(f"Starting slice_session on {local_master}")
        manifest = slice_session(session_id, str(local_master), t0=t0, out_dir=tmpdir)
        logging.info(f"✂️ slice_session returned {len(manifest)} clips")
        for i, item in enumerate(manifest):
            logging.debug(f"  Clip {i}: room={item['roomID']} offsets={item['startOffset']}-{item['endOffset']}")

        # 4) Upload clips & update Firestore
        batch = db.batch()
        sess_ref   = db.document(f"sessions/{session_id}")
        lesson_ref = db.document(f"lessons/{session_id}")

        for item in manifest:
            clip_path = pathlib.Path(item["clipUrl"])
            gcs_key   = f"clips/{session_id}/{clip_path.name}"
            clip_blob = bucket.blob(gcs_key)
            logging.info(f"⬆️ Uploading clip to {gcs_key}")
            clip_blob.upload_from_filename(str(clip_path))
            clip_blob.make_public()
            public_url = clip_blob.public_url
            item["clipUrl"] = public_url
            logging.info(f"  Public URL: {public_url}")

        batch.set(sess_ref, {"clips": manifest}, merge=True)
        chapters = [
            {"roomId": m["roomID"], "clipUrl": m["clipUrl"], "order": i}
            for i, m in enumerate(manifest)
        ]
        batch.set(lesson_ref, {"status": "ready", "chapters": chapters}, merge=True)
        batch.commit()
        logging.info("✅ All clips uploaded and Firestore updated")

        # Cleanup
        shutil.rmtree(tmpdir)
        logging.debug(f"Cleaned up temp dir {tmpdir}")

        return jsonify({"status": "ok", "clips": manifest})

    except Exception as e:
        logging.exception("❌ slice_video failed")
        return jsonify({"status": "error", "message": str(e)}), 500
