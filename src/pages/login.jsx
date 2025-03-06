import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [userType, setUserType] = useState("student");

  const handleLogin = (e) => {
    e.preventDefault();
    // For now, simply redirect based on userType
    if (userType === "student") {
      window.location.href = "/student-dashboard";
    } else {
      window.location.href = "/instructor-dashboard";
    }
  };

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
          <div className="mb-4">
            <label className="mr-4">
              <input
                type="radio"
                name="userType"
                value="student"
                checked={userType === "student"}
                onChange={() => setUserType("student")}
                className="mr-1"
              />
              Student
            </label>
            <label>
              <input
                type="radio"
                name="userType"
                value="instructor"
                checked={userType === "instructor"}
                onChange={() => setUserType("instructor")}
                className="mr-1"
              />
              Instructor
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 rounded"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <Link href="/signup">
            <span className="text-red-600 hover:underline cursor-pointer">
              Sign Up
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
