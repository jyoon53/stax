import UniversalHeader from "./UniversalHeader";
import InstructorHeader from "./InstructorHeader";
import StudentHeader from "./StudentHeader";
import UniversalFooter from "./UniversalFooter";
import InstructorFooter from "./InstructorFooter";
import StudentFooter from "./StudentFooter";
import Sidebar from "./Sidebar";

export default function Layout({
  children,
  showSidebar = true,
  role = "home",
}) {
  const renderHeader = () => {
    if (role === "instructor") {
      return <InstructorHeader />;
    }
    if (role === "student") {
      return <StudentHeader />;
    }
    return <UniversalHeader />;
  };

  const renderFooter = () => {
    if (role === "instructor") {
      return <InstructorFooter />;
    }
    if (role === "student") {
      return <StudentFooter />;
    }
    return <UniversalFooter />;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {renderHeader()}
      <div className="flex flex-1">
        {showSidebar && role !== "home" && (
          <aside className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            <Sidebar />
          </aside>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
      {renderFooter()}
    </div>
  );
}
