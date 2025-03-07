import "../styles/globals.css";
import Layout from "../components/Layout";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const publicRoutes = ["/", "/landing", "/login", "/signup"];
  const showSidebar = !publicRoutes.includes(router.pathname);

  // Set role based on the current route
  let role = "home";
  if (router.pathname.includes("instructor-dashboard")) {
    role = "instructor";
  } else if (router.pathname.includes("student-dashboard")) {
    role = "student";
  }

  return (
    <Layout showSidebar={showSidebar} role={role}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
