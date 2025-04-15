// components/StudentSidebar.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function StudentSidebar() {
  const router = useRouter();
  const navItems = [
    { href: "/student-dashboard", label: "Dashboard" },
    { href: "/classes", label: "Classes" },
    { href: "/progress", label: "Progress" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav>
      <h2 className="text-lg font-bold mb-4">Student Menu</h2>
      <ul className="space-y-3">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <span
                className={`block px-4 py-2 rounded transition duration-300 cursor-pointer ${
                  router.pathname === item.href
                    ? "bg-red-600 text-white"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
