//gcs-signed-url.js

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { db } from "../../../lib/firebaseAdmin";

if (getApps().length === 0)
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    storageBucket: process.env.CLIP_BUCKET,
  });
const bucket = getStorage().bucket();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { lessonId, contentType, title, description } = req.body;
  if (!lessonId || !contentType) return res.status(400).end("Missing fields");

  const [url] = await bucket.file(`master/${lessonId}.mp4`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  // stub Firestore doc so card can show "processing"
  await db
    .doc(`lessons/${lessonId}`)
    .set(
      { title, description, status: "uploading", createdAt: new Date() },
      { merge: true }
    );

  res.json({ url });
}
