import { db } from "../../../lib/firebaseAdmin.js";

/* -------------------------------------------------------------------------- */
/*  tiny helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Pull exercises for an existing lesson doc */
async function withExercises(docSnap) {
  const lesson = { id: docSnap.id, ...docSnap.data() };

  const exSnap = await docSnap.ref
    .collection("exercises")
    .orderBy("order", "asc")
    .get();

  lesson.exercises = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return lesson;
}

/** Derive a bare-bones lesson object from progress logs (fallback) */
function ghostLesson(id) {
  return { id, title: `Lesson ${id}`, exercises: [] };
}

/* -------------------------------------------------------------------------- */
/*  API handler                                                                */
/* -------------------------------------------------------------------------- */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  /* Accept either ?lessonId=… or ?id=… for convenience */
  const lessonId = req.query.lessonId || req.query.id || "";

  try {
    /* ────────────────────  A. Single lesson requested ──────────────────── */
    if (lessonId) {
      /* 1️⃣  First try the canonical lessons collection */
      const doc = await db.collection("lessons").doc(lessonId).get();
      if (doc.exists) return res.json(await withExercises(doc));

      /* 2️⃣  Fallback: does any progress log mention this lesson? */
      const probe = await db
        .collectionGroup("progress")
        .where("lessonID", "==", lessonId)
        .limit(1)
        .get();

      if (!probe.empty) return res.json(ghostLesson(lessonId));

      return res.status(404).json({ error: "Lesson not found" });
    }

    /* ────────────────────  B. List lessons for dropdown ────────────────── */
    const lessonsSnap = await db
      .collection("lessons")
      .orderBy("updatedAt", "desc") // field now guaranteed
      .limit(50)
      .get();

    /* 1️⃣  If you *do* have lesson docs, use them  */
    if (!lessonsSnap.empty) {
      const hydrated = await Promise.all(
        lessonsSnap.docs.map((d) => withExercises(d))
      );
      return res.json(hydrated);
    }

    /* 2️⃣  Otherwise build the list from the progress logs */
    const progSnap = await db.collectionGroup("progress").get();
    const ids = new Set();
    progSnap.forEach((d) => ids.add(d.data().lessonID));

    const list = Array.from(ids).map((id) => ghostLesson(id));
    return res.json(list);
  } catch (err) {
    console.error("❌ /lessons error:", err);
    return res.status(500).json({ error: err.message });
  }
}
