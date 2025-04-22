import { useEffect, useState } from "react";
import Link from "next/link";

export default function Progress() {
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
        setError("Unable to load progress.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ProgressBar = ({ pct }) => (
    <div className="w-full h-2 bg-gray-300 rounded">
      <div className="h-2 bg-green-500 rounded" style={{ width: `${pct}%` }} />
    </div>
  );

  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">My Progress</h1>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && lessons.length === 0 && <p>No lessons assigned yet.</p>}

      <div className="space-y-6">
        {lessons.map((l) => (
          <div key={l.id} className="border rounded p-6">
            <h2 className="text-xl font-semibold mb-1">{l.title}</h2>
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {l.description}
            </p>

            <p className="text-sm mb-1">Progress: {l.progressPct ?? 0}%</p>
            <ProgressBar pct={l.progressPct ?? 0} />

            <Link
              href={`/lesson/${l.id}`}
              className="text-blue-600 underline text-sm inline-block mt-3"
            >
              Continue lesson →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
