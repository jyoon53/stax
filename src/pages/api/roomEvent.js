import { db } from "../../../lib/firebaseAdmin.js";

const OK = new Set(["enter", "exit", "flash"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { sessionId, eventType, roomID, playerName, timestamp } =
    req.body || {};

  if (!sessionId || !OK.has(eventType) || !roomID)
    return res.status(400).json({ error: "Bad payload" });

  try {
    await db
      .collection("sessions")
      .doc(sessionId)
      .collection("roomEvents")
      .add({
        eventType,
        roomID,
        playerName: playerName ?? null,
        timestamp: timestamp ?? Date.now(),
        createdAt: db.FieldValue.serverTimestamp(),
      });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
