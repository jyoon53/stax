#!/usr/bin/env python3
"""
Slice a master recording into per‑room clips **locally** and
publish them to Firestore so the LMS shows the lesson automatically.

Usage
-----
python scripts/clipper.py SESSION_ID \
        [--video  ~/Movies/Demo.mov] \
        [--out    ~/Movies/Clips] \
        [--title  "Roblox Basics"] \
        [--desc   "Walk‑through of two rooms"]
"""
import argparse, pathlib, sys, firebase_admin
from firebase_admin import firestore

# ---------------------------------------------------------------------------
# local helper import
# ---------------------------------------------------------------------------
ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from clipper_util import slice_session   # noqa: E402
# ---------------------------------------------------------------------------

if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# ---------------------------------------------------------------------------
def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("session", help="Firestore document ID (sessions/{id})")
    p.add_argument("--video", help="Explicit path to master video")
    p.add_argument("--out",   help="Output directory (default: ~/Movies/Clips)")
    p.add_argument("--title", help="Lesson title (defaults to sessionId)")
    p.add_argument("--desc",  help="Lesson description")
    args = p.parse_args()

    # ---------- fetch session doc ------------------------------------------
    ref = db.collection("sessions").document(args.session).get()
    if not ref.exists:
        sys.exit("❌  Session not found")

    sess   = ref.to_dict()
    t0     = sess["obsT0"].timestamp()
    video  = args.video or sess.get("masterVideoPath")

    video = pathlib.Path(video).expanduser()
    if not video.exists():
        sys.exit(f"❌  Master video not found: {video}")

    # ---------- run slicer --------------------------------------------------
    out_dir  = pathlib.Path(args.out or pathlib.Path.home() / "Movies" / "Clips")
    manifest = slice_session(args.session, str(video), t0, out_dir)

    # ---------- rewrite clipUrl to Vercel URLs -----------------------------
    VERCEL_ROOT = "https://stax-roblox.vercel.app/clips/"
    for m in manifest:
        m["clipUrl"] = VERCEL_ROOT + pathlib.Path(m["clipUrl"]).name

    # ---------- update sessions/{id}.clips ---------------------------------
    db.document(f"sessions/{args.session}").set({"clips": manifest}, merge=True)

    # ---------- create / merge lessons/{id} --------------------------------
    lesson_doc = {
        "title": args.title or args.session,
        "description": args.desc or "",
        "chapters": [
            {
                "roomId":  m["roomID"],
                "clipUrl": m["clipUrl"],
                "order":   i,
            } for i, m in enumerate(manifest)
        ],
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    db.document(f"lessons/{args.session}").set(lesson_doc, merge=True)

    # ---------- done -------------------------------------------------------
    print(f"🎉  {len(manifest)} clips written to {out_dir}")
    print(f"✅  Lesson available at /lesson/{args.session}")
    print(f"✅  clipUrls point to {VERCEL_ROOT}")

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    main()
