import { collection, getDocs, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import Link from "next/link";
import { useEffect, useState } from "react";

initializeApp({
  /*  <<< firebaseConfig >>> */
});
const db = getFirestore();

export default function Lessons() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    getDocs(collection(db, "lessons")).then((snap) =>
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-8">All Lessons</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((l) => (
          <Link
            key={l.id}
            href={`/lesson/${l.id}`}
            className="border rounded-lg p-6 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-1">{l.title}</h2>
            <p className="text-sm text-gray-700 line-clamp-3">
              {l.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
