// src/pages/api/exercise/complete.js

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Destructure the incoming payload from Roblox.
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

    // Map the keys to your LMS data model.
    const payload = {
      game_id: gameId,
      lesson_id: lessonId,
      exercise_id: exerciseId,
      student_id: studentId,
      start_time: startTime,
      end_time: endTime,
      // Compute duration if startTime and endTime are provided.
      duration: startTime && endTime ? endTime - startTime : undefined,
      score: score,
      additional_data: additionalData || {},
    };

    // Log the mapped payload to verify correct transformation.
    console.log("Mapped Payload:", payload);

    // Here you would normally update your database with this payload.
    // For now, we simulate success.
    res.status(200).json({ message: "Exercise marked as complete.", payload });
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}
