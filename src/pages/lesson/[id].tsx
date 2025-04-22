import { useRouter } from "next/router";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  FirestoreDataConverter,
  DocumentReference,
} from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";
import Head from "next/head";
import Link from "next/link";

/* ---------- Firebase init (client‑only) ---------- */
let db: ReturnType<typeof getFirestore> | undefined;
if (typeof window !== "undefined") {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  if (getApps().length === 0) initializeApp(firebaseConfig);
  db = getFirestore();
}

/* ------------- types --------------- */
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

const lessonCv: FirestoreDataConverter<Lesson> = {
  toFirestore: (l) => l as unknown as Record<string, unknown>,
  fromFirestore: (snap) => snap.data() as Lesson,
};

export default function LessonPlayer() {
  const { query } = useRouter();

  // Skip Firestore fetch during SSR
  if (!db) return <p className="p-8">Loading…</p>;

  const ref: DocumentReference<Lesson> | undefined = query.id
    ? doc(db, "lessons", String(query.id)).withConverter(lessonCv)
    : undefined;

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
