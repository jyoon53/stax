// pages/_app.js
import "../styles/globals.css";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
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

  if (role === null) return <div>Loading...</div>;

  // Define public routes where no sidebar is needed.
  const publicRoutes = ["/", "/login", "/signup"];
  const showSidebar = !publicRoutes.includes(router.pathname);

  return (
    <Layout showSidebar={showSidebar} role={role}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
