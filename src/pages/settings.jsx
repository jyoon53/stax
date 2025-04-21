// pages/settings.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Settings() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("student");

  /* hydrate from localStorage on mount */
  useEffect(() => {
    setRole(localStorage.getItem("userType") || "student");
    setDisplayName(localStorage.getItem("displayName") || "");
  }, []);

  /* save display name locally (demo) */
  function saveProfile(e) {
    e.preventDefault();
    localStorage.setItem("displayName", displayName.trim());
    alert("Profile saved! (local demo only)");
  }

  /* change role toggle */
  function toggleRole() {
    const newRole = role === "student" ? "instructor" : "student";
    setRole(newRole);
    localStorage.setItem("userType", newRole);
    // Refresh page so Layout re-renders immediately
    router.replace(router.asPath);
  }

  /* logout */
  function logout() {
    localStorage.removeItem("userType");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("displayName");
    router.push("/");
  }

  return (
    <section className="p-8 text-black max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      {/* profile form */}
      <form onSubmit={saveProfile} className="space-y-4 mb-10">
        <label className="block">
          <span className="text-sm font-semibold">Display Name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            placeholder="Your name"
          />
        </label>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          Save Profile
        </button>
      </form>

      {/* role switch */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Role</h2>
        <p className="mb-3">
          Current role:&nbsp;
          <strong className="capitalize">{role}</strong>
        </p>
        <button
          onClick={toggleRole}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Switch to {role === "student" ? "Instructor" : "Student"}
        </button>
      </div>

      {/* logout */}
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
      >
        Log Out
      </button>
    </section>
  );
}
