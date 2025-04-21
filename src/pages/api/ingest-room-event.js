// src/pages/api/ingest-room-events.js
// -----------------------------------------------------------------------------
// Single endpoint for *both* room‑movement events and exercise‑completion
// events coming from Roblox.
//
//  • If body contains `eventType` ∈ {"enter","exit","flash"}  -> room event
//  • Else if body contains `exerciseID`                       -> progress event
//
// Collection layout:
//
//   sessions/{sessionId}/roomEvents/{autoId}      (enter/exit/flash)
//   sessions/{sessionId}/progress/{sessionId}_{studentId}_{exerciseID}
//
// -----------------------------------------------------------------------------

import { db } from "../../../lib/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

/* constants */
const ROOM_EVENT_KINDS = new Set(["enter", "exit", "flash"]);

/* helper for JSON errors */
const bad = (res, msg) => res.status(400).json({ error: msg });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Accept either a single object or an array
  const payloads = Array.isArray(req.body) ? req.body : [req.body];

  try {
    for (const body of payloads) {
      const {
        sessionId,
        /* room fields */
        eventType,
        roomID,
        playerName,
        timestamp,
        /* progress fields */
        exerciseID,
        studentId,
        studentName,
        startTime = Date.now(),
        endTime = Date.now(),
        score = 0,
        additionalData = {},
        exerciseType = body.exerciseType ?? body.ExerciseType,
        gameID,
        lessonID,
      } = body || {};

      /* 1️⃣  validate sessionId for all payloads */
      if (!sessionId) return bad(res, "Missing sessionId");

      /* 2️⃣  Room movement event -------------------------------------- */
      if (ROOM_EVENT_KINDS.has(eventType)) {
        if (!roomID) return bad(res, "Missing roomID for room event");

        await db
          .collection("sessions")
          .doc(sessionId)
          .collection("roomEvents")
          .add({
            eventType,
            roomID,
            playerName: playerName ?? null,
            timestamp: Number(timestamp) || Date.now(),
            createdAt: FieldValue.serverTimestamp(),
          });

        continue;
      }

      /* 3️⃣  Exercise / progress event -------------------------------- */
      if (exerciseID) {
        if (!studentId) return bad(res, "Missing studentId for progress event");

        const duration = Number(endTime) - Number(startTime);
        const docId = `${sessionId}_${studentId}_${exerciseID}`;
        const ref = db
          .collection("sessions")
          .doc(sessionId)
          .collection("progress")
          .doc(docId);

        await ref.set(
          {
            gameID,
            lessonID,
            exerciseID,
            studentId,
            studentName,
            startTime: Number(startTime),
            endTime: Number(endTime),
            duration,
            score: Number(score) || 0,
            additionalData,
            exerciseType: exerciseType ?? "unknown",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        continue;
      }

      /* 4️⃣  If neither type matches, reject */
      return bad(res, "Payload did not match room or progress schema");
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ /ingest-room-events error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
