// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const REDIRECT = {
  student: "/student-dashboard",
  instructor: "/instructor-dashboard",
};

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [err, setErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    if (!role) {
      setErr("Select a role first.");
      return;
    }
    // Persist role for role‑aware Layout
    localStorage.setItem("userType", role);
    sessionStorage.setItem("userType", role); // fallback for SW reloads
    router.push(REDIRECT[role]);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-8 bg-white border rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to Stax</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Roblox Username"
            className="w-full border rounded p-2 mb-4"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded p-2 mb-4"
            required
          />

          {/* role selector */}
          <fieldset className="mb-4">
            <legend className="text-sm font-semibold mb-1">Role</legend>
            {["student", "instructor"].map((r) => (
              <label key={r} className="mr-4">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="mr-1"
                />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </label>
            ))}
          </fieldset>

          {err && <p className="text-red-600 text-sm mb-2">{err}</p>}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 rounded"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-red-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
