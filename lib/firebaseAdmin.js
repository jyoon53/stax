// lib/firebaseAdmin.js
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ─── 1. load service‑account JSON ────────────────────────────── */
let cfg;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // ‼️ Vercel / Render / Railway …
  cfg = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  // the PEM comes with “\n”, fix it once
  if (typeof cfg.private_key === "string") {
    cfg.private_key = cfg.private_key.replace(/\\n/g, "\n");
  }
} else {
  // local dev fallback
  const jsonPath = resolve(process.cwd(), "keys/roblox-lms-sa.json");
  if (!existsSync(jsonPath)) {
    throw new Error(
      "❌  FIREBASE_SERVICE_ACCOUNT env var not set and " +
        "keys/roblox‑lms‑sa.json not found."
    );
  }
  cfg = JSON.parse(readFileSync(jsonPath, "utf8"));
}

/* ─── 2. initialise (hot‑reload safe) ─────────────────────────── */
const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(cfg) });

export const db = getFirestore(app);
export default app;
