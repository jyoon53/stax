// pages/student-dashboard.js
// -----------------------------------------------------------------------------
// Student “Home” dashboard
// • Shows every lesson assigned to the learner
// • Displays progress% (server‑side field or client‑side fallback)
// • Responsive card grid identical to /classes for design consistency
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* fetch lessons on mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/lessons");
        if (!res.ok) throw new Error(await res.text());
        setLessons(await res.json());
      } catch (err) {
        console.error(err);
        setError("Unable to load lessons.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* fallback progress calc if API hasn’t added progressPct yet */
  const calcPct = (lesson) => {
    if (lesson.progressPct !== undefined) return lesson.progressPct;
    if (!lesson.exercises || lesson.exercises.length === 0) return 0;
    const done = lesson.exercises.filter((ex) => ex.completed).length;
    return Math.round((done / lesson.exercises.length) * 100);
  };

  /* tiny progress bar */
  const Bar = ({ pct }) => (
    <div className="w-full h-2 bg-gray-300 rounded">
      <div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }} />
    </div>
  );

  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && lessons.length === 0 && (
        <p>No lessons have been assigned yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => {
          const pct = calcPct(l);
          return (
            <Link
              key={l.id}
              href="#"
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-1">{l.title}</h2>
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {l.description}
              </p>

              <p className="text-sm mb-1">Progress: {pct}%</p>
              <Bar pct={pct} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
