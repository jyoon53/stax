// src/pages/api/start-recording.js
import { v4 as uuid } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";
import { start, stop, status as obsStatus } from "../../../lib/obs.js";
import { sendRobloxMessage } from "../../../lib/robloxOpenCloud.js";

export default async function handler(req, res) {
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
    /* cookie‑based id */
    let sessionId = req.cookies.sessionId;
    if (action === "start" || !sessionId) sessionId = uuid().slice(0, 8);

    /* ─────────── START ─────────── */
    if (action === "start") {
      await db
        .collection("sessions")
        .doc(sessionId)
        .set(
          { lessonId, obsT0: FieldValue.serverTimestamp() },
          { merge: true }
        );

      try {
        await sendRobloxMessage("lms-session", sessionId);
        console.log("LMS → OpenCloud ✅ sent", sessionId);
      } catch (err) {
        console.warn("▶︎ OpenCloud publish skipped:", err.message);
      }

      try {
        await start();
      } catch {
        console.warn("▶︎ OBS not reachable – continuing without recording");
      }
    }

    /* ─────────── STOP ──────────── */
    if (action === "stop") {
      await stop().catch(() => {});

      let file;
      try {
        ({ file } = await obsStatus());
      } catch {
        /* leave undefined */
      }
      const update = { stoppedAt: FieldValue.serverTimestamp() };
      if (file !== undefined) update.masterVideoPath = file;

      await db
        .collection("sessions")
        .doc(sessionId)
        .set(update, { merge: true });
    }

    /* final status (never throws) */
    let recording = false;
    try {
      ({ recording } = await obsStatus());
    } catch {
      /* keep false */
    }

    res.setHeader(
      "Set-Cookie",
      `sessionId=${sessionId}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    return res.json({ success: true, sessionId, action, recording });
  } catch (err) {
    console.error("❌ /start-recording fatal:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
