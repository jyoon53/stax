// pages/index.js
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  /* auto‑redirect returning users so they skip the landing page */
  useEffect(() => {
    const role = localStorage.getItem("userType");
    if (role === "student") router.replace("/student-dashboard");
    if (role === "instructor") router.replace("/instructor-dashboard");
  }, [router]);

  return (
    <>
      <Head>
        <title>Stax – Roblox‑based Education Platform</title>
        <meta
          name="description"
          content="Stax harnesses the creativity of Roblox to deliver immersive, interactive lessons."
        />
      </Head>

      <main className="container mx-auto px-6 py-20">
        {/* Hero */}
        <section className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-transparent to-blue-100 -z-10" />
          <h1 className="text-5xl font-serif font-bold mb-4">
            Welcome to <span className="text-red-600">Stax</span>
          </h1>

          <p className="text-xl mb-6 max-w-3xl mx-auto">
            Stax is a Roblox‑based education platform dedicated to
            revolutionizing the learning experience. Our mission is to harness
            the creativity and interactivity of Roblox to deliver engaging,
            effective, and fun education.
          </p>

          <p className="text-lg mb-10 max-w-2xl mx-auto">
            Enjoy immersive lessons that blend gaming with learning. Whether
            you&rsquo;re a student or an instructor, Stax provides the tools
            that make learning an adventure.
          </p>

          <Link
            href="/login"
            className="bg-red-600 hover:bg-red-700 transition text-white py-3 px-8 rounded font-semibold inline-block"
          >
            Get Started
          </Link>
        </section>

        {/* Why Roblox */}
        <section className="mt-24">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Why Roblox Education?
          </h2>
          <p className="text-lg max-w-4xl mx-auto text-center">
            Roblox offers a dynamic environment for interactive learning,
            empowering educators to create immersive lessons that captivate
            students. Stax leverages this platform to provide a comprehensive
            LMS solution that simplifies course management, fosters creativity,
            and tracks progress seamlessly.
          </p>
        </section>
      </main>
    </>
  );
}
