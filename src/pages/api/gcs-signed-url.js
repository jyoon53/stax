// pages/api/gcs-signed-url.js
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket:
      process.env.CLIP_BUCKET || `${serviceAccount.project_id}.appspot.com`,
  });
}
const bucket = getStorage().bucket();

export default async function handler(req, res) {
  /* CORS pre‑flight */
  if (req.method === "OPTIONS") {
    res
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
      .setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST")
    return res.status(405).setHeader("Allow", ["POST"]).end();

  const {
    lessonId,
    contentType,
    title = "",
    description = "",
  } = req.body || {};
  if (!lessonId || !contentType)
    return res.status(400).end("Missing lessonId or contentType");

  /* Signed PUT URL — valid 15 min */
  const [url] = await bucket.file(`master/${lessonId}.mp4`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  /* Firestore stub so card can show “uploading…” */
  await db.doc(`lessons/${lessonId}`).set(
    {
      title,
      description,
      status: "uploading",
      masterVideoPath: `gs://${bucket.name}/master/${lessonId}.mp4`,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  res.setHeader("Access-Control-Allow-Origin", "*").json({ url });
}
