// src/pages/api/upload‑lesson.js
import multer from "multer";
import { getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { db } from "../../../lib/firebaseAdmin";

export const config = { api: { bodyParser: false } }; // hand off to Multer
const upload = multer({ storage: multer.memoryStorage() });

/* lazy‑init Storage bucket (admin was initialised in firebaseAdmin.js) */
if (getApps().length === 0)
  initializeApp({ storageBucket: process.env.CLIP_BUCKET });
const bucket = getStorage().bucket();

export default upload.single("video")(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { title = "Untitled lesson", description = "" } = req.body;
    const lessonId = req.query.id || Date.now().toString(36);

    await db
      .doc(`lessons/${lessonId}`)
      .set(
        { title, description, status: "processing", createdAt: new Date() },
        { merge: true }
      );

    if (!req.file) throw new Error('Missing multipart field "video"');

    const dest = `master/${lessonId}.mp4`;
    await bucket.file(dest).save(req.file.buffer, {
      contentType: req.file.mimetype,
      resumable: false,
      public: false,
    });

    res.json({ id: lessonId });
  } catch (err) {
    console.error("❌ /api/upload‑lesson:", err);
    res.status(500).json({ error: err.message });
  }
});
