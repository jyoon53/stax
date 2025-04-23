// pages/api/gcs-signed-url.js
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin";

/* 1) bucket --------------------------------------------------------------- */
const BUCKET_NAME = process.env.CLIP_BUCKET?.trim();
if (!BUCKET_NAME) throw new Error("Missing env var CLIP_BUCKET");

/* 2) Admin SDK ------------------------------------------------------------ */
if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")),
    storageBucket: BUCKET_NAME,
  });
}
const bucket = getStorage().bucket(BUCKET_NAME);

/* 3) handler -------------------------------------------------------------- */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  /* CORS pre-flight */
  if (req.method === "OPTIONS") {
    res
      .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
      .setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const {
    lessonId,
    contentType,
    title = "",
    description = "",
  } = req.body || {};
  if (!lessonId || !contentType?.startsWith("video/"))
    return res.status(400).end("Missing / invalid fields");

  const objectKey = `master/${lessonId}.mp4`;

  /* signed PUT url (15 min) */
  const [url] = await bucket.file(objectKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  /* Firestore stub for UI progress */
  await db.doc(`lessons/${lessonId}`).set(
    {
      title,
      description,
      status: "uploading",
      masterVideoPath: `gs://${BUCKET_NAME}/${objectKey}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  /* ⬅️  NO obsT0 write here any more */

  res.json({ url, objectKey });
}
