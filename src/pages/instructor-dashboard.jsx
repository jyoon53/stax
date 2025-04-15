// pages/instructor-dashboard.js
import { useEffect, useState } from "react";

export default function InstructorDashboard() {
  const [lessons, setLessons] = useState([]);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");
  const [newLessonExercises, setNewLessonExercises] = useState(0);

  useEffect(() => {
    async function fetchLessons() {
      const res = await fetch("/api/lessons");
      const data = await res.json();
      setLessons(data);
    }
    fetchLessons();
  }, []);

  const handleAddLesson = (e) => {
    e.preventDefault();
    const newLesson = {
      id: lessons.length + 1,
      title: newLessonTitle,
      description: newLessonDesc,
      totalExercises: Number(newLessonExercises),
      students: [],
    };
    setLessons([...lessons, newLesson]);
    setNewLessonTitle("");
    setNewLessonDesc("");
    setNewLessonExercises(0);
  };

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Upload Lesson</h2>
        <form onSubmit={handleAddLesson} className="mb-4">
          <input
            type="text"
            placeholder="Lesson Title"
            className="w-full border rounded p-2 mb-2"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Lesson Description"
            className="w-full border rounded p-2 mb-2"
            value={newLessonDesc}
            onChange={(e) => setNewLessonDesc(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Total Exercises"
            className="w-full border rounded p-2 mb-2"
            value={newLessonExercises}
            onChange={(e) => setNewLessonExercises(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Upload Lesson
          </button>
        </form>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Current Lessons</h2>
        {lessons.length === 0 && <p>No lessons uploaded yet.</p>}
        {lessons.map((lesson) => (
          <div key={lesson.id} className="mb-8 border p-4 rounded">
            <h3 className="text-xl font-bold mb-2">{lesson.title}</h3>
            <p className="mb-2">{lesson.description}</p>
            <p className="mb-2">Total Exercises: {lesson.totalExercises}</p>
            {(lesson.students || []).length === 0 ? (
              <p>No students added to this lesson.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Student</th>
                    <th className="border p-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {lesson.students.map((student, idx) => {
                    const progress =
                      lesson.totalExercises > 0
                        ? Math.round(
                            (student.completedExercises /
                              lesson.totalExercises) *
                              100
                          )
                        : 0;
                    return (
                      <tr key={idx}>
                        <td className="border p-2">{student.name}</td>
                        <td className="border p-2">{progress}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
