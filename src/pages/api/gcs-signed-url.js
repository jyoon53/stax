import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";

/* ─────────── Firebase / GCS bootstrap ─────────── */
if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    storageBucket: process.env.CLIP_BUCKET, // e.g. roblox‑lms.appspot.com
  });
}
const bucket = getStorage().bucket();

/* ─────────── API route ─────────── */
export default async function handler(req, res) {
  /* CORS pre‑flight for the browser PUT → signed URL */
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).end("Method Not Allowed");
  }

  const {
    lessonId,
    contentType,
    title = "",
    description = "",
  } = req.body || {};
  if (!lessonId || !contentType) {
    return res
      .status(400)
      .end("Missing fields: lessonId and contentType are required");
  }

  /* Signed PUT URL valid for 15 min ----------------------------------- */
  const [url] = await bucket.file(`master/${lessonId}.mp4`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  /* Stub Firestore doc so UI can show "uploading" ---------------------- */
  await db.doc(`lessons/${lessonId}`).set(
    {
      title,
      description,
      status: "uploading",
      masterVideoPath: `gs://${process.env.CLIP_BUCKET}/master/${lessonId}.mp4`,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  res.setHeader("Access-Control-Allow-Origin", "*"); // allow XHR from your app
  return res.json({ url });
}
