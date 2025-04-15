// pages/signup.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Signup() {
  const [userType, setUserType] = useState("student");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    localStorage.setItem("userType", userType);
    if (userType === "student") {
      router.push("/student-dashboard");
    } else {
      router.push("/instructor-dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-8 bg-white border rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign Up for Stax
        </h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Roblox Username"
            className="w-full border rounded p-2 mb-4"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
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
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-red-600 hover:underline cursor-pointer">
              Login
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
