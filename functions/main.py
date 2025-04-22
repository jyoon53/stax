"""
functions/main.py
───────────────────────────────────────────────────────────────────────────────
Google Cloud Function  •  Python 3.11  •  Trigger = Storage “Finalize”

Cuts the master screen‑recording uploaded to

    gs://$CLIP_BUCKET/master/<sessionId>.mp4

into per‑room clips and writes a lesson document.

⚠️  NOTHING that needs Google credentials (Firestore / Storage) is imported
    until *inside* `process_video`, so `firebase deploy` can analyse the module
    without ADC.
"""
from __future__ import annotations

import os
import sys
import pathlib
import tempfile
from typing import Dict, List

# ── 1  import the helper (keeps itself creds‑free) ──────────────────────────
ROOT = pathlib.Path(__file__).resolve().parent.parent       # repo root
sys.path.insert(0, str(ROOT / "scripts"))
from clipper_util import slice_session                      # noqa: E402

# ── 2  read env var *lazily* (may be empty during deploy analysis) ─────────
BUCKET_NAME = os.getenv("CLIP_BUCKET", "").strip()

# ── 3  tiny GCS helpers (client supplied later) ────────────────────────────
def _download_blob(bucket, blob_name: str, dst: pathlib.Path) -> None:
    bucket.blob(blob_name).download_to_filename(dst)


def _upload_blob(bucket, src: pathlib.Path, blob_name: str) -> None:
    bucket.blob(blob_name).upload_from_filename(src)


# ── 4  Cloud Function entry‑point ───────────────────────────────────────────
def process_video(event: Dict, _context) -> None:  # pylint: disable=unused-argument
    """
    Triggered when a new object appears under **master/** in `$CLIP_BUCKET`.
    """
    # -------- early exit for unrelated objects ----------------------------
    name = event.get("name") or ""                       # e.g. master/abc123.mp4
    if not (name.startswith("master/") and name.endswith(".mp4")):
        return

    # -------- runtime‑only sanity check -----------------------------------
    if not BUCKET_NAME:
        raise RuntimeError(
            "CLIP_BUCKET env var is missing in Cloud Functions runtime "
            "(set with `firebase functions:config:set clips.bucket=\"<bucket>\"`)"
        )

    session_id = pathlib.Path(name).stem                 # "abc123"
    print(f"⚙︎  processing {name}  (session id {session_id})")

    # -------- credentials‑requiring imports (safe in CF runtime) ----------
    from google.cloud import storage, firestore
    gcs = storage.Client()
    db: firestore.Client = firestore.Client()
    bucket = gcs.bucket(BUCKET_NAME)

    # -------- 1) obsT0 ----------------------------------------------------
    t0 = 0.0
    sess_snap = db.document(f"sessions/{session_id}").get()
    if sess_snap.exists:
        obs = sess_snap.to_dict().get("obsT0")
        if obs:
            t0 = obs.timestamp()
            print("⏱️  obsT0 (absolute) =", t0)

    # -------- 2) download master + slice ----------------------------------
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        local_master = tmp / f"{session_id}.mp4"
        _download_blob(bucket, name, local_master)

        manifest: List[dict] = slice_session(
            session_id,
            str(local_master),
            t0=t0,
            out_dir=tmp,
        )

        # -------- 3) upload clips & rewrite URLs -------------------------
        for item in manifest:
            clip_path = pathlib.Path(item["clipUrl"])
            gcs_key   = f"clips/{session_id}/{clip_path.name}"
            _upload_blob(bucket, clip_path, gcs_key)
            item["clipUrl"] = (
                f"https://stax-roblox.vercel.app/clips/{session_id}/{clip_path.name}"
            )

    # -------- 4) Firestore batch write -----------------------------------
    batch = db.batch()

    # (a) store manifest on the session (debug / audit)
    batch.set(
        db.document(f"sessions/{session_id}"),
        {"clips": manifest, "processedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )

    # (b) lesson doc consumed by the LMS
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
    print(f"✅  {len(manifest)} clips uploaded — lesson «{session_id}» ready")
