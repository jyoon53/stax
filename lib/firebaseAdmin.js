// lib/firebaseAdmin.js
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ─── 1.  Load service‑account JSON (file → env fallback) ─────────────── */
function loadServiceAccount() {
  const file = resolve(process.cwd(), "keys/roblox-lms-sa.json");

  if (existsSync(file)) {
    return JSON.parse(readFileSync(file, "utf8"));
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    throw new Error("Missing service account (file and env variable)");
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
  }
}

const serviceAccount = loadServiceAccount();

/* ─── 2.  Initialise admin SDK (reuse across hot reloads) ─────────────── */
const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore(app);

/* ─── 3.  Point to the Firestore emulator if requested ────────────────── */
const emulator = process.env.FIRESTORE_EMULATOR_HOST?.trim();
if (emulator && !global.__FIRESTORE_EMULATOR_PATCHED__) {
  // Firestore v10: settings() can only be called once
  db.settings({ host: emulator, ssl: false });
  global.__FIRESTORE_EMULATOR_PATCHED__ = true;
  console.log(`🔥  Connected to Firestore emulator @ ${emulator}`);
}

export default app;
