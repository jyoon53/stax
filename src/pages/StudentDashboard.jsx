// src/pages/student.jsx
import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentDashboard() {
  const [lessonPlan, setLessonPlan] = useState(null);

  useEffect(() => {
    async function fetchLessonPlan() {
      const response = await fetch("/api/upload-recording");
      const data = await response.json();
      setLessonPlan(data);
    }
    fetchLessonPlan();
  }, []);

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Stax - Student Dashboard</h1>
      {lessonPlan ? (
        <section className="p-4 bg-softPink rounded">
          <h3 className="text-xl font-semibold mb-2">Lesson Plan</h3>
          <ul className="list-disc ml-6">
            {lessonPlan.chapters.map((chapter, index) => (
              <li key={index}>
                {chapter.title}:{" "}
                <Link href={chapter.clipUrl}>
                  <span className="text-primary hover:underline cursor-pointer">
                    {chapter.clipUrl}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p>No lesson plan available yet.</p>
      )}
    </div>
  );
}
