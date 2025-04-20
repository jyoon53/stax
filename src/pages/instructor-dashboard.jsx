import { useEffect, useState } from "react";

/* helpers to cache id in browser */
function saveSession(id) {
  localStorage.setItem("sessionId", id);
}
function currentSession() {
  return localStorage.getItem("sessionId") || null;
}

/* main component */
export default function InstructorDashboard() {
  const [lessons, setLessons] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [exCount, setExCount] = useState(0);
  const [recState, setRecState] = useState("idle"); // idle | starting | recording | stopping

  /* fetch sample lessons (demo) */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/lessons");
      setLessons(await res.json());
    })();
  }, []);

  /* quick client‑side lesson list (demo only) */
  function addLesson(e) {
    e.preventDefault();
    setLessons((ls) => [
      ...ls,
      {
        id: ls.length + 1,
        title,
        description: desc,
        totalExercises: Number(exCount),
        students: [],
      },
    ]);
    setTitle("");
    setDesc("");
    setExCount(0);
  }

  /* Start / Stop button handler */
  async function toggleRecording() {
    const wantStop = recState === "recording";
    setRecState(wantStop ? "stopping" : "starting");
    try {
      const res = await fetch("/api/start-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: wantStop ? "stop" : "start" }),
      });
      const { success, error, sessionId } = await res.json();
      if (!success) throw new Error(error);
      if (sessionId) saveSession(sessionId);
      setRecState(wantStop ? "idle" : "recording");
      if (wantStop) {
        // we just stopped → done
        setRecState("idle");
        return;
      }

      /* we just *started* – wait until OBS really begins */
      for (let i = 0; i < 10; i++) {
        // ~10 s max
        const s = await fetch("/api/obs-status").then((r) => r.json());
        if (s.recording) {
          setRecState("recording");
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("OBS never entered recording mode (timeout)");
    } catch (err) {
      console.error(err);
      alert(`Recording error: ${err.message}`);
      setRecState("idle");
    }
  }

  const label = {
    idle: "Start Recording",
    starting: "Starting…",
    recording: "Stop Recording",
    stopping: "Stopping…",
  }[recState];

  const btnCls =
    recState === "recording"
      ? "bg-red-600 hover:bg-red-700"
      : recState === "idle"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-400 cursor-not-allowed";

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>

      <button
        onClick={toggleRecording}
        disabled={recState === "starting" || recState === "stopping"}
        className={`mb-6 text-white py-2 px-4 rounded ${btnCls}`}
      >
        {label}
      </button>

      <p className="mb-8 text-sm text-gray-600">
        Current session:&nbsp;
        <code>{currentSession() || "—"}</code>
      </p>

      {/* lesson upload form (demo UI) */}
      {/* …unchanged UI code below … */}
    </div>
  );
}
