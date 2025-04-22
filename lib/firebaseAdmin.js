// lib/firebaseAdmin.js
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ── 1. service‑account helper ────────────────────────────────────── */
function loadServiceAccount() {
  const file = resolve(process.cwd(), "keys/roblox-lms-sa.json"); // ASCII “-”

  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    throw new Error(
      "❌  Firebase service‑account missing (neither file nor env var)."
    );
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    // plain‑JS: err is unknown, fallback to String()
    const msg =
      err && typeof err === "object" && "message" in err
        ? /** @type {{ message: string }} */ (err).message
        : String(err);
    throw new Error(`❌  FIREBASE_SERVICE_ACCOUNT is invalid JSON: ${msg}`);
  }
}
console.log("Using GCS bucket:", BUCKET_NAME);
const serviceAccount = loadServiceAccount();

/* ── 2. initialise Admin SDK exactly once ─────────────────────────── */
const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore(adminApp);

/* ── 3. apply settings only the first time in this Node process ───── */
if (!global.__STAX_FIRESTORE_PATCHED__) {
  db.settings({ ignoreUndefinedProperties: true });
  global.__STAX_FIRESTORE_PATCHED__ = true;
}

export default adminApp;
