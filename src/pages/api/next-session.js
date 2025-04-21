// src/pages/api/next-session.js
import { db } from "../../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  // returns the most recent session that is still recording
  const snap = await db
    .collection("sessions")
    .orderBy("obsT0", "desc")
    .limit(1)
    .get();

  if (snap.empty) return res.json({ sessionId: null });
  res.json({ sessionId: snap.docs[0].id });
}
