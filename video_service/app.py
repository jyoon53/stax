from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Tuple
import uuid, json, os, traceback

try:                                    # MoviePy ≥ 2.x
    from moviepy import VideoFileClip
except ModuleNotFoundError:             # MoviePy 1.x fallback
    from moviepy.editor import VideoFileClip

app = FastAPI()
CLIP_DIR = "uploads/clips"
os.makedirs(CLIP_DIR, exist_ok=True)


@app.post("/clip-room-video")
async def clip_room_video(roomLogs: str = Form(...),
                          video: UploadFile = File(...)):
    """
    Cuts the uploaded MP4 into room‑level clips.
    'roomLogs' is a JSON list of events that already contain
    'timestampRel' = seconds from the start of the OBS video.
    """
    try:
        events = json.loads(roomLogs)
        events.sort(key=lambda e: e.get("timestampRel", 0))

        # build (enter, exit) pairs
        pairs: List[Tuple[float, float]] = []
        pending = None
        for ev in events:
            if ev.get("eventType") == "enter":
                pending = ev["timestampRel"]
            elif ev.get("eventType") == "exit" and pending is not None:
                pairs.append((pending, ev["timestampRel"]))
                pending = None

        if not pairs:
            raise HTTPException(400, "No enter/exit pairs")

        uid       = uuid.uuid4().hex
        tmp_path  = f"/tmp/{uid}_{video.filename}"
        with open(tmp_path, "wb") as tmp:
            tmp.write(await video.read())

        master  = VideoFileClip(tmp_path)
        clips   = []

        for idx, (start, end) in enumerate(pairs, 1):
            start, end = max(0, start), min(end, master.duration)
            if end <= start:
                continue
            out_name = f"{CLIP_DIR}/{uid}_chapter{idx}.mp4"
            master.subclip(start, end).write_videofile(
                out_name, codec="libx264", audio=False, logger=None
            )
            clips.append({"chapter": idx, "start": start, "end": end,
                          "file": out_name})

        master.close();  os.remove(tmp_path)
        return JSONResponse({"success": True, "clips": clips})

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(500, f"Processing error: {exc}") from exc
