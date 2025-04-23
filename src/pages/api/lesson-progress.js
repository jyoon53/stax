import { db } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: "lessonId required" });

  try {
    /* ───────────── 1️⃣  Treat the ID as a session first ───────────── */
    const sess = await db.collection("sessions").doc(lessonId).get();
    if (sess.exists) {
      const snap = await sess.ref.collection("progress").get();
      return res.status(200).json(aggregateByStudent(snap));
    }

    /* ───────────── 2️⃣  Fallback: treat as real lessonId ──────────── */
    const snap = await db
      .collectionGroup("progress")
      .where("lessonID", "==", lessonId)
      .get();

    if (snap.empty)
      return res.status(404).json({ error: "No progress found for this id" });

    return res.status(200).json(aggregateByStudent(snap));
  } catch (err) {
    console.error("❌ /lesson-progress error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* -------------------------------------------------------------------------- */
/*  Helper: aggregate each snapshot into one row per student                  */
/* -------------------------------------------------------------------------- */
function aggregateByStudent(snap) {
  const map = {};

  snap.forEach((doc) => {
    const d = doc.data();

    if (!map[d.studentId]) {
      map[d.studentId] = {
        studentId: d.studentId,
        studentName: d.studentName,
        completed: 0,
        total: 0,
      };
    }

    // Each log represents one completed exercise
    map[d.studentId].total += 1;
    map[d.studentId].completed += 1;
  });

  return Object.values(map);
}
