import { db } from "../../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id: lessonId } = req.query;

  /* helper to pull exercises for one lesson */
  async function hydrate(docSnap) {
    const lesson = { id: docSnap.id, ...docSnap.data() };

    const exSnap = await docSnap.ref
      .collection("exercises")
      .orderBy("order", "asc")
      .get();

    lesson.exercises = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return lesson;
  }

  try {
    /* single lesson */
    if (lessonId) {
      const doc = await db.collection("lessons").doc(lessonId).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Lesson not found" });
      return res.json(await hydrate(doc));
    }

    /* all lessons, newest first */
    const snap = await db
      .collection("lessons")
      .orderBy("updatedAt", "desc") // field now guaranteed
      .limit(50)
      .get();

    return res.json(await Promise.all(snap.docs.map(hydrate)));
  } catch (err) {
    console.error("❌ /lessons error:", err);
    return res.status(500).json({ error: err.message });
  }
}
