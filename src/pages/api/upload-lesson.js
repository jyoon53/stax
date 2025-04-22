/**
 * POST /api/upload‑lesson
 * Multipart form fields
 *   ─ file field called  «video»       (the MP4)
 *   ─ text field called «title»        (optional)
 *   ─ text field called «description»  (optional)
 *
 * Response: { id: <lessonId> }
 *
 * NOTE: runs **only on the Next.js server** – safe to import firebase‑admin.
 */
import multer from "multer";
import { getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { db } from "@/lib/firebaseAdmin";

/* ------------------------------------------------------------------ */
/* 0.  parse multipart / form‑data with Multer (memory storage)       */
const upload = multer({ storage: multer.memoryStorage() });
export const config = { api: { bodyParser: false } }; // hand off to Multer

/* ------------------------------------------------------------------ */
/* 1.  lazy‑init Admin SDK for Storage (db is already initialised)    */
if (getApps().length === 0) {
  // If you keep the service‑account JSON in FIREBASE_SERVICE_ACCOUNT
  // you don't need to pass credential again – admin already initialised
  initializeApp({ storageBucket: process.env.CLIP_BUCKET });
}
const bucket = getStorage().bucket();

/* ------------------------------------------------------------------ */
/* 2.  the actual handler                                             */
export default upload.single("video")(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    /* 2‑a. derive basic meta */
    const title = req.body.title?.trim() || "Untitled lesson";
    const description = req.body.description?.trim() || "";
    const lessonId =
      req.query.id || // optional  /?id=abc123
      Date.now().toString(36); // fallback

    /* 2‑b. create a stub doc the UI can already show */
    await db.doc(`lessons/${lessonId}`).set(
      {
        title,
        description,
        status: "processing", // Cloud Function will flip to ready
        createdAt: new Date(),
      },
      { merge: true }
    );

    /* 2‑c. upload master if the client sent one */
    if (!req.file) throw new Error("No «video» file in form‑data");

    const dest = `master/${lessonId}.mp4`; // Cloud Function watches this path
    await bucket.file(dest).save(req.file.buffer, {
      contentType: req.file.mimetype,
      resumable: false, // no tmp chunk object created
      public: false,
    });
    console.log("Uploaded master →", dest);

    /* 2‑d. done */
    res.json({ id: lessonId });
  } catch (err) {
    console.error("❌ /api/upload‑lesson:", err);
    res.status(500).json({ error: err.message });
  }
});
