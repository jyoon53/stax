import { db } from "../../../lib/firebaseAdmin";

/** GET /api/lesson-progress?lessonId=101 */
export default async function handler(req, res) {
  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: "lessonId required" });

  try {
    // 1️⃣ grab every progress doc for this lesson – across *all* sessions
    const snap = await db
      .collectionGroup("progress")
      .where("lessonID", "==", lessonId)
      .get();

    // 2️⃣ aggregate by student
    const byStudent = {};
    snap.forEach((doc) => {
      const d = doc.data();

      // treat "completed" == true   ⬇️ tweak this line if you use score/duration instead
      const solved = d.completed === true || d.score > 0;

      if (!byStudent[d.studentId]) {
        byStudent[d.studentId] = {
          studentId: d.studentId,
          studentName: d.studentName,
          completed: 0,
          total: 0,
        };
      }
      byStudent[d.studentId].total += 1;
      if (solved) byStudent[d.studentId].completed += 1;
    });

    return res.status(200).json(Object.values(byStudent));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
