// src/pages/instructor-dashboard.jsx
import { useEffect, useState } from "react";
import Link from "next/link";

/* localStorage helpers ----------------------------------------------------- */
const saveSession = (id) =>
  typeof window !== "undefined" && localStorage.setItem("sessionId", id);
const getSession = () =>
  typeof window !== "undefined" ? localStorage.getItem("sessionId") : null;

/* -------------------------------------------------------------------------- */
export default function InstructorDashboard() {
  const [lessons, setLessons] = useState([]);
  const [sessionId, setSession] = useState(null);
  const [recState, setState] = useState("idle"); // idle|starting|recording|stopping
  const [errMsg, setError] = useState("");

  /* hydrate lessons + sessionId ------------------------------------------- */
  useEffect(() => setSession(getSession()), []);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/lessons", { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        setLessons(await r.json());
      } catch (e) {
        console.error(e);
        setError("Unable to load lessons.");
      }
    })();
  }, []);

  /* ---------------------------------------------------------------------- */
  async function toggleRecording() {
    const wantStop = recState === "recording";
    setState(wantStop ? "stopping" : "recording"); // optimistic flip
    setError("");

    /* 1 — fire‑and‑forget fetch (no await) ------------------------------- */
    fetch("/api/start-recording", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: wantStop ? "stop" : "start" }),
      cache: "no-store",
    })
      .then((res) => res.json())
      .then(({ success, error, sessionId: sid }) => {
        if (!success) throw new Error(error);
        if (sid) {
          saveSession(sid);
          setSession(sid);
        }
      })
      .catch((e) => {
        console.error(e);
        setState("idle");
        setError(e.message);
      });

    /* 2 — in parallel poll /api/obs-status until OBS confirms ----------- */
    if (!wantStop) {
      let ok = false;
      for (let i = 0; i < 20; i++) {
        // 20 × 500 ms = 10 s
        const { recording } = await fetch("/api/obs-status", {
          cache: "no-store",
        }).then((r) => r.json());
        if (recording) {
          ok = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!ok) {
        setState("idle");
        setError("OBS did not report recording within 10 s.");
      }
    } else {
      setState("idle"); // optimistic stop
    }
  }

  /* UI helpers ------------------------------------------------------------ */
  const label = {
    idle: "Start Recording",
    recording: "Stop Recording",
    starting: "Starting…", // never displayed now (kept for completeness)
    stopping: "Stopping…",
  }[recState];

  const btnCls =
    recState === "recording"
      ? "bg-red-600 hover:bg-red-700"
      : recState === "idle"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-400 cursor-not-allowed";

  /* ------------------------------ render --------------------------------- */
  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>

      <button
        onClick={toggleRecording}
        disabled={recState === "stopping"}
        className={`mb-6 text-white py-2 px-4 rounded ${btnCls}`}
      >
        {label}
      </button>

      <p className="mb-6 text-sm text-gray-600">
        Current session:&nbsp;<code>{sessionId || "—"}</code>
      </p>

      {errMsg && (
        <p className="mb-6 text-red-600">
          <strong>Error:</strong> {errMsg}
        </p>
      )}

      <h2 className="text-2xl font-semibold mb-4">My Lessons</h2>
      {lessons.length === 0 && (
        <p>No lessons yet. Record one to get started!</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <Link
            key={l.id}
            href="#"
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
