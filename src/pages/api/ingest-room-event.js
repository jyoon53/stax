// src/pages/api/ingest-room-event.js
// -----------------------------------------------------------------------------
// Unified ingest for *room* + *exercise* events coming from Roblox
// -----------------------------------------------------------------------------

import { db } from "../../../lib/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

/* ───────────────────────── helpers ────────────────────────────── */

// 1) drop every undefined value so Firestore never complains
function clean(o) {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined)
  );
}

// 2) coerce to the exact types the dashboard expects
function normalize(evt) {
  const n = { ...evt };

  // ints coming from HttpService:PostAsync are strings – fix them
  ["studentId", "score", "startTime", "endTime", "timestamp"].forEach((k) => {
    if (k in n && n[k] !== null) n[k] = Number(n[k]);
  });

  if (typeof n.exerciseType === "string")
    n.exerciseType = n.exerciseType.toLowerCase();

  return n;
}

// 3) quick 400 helper
const bad = (res, msg) => res.status(400).json({ error: msg });

/* ───────────────────────── endpoint ───────────────────────────── */

const ROOM = new Set(["enter", "exit", "flash"]);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const payloads = Array.isArray(req.body) ? req.body : [req.body];

  try {
    for (const raw of payloads) {
      const evt = normalize(raw);
      const {
        sessionId,
        eventType,
        roomID,
        playerName,
        timestamp,

        exerciseID,
        studentId,
        studentName,
        startTime = Date.now(),
        endTime = Date.now(),
        score = 0,
        additionalData = {},
        exerciseType = "unknown",
        gameID,
        lessonID,
      } = evt;

      /* ── shared guard ── */
      if (!sessionId) return bad(res, "Missing sessionId");

      /* ─────────────────── ROOM EVENTS ─────────────────────────── */
      if (ROOM.has(eventType)) {
        if (!roomID) return bad(res, "Missing roomID for room event");

        await db
          .collection("sessions")
          .doc(sessionId)
          .collection("roomEvents")
          .add(
            clean({
              eventType,
              roomID,
              playerName: playerName ?? null,
              timestamp: timestamp || Date.now(),
              createdAt: FieldValue.serverTimestamp(),
            })
          );
        continue;
      }

      /* ─────────────────── EXERCISE EVENTS ─────────────────────── */
      if (exerciseID) {
        if (!studentId) return bad(res, "Missing studentId for progress event");

        const duration = Number(endTime) - Number(startTime);
        const docId = `${sessionId}_${studentId}_${exerciseID}`;

        await db
          .collection("sessions")
          .doc(sessionId)
          .collection("progress")
          .doc(docId)
          .set(
            clean({
              gameID,
              lessonID,
              exerciseID,
              studentId,
              studentName,
              startTime,
              endTime,
              duration,
              score: Number(score) || 0,
              additionalData,
              exerciseType,
              updatedAt: FieldValue.serverTimestamp(),
            }),
            { merge: true }
          );

        continue;
      }

      return bad(res, "Payload did not match room or progress schema");
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌  /ingest-room-event:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
