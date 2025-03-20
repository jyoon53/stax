export default function handler(req, res) {
  if (req.method === "POST") {
    const { lessonId, exerciseId, studentId } = req.body;
    // In a real application, update your database accordingly.
    // For now, just simulate success.
    console.log(
      `Student ${studentId} completed exercise ${exerciseId} in lesson ${lessonId}`
    );
    res.status(200).json({ message: "Exercise marked as complete." });
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}
