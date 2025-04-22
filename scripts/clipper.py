#!/usr/bin/env python3
"""
Slice a master recording into per‑room clips **locally**.

Usage
-----
$ python scripts/clipper.py SESSION_ID \
        [--video ~/Movies/Demo.mov] \
        [--out   ~/Movies/Clips]
"""
import argparse
import pathlib
import sys
import firebase_admin
from firebase_admin import firestore

# ---------------------------------------------------------------------------
# Ensure the folder that holds clipper.py **and** clipper_util.py is on PYTHONPATH
# ---------------------------------------------------------------------------
this_dir = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(this_dir))           # <‑‑ key line

from clipper_util import slice_session      # now guaranteed to work
# ---------------------------------------------------------------------------

# Initialise Admin SDK once
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("session", help="Firestore document ID (sessions/{id})")
    p.add_argument("--video", help="Explicit path to master video")
    p.add_argument("--out",   help="Output directory (default: ~/Movies/Clips)")
    args = p.parse_args()

    # ---------- grab session doc -------------------------------------------
    sess_ref = db.collection("sessions").document(args.session).get()
    if not sess_ref.exists:
        sys.exit("❌  Session not found")

    sess   = sess_ref.to_dict()
    t0     = sess["obsT0"].timestamp()
    video  = args.video or sess.get("masterVideoPath")

    video = pathlib.Path(video).expanduser()
    if not video.exists():
        sys.exit(f"❌  Master video not found: {video}")

    # ---------- run slicer --------------------------------------------------
    out_dir  = pathlib.Path(args.out or (pathlib.Path.home() / "Movies" / "Clips"))
    manifest = slice_session(args.session, str(video), t0, out_dir)

    db.document(f"sessions/{args.session}").set({"clips": manifest}, merge=True)
    print(f"🎉  {len(manifest)} clips → {out_dir}")

if __name__ == "__main__":
    main()
