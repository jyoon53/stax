// src/pages/api/progress.js
import { db } from "../../../lib/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/progress    ← called by Roblox
 * This route **only writes** to Firestore – it never returns data.
 */
export default async function handler(req, res) {
  /* guard non‑POST */
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  /* ─── DBG #1 – raw payload from Roblox ──────────────────────── */
  console.log("DBG → raw body", req.body);

  try {
    /* pull & sanitise */
    const {
      sessionId,
      gameID,
      lessonID,
      exerciseID,
      studentId,
      studentName,
      startTime = Date.now(),
      endTime = Date.now(),
      score = 0,
      additionalData = {},
      /* keep exactly what the client sent */
      exerciseType = req.body.exerciseType ?? req.body.ExerciseType,
    } = req.body || {};

    if (!sessionId || !exerciseID || !studentId) {
      return res
        .status(400)
        .json({ error: "Missing sessionId, exerciseID, or studentId" });
    }

    const duration = endTime - startTime;
    const docId = `${sessionId}_${studentId}_${exerciseID}`;

    const ref = db
      .collection("sessions")
      .doc(sessionId)
      .collection("progress")
      .doc(docId);

    /* base fields everyone gets */
    const base = {
      gameID,
      lessonID,
      exerciseID,
      studentId,
      studentName,
      startTime,
      endTime,
      duration,
      score,
      additionalData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    /* ─── DBG #2 – final exerciseType value we will try to write ── */
    console.log("DBG ← exerciseType heading to Firestore:", exerciseType);

    /* merge logic */
    const snap = await ref.get();

    if (!snap.exists) {
      if (exerciseType !== undefined) base.exerciseType = exerciseType;
      await ref.set(base);
    } else {
      const prevType = snap.data().exerciseType;
      const delta = { ...base };

      if (
        exerciseType !== undefined &&
        (prevType === undefined || prevType === "unknown")
      ) {
        delta.exerciseType = exerciseType;
      }

      await ref.update(delta);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ /api/progress error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
