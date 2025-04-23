// src/pages/api/start-recording.js
import { v4 as uuid } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";
import { start, stop, status as obsStatus } from "../../../lib/obs.js";
import { sendRobloxMessage } from "../../../lib/robloxOpenCloud.js";

/**
 * POST /api/start-recording
 * body: { action: "start" | "stop", lessonId?: string }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { action = "start", lessonId = "defaultLesson" } = req.body || {};
  if (!["start", "stop"].includes(action))
    return res
      .status(400)
      .json({ success: false, error: "action must be 'start' or 'stop'" });

  try {
    /* cookie-based 8-char sessionId */
    let sessionId = req.cookies.sessionId;
    if (action === "start" || !sessionId) sessionId = uuid().slice(0, 8);

    /* ── START ────────────────────────────────────────────────────────── */
    if (action === "start") {
      await db
        .collection("sessions")
        .doc(sessionId)
        .set(
          { lessonId, obsT0: FieldValue.serverTimestamp() },
          { merge: true }
        );

      await sendRobloxMessage("lms-session", sessionId).catch(() => {});
      await start(sessionId).catch(() => {});
    }

    /* ── STOP ─────────────────────────────────────────────────────────── */
    if (action === "stop") {
      await stop().catch(() => {});
      const { file } = (await obsStatus().catch(() => ({}))) || {};
      const update = { stoppedAt: FieldValue.serverTimestamp() };
      if (file) update.masterVideoPath = file;
      await db.doc(`sessions/${sessionId}`).set(update, { merge: true });
    }

    /* final status */
    const { recording = false } = (await obsStatus().catch(() => ({}))) || {};
    res.setHeader(
      "Set-Cookie",
      `sessionId=${sessionId}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    return res.json({ success: true, sessionId, action, recording });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
