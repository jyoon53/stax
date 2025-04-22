import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";

/* ── 1. Resolve bucket name (env‑var required) ───────────────────────── */
const BUCKET_NAME = process.env.CLIP_BUCKET; // <- alias OK

if (!BUCKET_NAME)
  throw new Error(
    'CLIP_BUCKET env var is missing (e.g. "roblox-lms.firebasestorage.app")'
  );

/* ── 2. Initialise Admin SDK once ────────────────────────────────────── */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME, // ← alias used here
  });
}

/* Always pass the exact same string */
const bucket = getStorage().bucket(BUCKET_NAME);

/* ── 3. API handler ─────────────────────────────────────────────────── */
export default async function handler(req, res) {
  /* CORS pre‑flight */
  if (req.method === "OPTIONS") {
    res
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
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
  if (!lessonId || !contentType)
    return res.status(400).end("Missing lessonId or contentType");

  /* Signed PUT URL — valid 15 min */
  const [url] = await bucket.file(`master/${lessonId}.mp4`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  /* Firestore stub so UI shows progress */
  await db.doc(`lessons/${lessonId}`).set(
    {
      title,
      description,
      status: "uploading",
      masterVideoPath: `gs://${BUCKET_NAME}/master/${lessonId}.mp4`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  res.setHeader("Access-Control-Allow-Origin", "*").json({ url });
}
