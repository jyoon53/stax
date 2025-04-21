/**
 * Footer
 * ------
 * Props
 *   • role : same string used in Header (optional)
 */
export default function Footer({ role = "" }) {
  const prefix =
    role === "instructor"
      ? "Instructor Dashboard"
      : role === "student"
      ? "Student Dashboard"
      : "";

  return (
    <footer className="bg-gray-50 py-4 text-center text-gray-500">
      {prefix && `${prefix} · `}© {new Date().getFullYear()} Stax LMS. All
      rights reserved.
    </footer>
  );
}
