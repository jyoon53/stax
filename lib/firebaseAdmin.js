// lib/firebaseAdmin.js
import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ─── ❶ load the JSON file synchronously (one tiny read) ─────────────── */
const jsonPath = resolve(process.cwd(), "keys/roblox-lms-sa.json");

let cfg;
try {
  cfg = JSON.parse(readFileSync(jsonPath, "utf8"));
} catch (err) {
  throw new Error(
    `❌  Could not read “firebaseServiceAccount.json”.\n` +
      `    Make sure the file exists and contains valid JSON.\n${err}`
  );
}

/* ─── ❷ Initialise (reuse in dev‑hot‑reload) ──────────────────────────── */
const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(cfg) });

export const db = getFirestore(app); // <- import { db } from "…/firebaseAdmin"
export default app;
