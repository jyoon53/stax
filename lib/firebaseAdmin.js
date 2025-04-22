// lib/firebaseAdmin.js
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ─── 1. Load service‑account JSON (file → env fallback) ─────────────── */
function loadServiceAccount() {
  const file = resolve(process.cwd(), "keys/roblox-lms-sa.json");

  if (existsSync(file)) {
    return JSON.parse(readFileSync(file, "utf8"));
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    throw new Error(
      "❌ Missing Firebase service‑account (neither file nor env var present)"
    );
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    // Reference the caught error so ESLint treats it as used
    throw new Error(
      `❌ FIREBASE_SERVICE_ACCOUNT env var is not valid JSON: ${e.message}`
    );
  }
}

const serviceAccount = loadServiceAccount();

/* ─── 2. Initialise Admin SDK (reuse across hot reloads) ─────────────── */
const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore(app);

/* Ignore undefined properties globally (prevents the build error you hit) */
db.settings({ ignoreUndefinedProperties: true });

/* ─── 3. Optionally route to the Firestore emulator ──────────────────── */
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
if (emulatorHost && !global.__FIRESTORE_EMULATOR_PATCHED__) {
  // Firestore v10+: settings() can only be called once, so merge options
  db.settings({
    host: emulatorHost,
    ssl: false,
    ignoreUndefinedProperties: true,
  });
  global.__FIRESTORE_EMULATOR_PATCHED__ = true;
  console.log(`🔥 Connected to Firestore emulator @ ${emulatorHost}`);
}

export default app;
