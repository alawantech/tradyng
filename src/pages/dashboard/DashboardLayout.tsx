import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Menu } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Hamburger for small screens */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-full shadow p-2"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>
      {/* Sidebar: hidden on small screens, slide-in on mobile/tablet */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};