import Link from "next/link";

export default function StudentDashboard() {
  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Courses</h2>
        <ul className="list-disc ml-6">
          <li>
            Introduction to Roblox Scripting -{" "}
            <Link href="/courses/1">
              <span className="text-red-600 hover:underline">View Course</span>
            </Link>
          </li>
          <li>
            Game Design Fundamentals -{" "}
            <Link href="/courses/2">
              <span className="text-red-600 hover:underline">View Course</span>
            </Link>
          </li>
          <li>
            Advanced Roblox Game Mechanics -{" "}
            <Link href="/courses/3">
              <span className="text-red-600 hover:underline">View Course</span>
            </Link>
          </li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Recent Learning Outcomes
        </h2>
        <div className="p-4 bg-gray-50 rounded shadow">
          <p className="text-lg">
            You completed the "Introduction to Roblox Scripting" course with a
            score of 85%.
          </p>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Current Lessons & Lectures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded shadow">
            <h3 className="text-xl font-semibold mb-2">
              Roblox Scripting Basics
            </h3>
            <p>Next Lecture: 10:00 AM, Feb 24</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <h3 className="text-xl font-semibold mb-2">
              Game Design Principles
            </h3>
            <p>Next Lecture: 2:00 PM, Feb 25</p>
          </div>
        </div>
      </section>
    </div>
  );
}
