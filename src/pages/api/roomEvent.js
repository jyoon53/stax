// pages/api/roomEvent.js
import { admin, db } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { eventType, roomID, timestamp, playerName } = req.body;

    // Validate required fields.
    if (!eventType || !roomID || timestamp == null || !playerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = {
      eventType,
      roomID,
      timestamp,
      playerName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const docRef = await db.collection("roomEvents").add(payload);
      console.log(
        `Room event logged: ${eventType} in room ${roomID} by ${playerName}. Document ID: ${docRef.id}`
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error writing room event to Firestore:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
