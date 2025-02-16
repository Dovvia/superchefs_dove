import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useState } from "react";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div 
    className="min-h-screen bg-gray-50"
    >
      <Header onMenuClick={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main 
      // className="pt-16 lg:pl-64"
      >
        <div 
        className="container py-6"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;