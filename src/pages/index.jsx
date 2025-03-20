import Link from "next/link";

export default function Home() {
  return (
    <main className="container mx-auto px-6 py-12">
      <section className="text-center">
        <h1 className="text-5xl font-serif font-bold mb-4">Welcome to Stax</h1>
        <p className="text-xl mb-8">
          Stax is a Roblox-based Education Platform dedicated to revolutionizing
          the learning experience. Our mission is to harness the creativity and
          interactivity of Roblox to deliver engaging, effective, and fun
          education.
        </p>
        <p className="text-lg mb-8">
          Benefit from immersive, interactive lessons that blend gaming with
          learning. Whether you're a student or an instructor, Stax provides the
          tools to make learning an adventure.
        </p>
        <Link href="/login">
          <span className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded font-semibold cursor-pointer">
            Get Started
          </span>
        </Link>
      </section>
      <section className="mt-16">
        <h2 className="text-3xl font-bold mb-4">Why Roblox Education?</h2>
        <p className="text-lg">
          Roblox offers a dynamic and engaging environment for interactive
          learning, empowering educators to create immersive lessons that
          captivate students. Stax leverages this platform to provide a
          comprehensive LMS solution that simplifies course management, fosters
          creativity, and tracks progress seamlessly.
        </p>
      </section>
    </main>
  );
}
