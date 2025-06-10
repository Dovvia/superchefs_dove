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
    className="min-h-screen bg-transparent text-gray-800 dark:text-gray-200"
    >
      <Header onMenuClick={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main 
      // className="pt-16 lg:pl-64""
      >
        <div 
        className="container mx-auto px-0.5 sm:px-6 lg:px-8 flex flex-col min-h-screen py-4"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;