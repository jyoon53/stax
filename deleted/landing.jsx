// src/pages/landing.jsx
import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 flex justify-center">
          <img src="/logo.png" alt="Stax Illustration" className="w-3/4" />
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0 text-center md:text-left">
          <h1 className="text-5xl font-serif font-bold mb-4">
            Stax - Roblox-based Education Platform
          </h1>
          <p className="text-xl mb-8">
            Build, learn, and scale your educational journey with structured,
            interactive Roblox experiences.
          </p>
          <Link href="/signup">
            <span className="bg-red-600 hover:bg-red-700 transition duration-300 text-white py-3 px-6 rounded font-semibold cursor-pointer">
              Get Started
            </span>
          </Link>
        </div>
      </div>
      <footer className="mt-12 text-gray-500">
        <Link href="/privacy">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
        </Link>{" "}
        |{" "}
        <Link href="/terms">
          <span className="hover:underline cursor-pointer">
            Terms of Service
          </span>
        </Link>
      </footer>
    </div>
  );
}
