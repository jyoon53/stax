// src/pages/api/upload-lesson.js
import multer from "multer";
import { getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { db } from "../../lib/firebaseAdmin.js"; // server‑side admin already initialised

/* ------------------------------------------------------------------ */
/* 0 · multipart/form‑data parser (memory storage)                    */
const upload = multer({ storage: multer.memoryStorage() });
export const config = { api: { bodyParser: false } }; // hand off to Multer

/* ------------------------------------------------------------------ */
/* 1 · lazy‑init Storage bucket (admin SDK itself is initialised       */
/*    in lib/firebaseAdmin.js so we only add the bucket here)          */
if (getApps().length === 0) {
  initializeApp({ storageBucket: process.env.CLIP_BUCKET });
}
const bucket = getStorage().bucket();

/* ------------------------------------------------------------------ */
/* 2 · handler                                                         */
export default upload.single("video")(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    /* meta --------------------------------------------------------- */
    const title = req.body.title?.trim() || "Untitled lesson";
    const description = req.body.description?.trim() || "";
    const lessonId = req.query.id?.toString() || Date.now().toString(36); // fallback

    /* Firestore stub ---------------------------------------------- */
    await db.doc(`lessons/${lessonId}`).set(
      {
        title,
        description,
        status: "processing", // Cloud Function flips to "ready"
        createdAt: new Date(),
      },
      { merge: true }
    );

    /* video upload ------------------------------------------------- */
    if (!req.file) throw new Error("No «video» file in form‑data");

    const dest = `master/${lessonId}.mp4`; // watched by CF
    await bucket.file(dest).save(req.file.buffer, {
      contentType: req.file.mimetype,
      resumable: false,
      public: false,
    });
    console.log("Uploaded master →", dest);

    res.json({ id: lessonId });
  } catch (err) {
    console.error("❌ /api/upload‑lesson:", err);
    res.status(500).json({ error: err.message });
  }
});
