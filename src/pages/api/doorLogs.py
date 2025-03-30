# door_logs.py
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import json
import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI()

# (Optional) Initialize Firebase Admin here if you want to save door logs to Firestore
# This can be similar to your exercise progress integration.
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://<your-database-name>.firebaseio.com/"
})
db = firestore.client()

@app.post("/api/doorLogs")
async def process_door_logs(request: Request):
    try:
        data = await request.json()
        # Data should be an object or an array of door events.
        # Example: { "logs": [ { "doorID": "House1_Door", "action": "enter", "timestamp": 1680000000, ... }, ... ] }
        logs = data.get("logs")
        if not logs:
            return JSONResponse({"success": False, "error": "No logs provided"}, status_code=400)
        
        # Save logs to Firestore (under a collection named "roomLogs")
        for log in logs:
            db.collection("roomLogs").add(log)
        
        # Optionally, trigger video processing (or schedule a job) based on these logs.
        return JSONResponse({"success": True, "message": "Door logs processed."})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
