import Link from "next/link";

export default function InstructorHeader() {
  return (
    <header className="flex justify-between items-center p-6 bg-white shadow-sm">
      <div className="text-2xl font-bold text-gray-800">Stax - Instructor</div>
      <nav className="flex space-x-6">
        <Link href="/instructor-dashboard">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Dashboard
          </span>
        </Link>
        <Link href="/upload-lesson">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Upload Lesson
          </span>
        </Link>
        <Link href="/manage-students">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Manage Students
          </span>
        </Link>
        <Link href="/track-progress">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Track Progress
          </span>
        </Link>
      </nav>
    </header>
  );
}
