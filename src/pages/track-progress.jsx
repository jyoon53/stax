// pages/track-progress.js
import { useEffect, useState } from "react";

export default function TrackProgress() {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* ----------------- fetch instructor lessons once ----------------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetch("/api/lessons").then((r) => r.json());
        setLessons(data);
        if (data[0]) setLessonId(data[0].id);
      } catch {
        setErr("Unable to load lessons.");
      }
    })();
  }, []);

  /* ----------------- fetch progress when lesson changes ------------ */
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await fetch(
          `/api/lesson-progress?lessonId=${lessonId}`
        ).then((r) => r.json());
        setRows(data);
      } catch {
        setErr("Unable to load progress data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  /* helpers */
  const pct = (c, t) => (t === 0 ? 0 : Math.round((c / t) * 100));

  const avgPct =
    rows.length === 0
      ? 0
      : Math.round(
          rows.reduce((s, r) => s + pct(r.completed, r.total), 0) / rows.length
        );

  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Track Progress</h1>

      {err && <p className="text-red-600 mb-4">{err}</p>}

      {/* lesson selector */}
      <label className="block mb-6">
        <span className="mr-2 font-semibold">Lesson:</span>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>

      {/* summary */}
      <p className="mb-4">
        Class average:&nbsp;<strong>{avgPct}%</strong>
      </p>

      {/* table header */}
      <div className="grid grid-cols-3 font-semibold border-b pb-2 mb-2">
        <span>Student</span>
        <span className="text-center">Completed</span>
        <span className="text-right">Progress</span>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && rows.length === 0 && <p>No students yet.</p>}

      {/* rows */}
      {rows.map((r) => {
        const progress = pct(r.completed, r.total);
        return (
          <div
            key={r.studentId}
            className="grid grid-cols-3 items-center border-b py-2"
          >
            <span>{r.studentName}</span>
            <span className="text-center">
              {r.completed}/{r.total}
            </span>
            <span className="text-right">{progress}%</span>
          </div>
        );
      })}
    </section>
  );
}
