// pages/api/progress.js
import { admin, db } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      gameID,
      lessonID,
      exerciseID,
      studentId,
      studentName,
      startTime,
      endTime,
      score,
      additionalData,
      exerciseType,
      serverTimestamp,
    } = req.body;

    console.log("Received exercise completion data:", req.body);

    // Calculate duration; default to 0 if times are missing.
    const duration = startTime && endTime ? endTime - startTime : 0;

    const payload = {
      gameId: gameID,
      lessonId: lessonID,
      exerciseId: exerciseID,
      studentId,
      studentName,
      startTime,
      endTime,
      duration,
      score: score !== undefined ? score : 0,
      additionalData: additionalData || {},
      exerciseType: exerciseType || "unknown",
      serverTimestamp: serverTimestamp || Date.now(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const docRef = await db.collection("progress").add(payload);
      console.log(
        `Logged progress for student ${studentId} on exercise ${exerciseID}. Document ID: ${docRef.id}`
      );
      res.status(200).json({ message: "Exercise marked as complete." });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      res
        .status(500)
        .json({ message: "Error writing to Firestore", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}
