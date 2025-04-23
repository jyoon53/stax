// pages/api/gcs-signed-url.js
// -----------------------------------------------------------------------------
// Issue a signed PUT URL so the instructor can upload the master recording.
// -----------------------------------------------------------------------------

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin";

/* 1. Resolve bucket name --------------------------------------------------- */
const BUCKET_NAME = process.env.CLIP_BUCKET?.trim();
if (!BUCKET_NAME) {
  throw new Error(
    'Missing env var CLIP_BUCKET (e.g. "roblox-lms.firebasestorage.app")'
  );
}

/* 2. Init Admin SDK (singleton) ------------------------------------------- */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}
const bucket = getStorage().bucket(BUCKET_NAME);

/* 3. API route ------------------------------------------------------------- */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res
      .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
      .setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).end("Method Not Allowed");
  }

  console.log("🔧 Upload handler — BUCKET_NAME =", BUCKET_NAME);

  /* ── Extract + sanitize payload ─────────────────────────────────────── */
  let { lessonId, contentType, title = "", description = "" } = req.body || {};
  console.log("🔧 Payload:", { lessonId, contentType, title, description });

  if (!lessonId || !contentType) {
    return res.status(400).end("Missing lessonId or contentType");
  }
  lessonId = String(lessonId)
    .trim()
    .replace(/[^\w-]/g, "_");
  if (!lessonId) {
    return res.status(400).end("Invalid lessonId");
  }

  const objectKey = `master/${lessonId}.mp4`;

  /* ── Create signed PUT URL (15 min) ─────────────────────────────────── */
  const [url] = await bucket.file(objectKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });
  console.log("🔧 Generated signed URL for", objectKey);

  /* ── Seed Firestore so UI can show progress ─────────────────────────── */
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
  console.log("🔧 lessons/%s seeded", lessonId);

  await db
    .doc(`sessions/${lessonId}`)
    .set({ obsT0: FieldValue.serverTimestamp() }, { merge: true });
  console.log("🔧 sessions/%s.obsT0 seeded", lessonId);

  /* ── Respond to client ────────────────────────────────────────────────── */
  return res.json({ url, objectKey });
}
