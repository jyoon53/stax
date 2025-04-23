import { db } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: "lessonId required" });

  try {
    /* 1️⃣  Treat the id as a session first: /sessions/{id}/progress */
    const sess = await db.collection("sessions").doc(lessonId).get();
    if (sess.exists) {
      const snap = await sess.ref.collection("progress").get();

      const rows = aggregateByStudent(snap);
      return res.status(200).json(rows);
    }

    /* 2️⃣  Fallback: treat it as a real lessonId (collection-group) */
    const snap = await db
      .collectionGroup("progress")
      .where("lessonID", "==", lessonId)
      .get();

    if (snap.empty)
      return res.status(404).json({ error: "No progress found for id" });

    const rows = aggregateByStudent(snap);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("❌ /lesson-progress error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ---------- helper ------------------------------------------------------ */
function aggregateByStudent(snap) {
  const map = {};
  snap.forEach((doc) => {
    const d = doc.data();
    const solved =
      d.completed === true || (typeof d.score === "number" && d.score > 0);

    if (!map[d.studentId]) {
      map[d.studentId] = {
        studentId: d.studentId,
        studentName: d.studentName,
        completed: 0,
        total: 0,
      };
    }
    map[d.studentId].total += 1;
    if (solved) map[d.studentId].completed += 1;
  });
  return Object.values(map);
}
