import "../styles/globals.css";
import Layout from "./components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  // Initially, role is null while we load from localStorage
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Retrieve userType from localStorage (set during login/signup)
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType) {
      setRole(savedUserType);
    } else {
      setRole("home");
    }
  }, []);

  // While role is loading, display a simple loading indicator
  if (role === null) return <div>Loading...</div>;

  // Define public routes (no sidebar) – e.g., home, login, signup
  const publicRoutes = ["/", "/landing", "/login", "/signup"];
  const showSidebar = !publicRoutes.includes(router.pathname);

  return (
    <Layout showSidebar={showSidebar} role={role}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
