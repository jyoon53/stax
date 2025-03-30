// pages/video-editor.js
import { useState, useEffect } from "react";

export default function VideoEditor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [roomEvents, setRoomEvents] = useState([]);
  const [playerName] = useState("Instructor123"); // or from localStorage
  const [clips, setClips] = useState([]);

  useEffect(() => {
    // Fetch the logs for the instructor
    async function loadEvents() {
      const res = await fetch(`/api/getRoomEvents?playerName=${playerName}`);
      const data = await res.json();
      setRoomEvents(data);
    }
    loadEvents();
  }, [playerName]);

  async function handleUpload() {
    if (!selectedFile) return;
    // We'll send the file + the logs to /api/processRoomVideo
    const formData = new FormData();
    formData.append("video", selectedFile);
    // We only do a single room for demonstration,
    // so we find the earliest "RoomEntrance" and the latest "RoomExit"
    // In a real scenario, handle multiple rooms.
    const entrance = roomEvents.find((e) => e.eventType === "RoomEntrance");
    const exit = roomEvents.find((e) => e.eventType === "RoomExit");
    const logs = [entrance, exit]; // simplistic approach

    formData.append("roomLogs", JSON.stringify(logs));

    const res = await fetch("/api/processRoomVideo", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      console.log("Got subclip data:", data);
      setClips([
        {
          start: data.start,
          end: data.end,
          outFile: data.savedFile,
        },
      ]);
    } else {
      console.error("Video processing error:", data.error);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Video Editor for Room-based Lessons</h1>
      <div>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
      </div>
      <button onClick={handleUpload}>Upload & Process</button>
      <div>
        <h3>Room Logs</h3>
        <pre>{JSON.stringify(roomEvents, null, 2)}</pre>
      </div>
      {clips.length > 0 && (
        <div>
          <h3>Generated Clips</h3>
          {clips.map((clip, idx) => (
            <div key={idx}>
              <p>
                Clip: {clip.start} to {clip.end}
              </p>
              <p>Saved File: {clip.outFile}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
