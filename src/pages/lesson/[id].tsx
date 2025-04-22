// src/pages/lesson/[id].tsx
import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  doc,
  FirestoreDataConverter,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";
import Head from "next/head";
import Link from "next/link";
import { db } from "../../../lib/firebaseClient"; // adjust alias if different

/* ── Firestore types ─────────────────────────────────────────────── */
interface Chapter {
  roomId: string;
  clipUrl: string;
}
interface Lesson {
  title: string;
  description?: string;
  chapters: Chapter[];
}

/* ── Firestore converter (no ‘any’) ──────────────────────────────── */
const cv: FirestoreDataConverter<Lesson> = {
  toFirestore: (l: Lesson) => l,
  fromFirestore: (
    snap: QueryDocumentSnapshot,
    _opts: SnapshotOptions
  ): Lesson => snap.data() as Lesson,
};

export default function LessonPlayer() {
  const { query } = useRouter();

  /* Create ref only when router is ready */
  const ref = useMemo<DocumentReference<Lesson> | null>(() => {
    if (!query.id) return null;
    return doc(db, "lessons", String(query.id)).withConverter(cv);
  }, [query.id]);

  /* Hook short‑circuits if ref is null */
  const [lesson, loading] = useDocumentData<Lesson>(ref ?? undefined);

  if (loading || !lesson) return <p className="p-8">Loading…</p>;

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
