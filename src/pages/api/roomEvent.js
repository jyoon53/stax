// pages/api/roomEvent.js

// For real usage, connect to Firestore, SQLite, or another DB
let roomEvents = []; // Temporary in-memory store for demonstration

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { eventType, roomID, timestamp, playerName } = req.body;

  // Validate
  if (!eventType || !roomID || timestamp == null || !playerName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Store in your DB; here we push to an array
  roomEvents.push({
    eventType,
    roomID,
    timestamp,
    playerName,
    createdAt: new Date().toISOString(),
  });

  return res.status(200).json({ success: true });
}

// Optional: For demonstration, you might add a GET method or a separate route
// to retrieve these events.
