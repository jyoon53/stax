// src/pages/api/ready.js
// -----------------------------------------------------------------------------
// POST /api/ready
// Called once per Roblox client, right after Player.CharacterAdded, to mark the
// moment the world is fully loaded.  This timestamp lets the video‑slicer trim
// front‑loading blank frames.
//
// Body:
//   { sessionId: "abc123", readyTs: 1713658932 }   // readyTs = os.time()  (secs)
//
// Stored as:
//   sessions/{sessionId}.readyEpoch = <milliseconds>
// -----------------------------------------------------------------------------

import { db } from "../../../lib/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { sessionId, readyTs } = req.body || {};

  /* ---------- validation ---------- */
  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }
  if (!readyTs || isNaN(Number(readyTs))) {
    return res.status(400).json({ error: "Invalid readyTs" });
  }

  try {
    await db
      .collection("sessions")
      .doc(sessionId)
      .set(
        {
          readyEpoch: Number(readyTs) * 1000, // convert sec → ms
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ /ready error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
