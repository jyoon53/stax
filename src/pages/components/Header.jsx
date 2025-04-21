import Link from "next/link";

/**
 * Header
 * ------
 * Props
 *   • role   : "instructor" | "student" | "guest"
 *   • items  : [{ href: string, label: string }]
 *
 * The parent (Layout) passes the nav array, so Header stays dumb & reusable.
 */
export default function Header({ role = "guest", items = [] }) {
  const title =
    role === "instructor"
      ? "Stax – Instructor"
      : role === "student"
      ? "Stax – Student"
      : "Stax";

  return (
    <header className="flex justify-between items-center p-6 bg-white shadow-sm">
      <div className="text-2xl font-bold text-gray-800">{title}</div>
      <nav className="flex space-x-6">
        {items.map(({ href, label }) => (
          <Link key={href} href={href}>
            <span className="hover:text-red-600 transition duration-300 cursor-pointer">
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
