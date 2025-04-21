// src/pages/api/lessons.js
// -----------------------------------------------------------------------------
// GET /api/lessons               → returns *all* lessons with embedded exercises
// GET /api/lessons?id=<lessonId> → returns a single lesson
//
// Firestore layout assumed:
//
//   lessons/{lessonId}
//     ├─ title, description, createdAt, …
//     └─ exercises/{exerciseId}
//          ├─ title, order, …
//
// -----------------------------------------------------------------------------

import { db } from "../../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id: lessonId } = req.query;

  try {
    // ───────────────────────────────────────────────────────────────
    // 1) Helper to load one lesson + its exercises
    // ───────────────────────────────────────────────────────────────
    async function hydrate(docSnap) {
      const lesson = { id: docSnap.id, ...docSnap.data() };

      const exSnap = await docSnap.ref
        .collection("exercises")
        .orderBy("order", "asc") // optional: order field
        .get();

      lesson.exercises = exSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      return lesson;
    }

    // ───────────────────────────────────────────────────────────────
    // 2) Single lesson request
    // ───────────────────────────────────────────────────────────────
    if (lessonId) {
      const doc = await db.collection("lessons").doc(lessonId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      const lesson = await hydrate(doc);
      return res.json(lesson);
    }

    // ───────────────────────────────────────────────────────────────
    // 3) All lessons
    // ───────────────────────────────────────────────────────────────
    const snap = await db
      .collection("lessons")
      .orderBy("createdAt", "desc")
      .get();
    const lessons = await Promise.all(snap.docs.map(hydrate));

    return res.json(lessons);
  } catch (err) {
    console.error("❌ /lessons error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
