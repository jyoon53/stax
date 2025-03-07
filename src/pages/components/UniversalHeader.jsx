import Link from "next/link";

export default function UniversalHeader() {
  return (
    <header className="flex justify-between items-center p-6 bg-white shadow-sm">
      <div className="text-2xl font-bold text-gray-800">Stax</div>
      <nav>
        <Link href="/login">
          <span className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded cursor-pointer">
            Login
          </span>
        </Link>
      </nav>
    </header>
  );
}
