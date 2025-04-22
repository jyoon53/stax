import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";

/* ───── 1. Resolve bucket name or exit fast ─────────────────────────── */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

const DEFAULT_BUCKET = serviceAccount.project_id
  ? `${serviceAccount.project_id}.appspot.com`
  : null;

const BUCKET_NAME = process.env.CLIP_BUCKET || DEFAULT_BUCKET;

if (!BUCKET_NAME) {
  throw new Error(
    "❌ No bucket name resolved. Set CLIP_BUCKET in your env or " +
      'add "project_id" to FIREBASE_SERVICE_ACCOUNT.'
  );
}
if (!/^[a-z0-9.\-_]{3,63}$/.test(BUCKET_NAME)) {
  throw new Error(
    `❌ CLIP_BUCKET "${BUCKET_NAME}" is not a valid GCS bucket name`
  );
}

/* ───── 2. Initialise Admin SDK (only once) ─────────────────────────── */
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME, // <── critical line
  });
}

/*  Always pass the name to be extra‑safe.  */
const bucket = getStorage().bucket(BUCKET_NAME);

/* ───── 3. API handler ──────────────────────────────────────────────── */
export default async function handler(req, res) {
  /* pre‑flight */
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
    return res.status(400).end("Missing fields: lessonId and contentType");
  }

  /* signed PUT url – valid 15 min */
  const [url] = await bucket.file(`master/${lessonId}.mp4`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  /* Firestore placeholder */
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

  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.json({ url });
}
