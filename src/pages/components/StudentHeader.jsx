import Link from "next/link";

export default function StudentHeader() {
  return (
    <header className="flex justify-between items-center p-6 bg-white shadow-sm">
      <div className="text-2xl font-bold text-gray-800">Stax - Student</div>
      <nav className="flex space-x-6">
        <Link href="/student-dashboard">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Dashboard
          </span>
        </Link>
        <Link href="/courses">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Courses
          </span>
        </Link>
        <Link href="/progress">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Progress
          </span>
        </Link>
        <Link href="/settings">
          <span className="hover:text-red-600 transition duration-300 cursor-pointer">
            Settings
          </span>
        </Link>
      </nav>
    </header>
  );
}
