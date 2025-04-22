// src/pages/lesson/[id].tsx
import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  doc,
  FirestoreDataConverter,
  DocumentReference,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";
import Head from "next/head";
import Link from "next/link";
import { db } from "../../../lib/firebaseClient";

/* ────── Firestore types ─────────────────────────────────────────────── */
interface Chapter {
  roomId: string;
  clipUrl: string;
}

interface Lesson {
  title: string;
  description?: string;
  chapters: Chapter[];
}

/* ────── Firestore converter (no unused params) ──────────────────────── */
const lessonCv: FirestoreDataConverter<Lesson> = {
  toFirestore: (lesson) => lesson,
  fromFirestore: (snap: QueryDocumentSnapshot): Lesson => snap.data() as Lesson,
};

/* ────── Page component ──────────────────────────────────────────────── */
export default function LessonPlayer() {
  const router = useRouter();

  /* create the doc‑ref only once router.params are ready */
  const lessonRef = useMemo<DocumentReference<Lesson> | null>(() => {
    if (!router.isReady || !router.query.id) return null;
    return doc(db, "lessons", String(router.query.id)).withConverter(lessonCv);
  }, [router.isReady, router.query.id]);

  /* react‑firebase‑hooks: skip if ref is null */
  const [lesson, loading] = useDocumentData<Lesson>(lessonRef ?? undefined);

  if (loading || !lesson) return <p className="p-8">Loading…</p>;

  /* still processing – no clips yet */
  if (!Array.isArray(lesson.chapters) || lesson.chapters.length === 0) {
    return (
      <p className="p-8">
        This lesson is still processing clips — refresh in a minute…
      </p>
    );
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
                {i + 1}. {c.roomId}
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
