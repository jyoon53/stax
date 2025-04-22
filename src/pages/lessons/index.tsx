import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../../lib/firebaseClient";

/* ------------ Types --------------- */
interface LessonCard {
  id: string;
  title: string;
  description?: string;
}
/* ---------------------------------- */

export default function Lessons() {
  const [rows, setRows] = useState<LessonCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return; // SSR pass – skip
    (async () => {
      const snap = await getDocs(collection(db, "lessons"));
      const list: LessonCard[] = snap.docs.map(
        (d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...(d.data() as Omit<LessonCard, "id">),
        })
      );
      setRows(list);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-8">All Lessons</h1>

      {loading && <p>Loading…</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((l) => (
          <Link
            key={l.id}
            href={`/lesson/${l.id}`}
            className="border rounded-lg p-6 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-1">{l.title}</h2>
            {l.description && (
              <p className="text-sm text-gray-700 line-clamp-3">
                {l.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
