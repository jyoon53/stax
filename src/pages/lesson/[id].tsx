import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  doc,
  FirestoreDataConverter,
  DocumentReference,
} from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";
import Head from "next/head";
import Link from "next/link";
import { db } from "../../../lib/firebaseClient";

/* ------------- Types --------------- */
interface Chapter {
  roomId: string;
  clipUrl: string;
}
interface Lesson {
  title: string;
  description?: string;
  chapters: Chapter[];
}
/* ----------------------------------- */

/* -------- Firestore converter ------- */
const cv: FirestoreDataConverter<Lesson> = {
  toFirestore: (l) => l as Record<string, unknown>,
  fromFirestore: (s) => s.data() as Lesson,
};

export default function LessonPlayer() {
  const { query } = useRouter();

  const ref: DocumentReference<Lesson> | undefined = useMemo(() => {
    if (!db || !query.id) return undefined;
    return doc(db, "lessons", String(query.id)).withConverter(cv);
  }, [db, query.id]);

  const [lesson, loading] = useDocumentData<Lesson>(ref);

  if (loading || !lesson) return <p className="p-8">Loading…</p>;

  return (
    <>
      <Head>
        <title>{lesson.title} · Stax</title>
      </Head>

      <section className="max-w-4xl mx-auto pb-20">
        <h1 className="text-4xl font-bold mb-8">{lesson.title}</h1>

        <ol className="space-y-16">
          {lesson.chapters.map((c, i) => (
            <li key={c.roomId}>
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

        <Link href="#" onClick={() => history.back()}>
          <span className="inline-block mt-10 text-blue-600 hover:underline">
            ← Back
          </span>
        </Link>
      </section>
    </>
  );
}
