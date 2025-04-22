// pages/api/gcs-signed-url.js
// -----------------------------------------------------------------------------
// Issue a signed PUT URL so the instructor can upload the master recording,
// then trigger the Cloud Run slicer service to generate clips.
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

/* 2. Cloud Run slicer endpoint -------------------------------------------- */
const SLICER_URL = process.env.SLICER_URL?.trim(); // e.g. "https://slicer-demo-xyz.a.run.app"

/* 3. Init Admin SDK (singleton) ------------------------------------------- */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}
const bucket = getStorage().bucket(BUCKET_NAME);

/* 4. API route ------------------------------------------------------------- */
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

  /* ── Extract + sanitize payload ─────────────────────────────────────── */
  let { lessonId, contentType, title = "", description = "" } = req.body || {};
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

  /* ── Create signed PUT URL (15 min) ─────────────────────────────────── */
  const [url] = await bucket.file(objectKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

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
  await db
    .doc(`sessions/${lessonId}`)
    .set({ obsT0: FieldValue.serverTimestamp() }, { merge: true });

  /* ── Trigger slicing via Cloud Run (await to ensure request fires) ───── */
  if (SLICER_URL) {
    console.log("Calling slicer service at:", SLICER_URL);
    try {
      const sliceRes = await fetch(`${SLICER_URL}/slice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: lessonId, bucket: BUCKET_NAME }),
      });
      console.log("Slice service response status:", sliceRes.status);
      if (!sliceRes.ok) {
        const errText = await sliceRes.text();
        console.error("Slice service responded with error:", errText);
      }
    } catch (err) {
      console.error("Failed to call slicer service:", err);
    }
  } else {
    console.warn("SLICER_URL not set, skipping slicing trigger.");
  }

  /* ── Respond to client ────────────────────────────────────────────────── */
  res.json({ url, objectKey });
}
