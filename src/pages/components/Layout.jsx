// src/components/Layout.jsx
import Header from "./Header";
import Footer from "./Footer";

/**
 * Layout (no sidebar)
 * -------------------
 * Props
 *   • role     : "instructor" | "student" | "guest"
 *   • children : page content
 */

const NAV = {
  instructor: [
    { href: "/instructor-dashboard", label: "Dashboard" },
    { href: "/upload-lesson", label: "Upload Lesson" },
    { href: "/track-progress", label: "Progress" },
    { href: "/lessons", label: "Lessons" }, // new tab
  ],
  student: [
    { href: "/student-dashboard", label: "Dashboard" },
    { href: "/classes", label: "Classes" },
    { href: "/progress", label: "Progress" },
    { href: "/settings", label: "Settings" },
  ],
  guest: [{ href: "/login", label: "Login" }],
};

export default function Layout({ children, role = "guest" }) {
  const items = NAV[role] ?? NAV.guest;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header role={role} items={items} />

      {/* main content */}
      <main className="flex-1 p-8">{children}</main>

      <Footer role={role} />
    </div>
  );
}
