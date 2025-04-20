import { useState, useEffect } from "react";

const API_ORIGIN = "http://localhost:8000"; // FastAPI base

export default function VideoEditor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [roomEvents, setRoomEvents] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1) Fetch room logs once page loads
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/getRoomEvents"); // <- your existing route
        const data = await res.json();
        setRoomEvents(data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch room events");
      }
    })();
  }, []);

  // 2) Upload + process
  async function handleUpload() {
    if (!selectedFile) return alert("Choose a video first!");
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("video", selectedFile);
    fd.append("roomLogs", JSON.stringify(roomEvents));

    try {
      const res = await fetch(`${API_ORIGIN}/clip-room-video`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} – ${txt}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");
      setClips(data.clips);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Video Editor</h1>

      {/* Choose file */}
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {/* Upload button */}
      <button
        disabled={loading || !selectedFile}
        onClick={handleUpload}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        {loading ? "Processing…" : "Upload & Process"}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {/* room log preview */}
      <h2 className="mt-8 text-xl font-semibold">Room Logs (JSON)</h2>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
        {JSON.stringify(roomEvents, null, 2)}
      </pre>

      {/* clip results */}
      {clips.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-semibold">Generated Clips</h2>
          {clips.map((c, i) => (
            <div key={i} className="border p-4 rounded mb-4">
              <p>
                <strong>{`Clip ${i + 1}`}</strong>: {c.start} s ➜ {c.end} s
              </p>
              <p>File: {c.savedFile}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
