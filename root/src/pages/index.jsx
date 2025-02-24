// src/pages/index.jsx
import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-darkGray">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 flex justify-center">
          {/* Placeholder for an illustration image */}
          <img src="/logo.png" alt="Stax Illustration" className="w-3/4" />
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Stax - Roblox-based Education Platform
          </h1>
          <p className="text-lg mb-6">
            Build, learn, and scale your educational journey with structured,
            interactive Roblox experiences.
          </p>
          <Link
            href="/dashboard"
            className="bg-primary hover:bg-accent text-white py-3 px-6 rounded font-semibold"
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
