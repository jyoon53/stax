import uvicorn
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import os
import json
import uuid  # for unique file names
from moviepy.editor import VideoFileClip

app = FastAPI()

@app.post("/clip-room-video")
async def clip_room_video(
    roomLogs: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Expects roomLogs to be a JSON string with an array of events:
    [ { "eventType": "RoomEntrance", "roomID": "House1_Door", "timestamp": <number> }, ... ]
    For a single room, finds the first "RoomEntrance" and first "RoomExit" times.
    """
    try:
        events = json.loads(roomLogs)
        entranceTime = None
        exitTime = None

        # Find the first entrance and exit events for the room.
        for evt in events:
            if evt.get("eventType") == "RoomEntrance" and entranceTime is None:
                entranceTime = evt.get("timestamp")
            elif evt.get("eventType") == "RoomExit" and exitTime is None:
                exitTime = evt.get("timestamp")
        
        if entranceTime is None or exitTime is None:
            return JSONResponse({"success": False, "error": "No entrance/exit in logs"}, status_code=400)

        # Save the uploaded file with a unique name
        unique_id = str(uuid.uuid4())
        tempFilename = f"temp_{unique_id}_{file.filename}"
        with open(tempFilename, "wb") as f:
            f.write(await file.read())

        clip = VideoFileClip(tempFilename)
        duration = clip.duration

        # Clamp times to [0, duration]
        start = max(0, min(entranceTime, duration))
        end = max(0, min(exitTime, duration))
        if end < start:
            start, end = end, start

        subclip = clip.subclip(start, end)
        outFilename = f"roomClip_{unique_id}.mp4"
        subclip.write_videofile(outFilename, codec="libx264", audio_codec="aac")
        clip.close()
        os.remove(tempFilename)

        return JSONResponse({
            "success": True,
            "start": start,
            "end": end,
            "savedFile": outFilename,
            "totalDuration": duration
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

if __name__ == "__main__":
    # Run with: python video_service.py
    uvicorn.run(app, host="0.0.0.0", port=8000)
