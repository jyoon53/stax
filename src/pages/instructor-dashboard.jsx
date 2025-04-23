// src/pages/instructor-dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ── localStorage helpers ──────────────────────────────────────────────── */
const saveSession = (id) =>
  typeof window !== "undefined" && localStorage.setItem("currentSessionId", id);
const getSession = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("currentSessionId")
    : null;

/* ──────────────────────────────────────────────────────────────────────── */
export default function InstructorDashboard() {
  const [lessons, setLessons] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [recState, setRecState] = useState("idle"); // idle | recording | stopping
  const [err, setErr] = useState("");

  /* hydrate -------------------------------------------------------------- */
  useEffect(() => setSessionId(getSession()), []);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/lessons", { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        setLessons(await r.json());
      } catch {
        setErr("Unable to load lessons.");
      }
    })();
  }, []);

  /* ── start / stop handler --------------------------------------------- */
  const toggleRecording = useCallback(async () => {
    const stopping = recState === "recording";
    setRecState(stopping ? "stopping" : "recording");
    setErr("");

    try {
      const r = await fetch("/api/start-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: stopping ? "stop" : "start" }),
        cache: "no-store",
      });
      const { success, sessionId: sid, error } = await r.json();
      if (!success) throw new Error(error);
      if (sid) {
        saveSession(sid);
        setSessionId(sid);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setRecState(stopping ? "idle" : "recording");
    }
  }, [recState]);

  /* ── UI helpers -------------------------------------------------------- */
  const label =
    recState === "idle"
      ? "Start Recording"
      : recState === "recording"
      ? "Stop Recording"
      : "Stopping…";

  const btnCls =
    recState === "recording"
      ? "bg-red-600 hover:bg-red-700"
      : recState === "idle"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-400 cursor-not-allowed";

  /* ── render ------------------------------------------------------------ */
  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>

      <button
        onClick={toggleRecording}
        disabled={recState === "stopping"}
        className={`py-2 px-4 rounded text-white mb-6 ${btnCls}`}
      >
        {label}
      </button>

      <p className="mb-6 text-sm text-gray-600">
        Current session:&nbsp;<code>{sessionId || "—"}</code>
      </p>

      {err && (
        <p className="mb-6 text-red-600">
          <strong>Error:</strong> {err}
        </p>
      )}

      <h2 className="text-2xl font-semibold mb-4">My Lessons</h2>
      {lessons.length === 0 && <p>No lessons yet.</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <Link
            key={l.id}
            href={`/lesson/${l.id}`}
            className="border rounded-lg p-6 hover:shadow-md transition"
          >
            <h3 className="text-xl font-semibold mb-1">{l.title}</h3>
            <p className="text-sm text-gray-700 line-clamp-3">
              {l.description}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              {l.exercises?.length || 0} exercises
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
