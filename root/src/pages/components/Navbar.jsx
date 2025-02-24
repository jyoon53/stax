// src/components/Navbar.jsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto flex justify-between items-center px-6">
        <Link href="/">
          <span className="text-2xl font-bold text-gray-800 cursor-pointer">
            Stax
          </span>
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/dashboard">
            <span className="hover:text-red-600 transition duration-300 cursor-pointer">
              Dashboard
            </span>
          </Link>
          <Link href="/lesson-planner">
            <span className="hover:text-red-600 transition duration-300 cursor-pointer">
              Lessons
            </span>
          </Link>
          <Link href="/analytics">
            <span className="hover:text-red-600 transition duration-300 cursor-pointer">
              Analytics
            </span>
          </Link>
          <Link href="/settings">
            <span className="hover:text-red-600 transition duration-300 cursor-pointer">
              Settings
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
