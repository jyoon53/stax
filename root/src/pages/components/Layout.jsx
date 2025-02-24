// src/components/Layout.jsx
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children, showSidebar = true }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {showSidebar && (
          <aside className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            <Sidebar />
          </aside>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
      <footer className="bg-gray-50 text-gray-500 text-center py-4 border-t border-gray-200">
        © {new Date().getFullYear()} Stax LMS. All rights reserved.
      </footer>
    </div>
  );
}
