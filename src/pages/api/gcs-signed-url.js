// src/pages/api/gcs-signed-url.js
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";

/* ────── 1.  Resolve a valid bucket name (or throw) ─────────────────── */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// default bucket that Firebase creates for the project
const DEFAULT_BUCKET = `${serviceAccount.project_id}.appspot.com`;

// prefer env‑var, fall back to default
const BUCKET_NAME = process.env.CLIP_BUCKET || DEFAULT_BUCKET;

// Google’s bucket‑naming regex (lowercase, 3‑63 chars, no spaces)
if (!/^[a-z0-9.\-_]{3,63}$/.test(BUCKET_NAME)) {
  throw new Error(
    `Invalid GCS bucket name "${BUCKET_NAME}". ` +
      `Set CLIP_BUCKET to something like "roblox-lms.appspot.com".`
  );
}

/* ────── 2.  Initialise Firebase Admin once ─────────────────────────── */
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}
const bucket = getStorage().bucket();

/* ────── 3.  API route ──────────────────────────────────────────────── */
export default async function handler(req, res) {
  /* CORS pre‑flight --------------------------------------------------- */
  if (req.method === "OPTIONS") {
    res
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type");
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

  /* Signed PUT URL (15 min ttl) -------------------------------------- */
  const [url] = await bucket.file(`master/${lessonId}.mp4`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  /* Firestore stub so UI can show progress --------------------------- */
  await db.doc(`lessons/${lessonId}`).set(
    {
      title,
      description,
      status: "uploading",
      masterVideoPath: `gs://${BUCKET_NAME}/master/${lessonId}.mp4`,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  res.setHeader("Access-Control-Allow-Origin", "*"); // allow XHR from your app
  return res.json({ url });
}
