// -----------------------------------------------------------------------------
// Student “Classes” page
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Classes() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/lessons");
        if (!res.ok) throw new Error(await res.text());
        setLessons(await res.json());
      } catch (err) {
        console.error(err);
        setError("Unable to load classes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ProgressBar = ({ pct }) => (
    <div className="w-full h-2 bg-gray-300 rounded">
      <div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }} />
    </div>
  );

  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-8">My Classes</h1>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && lessons.length === 0 && (
        <p>No classes have been assigned yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <Link
            key={l.id}
            href={`/lesson/${l.id}`}
            className="border rounded-lg p-6 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-1">{l.title}</h2>
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {l.description}
            </p>

            <p className="text-sm mb-1">Progress: {l.progressPct ?? 0}%</p>
            <ProgressBar pct={l.progressPct ?? 0} />
          </Link>
        ))}
      </div>
    </section>
  );
}
