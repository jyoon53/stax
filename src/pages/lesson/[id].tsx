/*  src/pages/lesson/[id].tsx  */
import { useRouter } from "next/router";
import { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";

import {
  doc,
  FirestoreDataConverter,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";

import { db } from "../../../lib/firebaseClient";

/* ─────────────────── Firestore domain types ──────────────────── */
interface Chapter {
  roomId: string;
  clipUrl: string;
}

interface Lesson {
  title: string;
  description?: string;
  chapters: Chapter[];
}

/* ───────────────── Firestore converter (no “any”) ─────────────── */
const lessonConverter: FirestoreDataConverter<Lesson> = {
  toFirestore: (lesson: Lesson) => lesson,
  fromFirestore: (snap: QueryDocumentSnapshot, opts: SnapshotOptions): Lesson =>
    snap.data(opts) as Lesson,
};

/* ─────────────────────── React page ───────────────────────────── */
export default function LessonPlayer() {
  const { query } = useRouter();

  /* build the doc ref only once router has the id */
  const lessonRef: DocumentReference<Lesson> | null = useMemo(() => {
    if (!query.id) return null;
    return doc(db, "lessons", String(query.id)).withConverter(lessonConverter);
  }, [query.id]);

  /* react‑firebase‑hooks handles `undefined` refs gracefully */
  const [lesson, loading] = useDocumentData<Lesson>(lessonRef ?? undefined);

  if (loading || !lesson) {
    return <p className="p-8">Loading…</p>;
  }

  return (
    <>
      <Head>
        <title>{lesson.title} · Stax</title>
      </Head>

      <section className="max-w-4xl mx-auto pb-20">
        <h1 className="text-4xl font-bold mb-8">{lesson.title}</h1>

        <ol className="space-y-16">
          {lesson.chapters.map((c, i) => (
            <li key={`${c.roomId}-${i}`}>
              <h2 className="text-2xl font-semibold mb-2">
                {i + 1}.&nbsp;{c.roomId}
              </h2>

              <video
                src={c.clipUrl}
                controls
                className="w-full rounded shadow"
              />
            </li>
          ))}
        </ol>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            history.back();
          }}
          className="inline-block mt-10 text-blue-600 hover:underline"
        >
          ← Back
        </Link>
      </section>
    </>
  );
}
