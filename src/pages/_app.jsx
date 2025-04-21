// pages/_app.js
// -----------------------------------------------------------------------------
// Global wrapper that injects <Layout> around every page.
// • Reads user role (“student” | “instructor”) from localStorage.
// • Falls back to "guest" when not signed in.
// • Shows the sidebar on all private routes.
// -----------------------------------------------------------------------------

import "../styles/globals.css";
import Layout from "./components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [role, setRole] = useState("guest"); // default while loading

  /* --- hydrate role from localStorage on client only ---------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("userType"); // "student" | "instructor"
    if (stored === "student" || stored === "instructor") setRole(stored);
  }, []);

  /* --- decide whether to render the sidebar ------------------------------- */
  const PUBLIC_ROUTES = ["/", "/login", "/signup"];
  const withSidebar = !PUBLIC_ROUTES.includes(router.pathname);

  return (
    <Layout role={role} withSidebar={withSidebar}>
      <Component {...pageProps} />
    </Layout>
  );
}
