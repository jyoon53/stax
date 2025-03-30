import admin from "firebase-admin";

// Initialize Firebase Admin using your environment variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Destructure with keys matching the payload (note the capital letters)
    const {
      gameID,
      lessonID,
      exerciseID,
      studentId,
      startTime,
      endTime,
      score,
      additionalData,
    } = req.body;

    console.log("Received exercise completion data:", req.body);

    // Calculate duration if both times are provided
    const duration = startTime && endTime ? endTime - startTime : undefined;

    // Construct payload mapping client keys to desired Firestore field names
    const payload = {
      gameId: gameID, // use the value from client
      lessonId: lessonID,
      exerciseId: exerciseID,
      studentId,
      startTime,
      endTime,
      duration,
      score: score !== undefined ? score : 0,
      additionalData: additionalData || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const docRef = await db.collection("progress").add(payload);
      console.log(
        `Student ${studentId} completed exercise ${exerciseID} in lesson ${lessonID}. Document ID: ${docRef.id}`
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
