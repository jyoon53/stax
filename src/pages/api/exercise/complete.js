// src/pages/api/exercise/complete.js

import admin from "firebase-admin";
import serviceAccount from "../../../credentials/serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      gameId,
      lessonId,
      exerciseId,
      studentId,
      startTime,
      endTime,
      score,
      additionalData,
    } = req.body;

    // Log incoming data for debugging
    console.log("Received exercise completion data:", req.body);

    // Calculate duration if not provided
    const duration = startTime && endTime ? endTime - startTime : undefined;

    // Create a document payload that matches your data model
    const payload = {
      gameId,
      lessonId,
      exerciseId,
      studentId,
      startTime,
      endTime,
      duration,
      score,
      additionalData: additionalData || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // optional: track when the record was saved
    };

    try {
      // Write the payload to the "progress" collection
      await db.collection("progress").add(payload);
      console.log(
        `Student ${studentId} completed exercise ${exerciseId} in lesson ${lessonId}`
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
