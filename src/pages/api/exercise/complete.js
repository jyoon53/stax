import admin from "firebase-admin";

// Load service account JSON from environment variable
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) {
  if (serviceAccountString) {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully.");
  } else {
    // Handle error: credentials not provided.
    console.error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT environment variable is not set."
    );
  }
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

    console.log("Received exercise completion data:", req.body);

    const duration = startTime && endTime ? endTime - startTime : undefined;
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
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const docRef = await db.collection("progress").add(payload);
      console.log(
        `Student ${studentId} completed exercise ${exerciseId} in lesson ${lessonId}. Document ID: ${docRef.id}`
      );
      res.status(200).json({ message: "Exercise marked as complete." });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      res.status(500).json({
        message: "Error writing to Firestore",
        error: error.message,
      });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}
