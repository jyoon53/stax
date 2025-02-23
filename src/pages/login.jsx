// src/pages/login.jsx
import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-8 bg-white border rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to Stax</h2>
        <form>
          <input
            type="text"
            placeholder="Roblox Username"
            className="w-full border rounded p-2 mb-4"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded p-2 mb-4"
          />
          <button className="w-full bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 rounded">
            Login
          </button>
        </form>
        <p className="mt-4 text-center">
          Don’t have an account?{" "}
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
