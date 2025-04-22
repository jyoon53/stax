// pages/lesson/[id].tsx
import { useRouter } from "next/router";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc } from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";
import Head from "next/head";
import Link from "next/link";

const firebaseConfig = {
  /* <<< your config >>> */
};

if (getApps().length === 0) initializeApp(firebaseConfig);
const db = getFirestore();

export default function LessonPlayer() {
  const { query } = useRouter();
  const [lesson, loading] = useDocumentData(
    query.id ? doc(db, "lessons", query.id as string) : undefined
  );

  if (loading || !lesson) return <p className="p-8">Loading…</p>;

  return (
    <>
      <Head>
        <title>{lesson.title} · Stax</title>
      </Head>

      <section className="max-w-4xl mx-auto pb-20">
        <h1 className="text-4xl font-bold mb-8">{lesson.title}</h1>

        <ol className="space-y-16">
          {lesson.chapters?.map((c: any, i: number) => (
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
