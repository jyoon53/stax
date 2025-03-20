// src/pages/api/exercise/complete.js

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Destructure the expected fields from the request body
    const {
      gameId,
      lessonId,
      exerciseId,
      studentId,
      startTime,
      endTime,
      duration, // Optional: you can compute it if not provided
      score, // Optional field
      additionalData,
    } = req.body;

    // For debugging purposes, log the entire payload.
    console.log("Received exercise completion data:", req.body);

    // If duration is not provided, compute it (if startTime and endTime are valid)
    const computedDuration =
      startTime && endTime ? endTime - startTime : duration;

    // Here you would normally update your database (e.g., Firestore)
    // For now, we simulate success.

    console.log(
      `Student ${studentId} completed exercise ${exerciseId} in lesson ${lessonId} of game ${gameId}. `,
      `Start: ${startTime}, End: ${endTime}, Duration: ${computedDuration}, Score: ${score}, Additional: `,
      additionalData
    );

    res.status(200).json({ message: "Exercise marked as complete." });
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}
