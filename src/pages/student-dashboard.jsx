// pages/student-dashboard.js
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    async function fetchLessons() {
      const res = await fetch("/api/lessons");
      const data = await res.json();
      setLessons(data);
    }
    fetchLessons();
  }, []);

  const calculateProgress = (exercises) => {
    if (!exercises || exercises.length === 0) return 0;
    const completed = exercises.filter((ex) => ex.completed).length;
    return Math.round((completed / exercises.length) * 100);
  };

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      {lessons.length === 0 && <p>No lessons available.</p>}
      {lessons.map((lesson) => (
        <div key={lesson.id} className="mb-8 border p-4 rounded">
          <h2 className="text-2xl font-semibold mb-2">{lesson.title}</h2>
          <p className="mb-4">{lesson.description}</p>
          <p className="mb-2">
            Progress: {calculateProgress(lesson.exercises)}%
          </p>
          <ul className="list-disc ml-6">
            {lesson.exercises.map((exercise) => (
              <li key={exercise.id}>
                {exercise.title} –{" "}
                {exercise.completed ? "Completed" : "Incomplete"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
