import { db } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const {
    lessonId,
    studentId,
    studentName,
    exerciseId,
    completed = false,
  } = req.body || {};

  if (!lessonId || !studentId || !exerciseId)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const docId = `${studentId}_${exerciseId}`;
    await db
      .collection("lessons")
      .doc(lessonId)
      .collection("progress")
      .doc(docId)
      .set(
        {
          studentId,
          studentName,
          exerciseId,
          completed,
          timestamp: Date.now(),
        },
        { merge: true }
      );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
