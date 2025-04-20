// src/pages/api/start-recording.js
import { v4 as uuid } from "uuid";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../../lib/firebaseAdmin.js";
import {
  startRecording,
  stopRecording,
} from "../../../obs-controller/obs_controller.js";
import { sendRobloxMessage } from "../../../lib/robloxOpenCloud.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { action = "start", lessonId = "defaultLesson" } = req.body ?? {};
  try {
    /* cookie → sessionId */
    let sessionId = req.cookies.sessionId;
    if (action === "start" || !sessionId) sessionId = uuid().slice(0, 8);

    if (action === "start") {
      await db
        .collection("sessions")
        .doc(sessionId)
        .set(
          { lessonId, obsT0: FieldValue.serverTimestamp() },
          { merge: true }
        );
      /* 💬 publish once */
      await sendRobloxMessage("lms-session", sessionId);
    }

    const rec =
      action === "start" ? await startRecording() : await stopRecording();
    if (!rec.success) throw new Error(rec.error);

    res.setHeader(
      "Set-Cookie",
      `sessionId=${sessionId}; Path=/; SameSite=Lax; Max-Age=86400`
    );
    res.json({ success: true, sessionId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
}
