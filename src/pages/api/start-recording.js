// src/pages/api/start-recording.js
// -----------------------------------------------------------------------------
// POST /api/start-recording
// Body: { action: "start" | "stop", lessonId?: "my‑lesson" }
// -----------------------------------------------------------------------------

import { v4 as uuid } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";
import { start, stop, status as obsStatus } from "../../../lib/obs.js";
import { sendRobloxMessage } from "../../../lib/robloxOpenCloud.js";

export default async function handler(req, res) {
  /* ── enforce method ─────────────────────────────────────────────── */
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { action = "start", lessonId = "defaultLesson" } = req.body || {};
  if (!["start", "stop"].includes(action)) {
    return res
      .status(400)
      .json({ success: false, error: "action must be 'start' or 'stop'" });
  }

  try {
    /* ── resolve / create cookie‑based session id ─────────────────── */
    let sessionId = req.cookies.sessionId;
    if (action === "start" || !sessionId) sessionId = uuid().slice(0, 8);

    /* ───────────────────── START branch ──────────────────────────── */
    if (action === "start") {
      /* 1️⃣  create / merge the session doc *first*  */
      await db.collection("sessions").doc(sessionId).set(
        {
          lessonId,
          obsT0: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      /* 2️⃣  publish the id to Roblox right away     */
      await sendRobloxMessage("lms-session", sessionId);

      /* 3️⃣  finally do the potentially slow OBS handshake */
      await start(); // throws if OBS unreachable
    }

    /* ───────────────────── STOP branch ───────────────────────────── */
    if (action === "stop") {
      await stop();

      const { file } = await obsStatus(); // may be null if OBS disabled paths
      await db
        .collection("sessions")
        .doc(sessionId)
        .set(
          {
            masterVideoPath: file ?? null,
            stoppedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }

    /* ── final OBS status (for UI) ────────────────────────────────── */
    const { recording } = await obsStatus();

    /* ── set / refresh cookie + JSON response ─────────────────────── */
    res.setHeader(
      "Set-Cookie",
      `sessionId=${sessionId}; Path=/; SameSite=Lax; Max-Age=86400`
    );

    return res.json({ success: true, sessionId, action, recording });
  } catch (err) {
    console.error("❌ /start-recording error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
