// components/Layout.js
import UniversalHeader from "./UniversalHeader";
import InstructorHeader from "./InstructorHeader";
import StudentHeader from "./StudentHeader";
import UniversalFooter from "./UniversalFooter";
import InstructorFooter from "./InstructorFooter";
import StudentFooter from "./StudentFooter";
import InstructorSidebar from "./InstructorSidebar";
import StudentSidebar from "./StudentSidebar";

export default function Layout({
  children,
  showSidebar = true,
  role = "home",
}) {
  const renderHeader = () => {
    if (role === "instructor") return <InstructorHeader />;
    if (role === "student") return <StudentHeader />;
    return <UniversalHeader />;
  };

  const renderFooter = () => {
    if (role === "instructor") return <InstructorFooter />;
    if (role === "student") return <StudentFooter />;
    return <UniversalFooter />;
  };

  const sidebarContent = () => {
    if (!showSidebar) return null;
    if (role === "instructor") return <InstructorSidebar />;
    if (role === "student") return <StudentSidebar />;
    return null;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {renderHeader()}
      <div className="flex flex-1">
        {showSidebar && (
          <aside className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            {sidebarContent()}
          </aside>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
      {renderFooter()}
    </div>
  );
}
