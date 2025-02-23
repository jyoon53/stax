// src/pages/_app.jsx
import "../styles/globals.css";
import Layout from "./components/layout"; // Corrected path and capitalization
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  // For landing, login, or signup pages, hide sidebar (adjust routes as needed)
  const publicRoutes = ["/", "/landing", "/login", "/signup"];
  const showSidebar = !publicRoutes.includes(router.pathname);

  return (
    <Layout showSidebar={showSidebar}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
