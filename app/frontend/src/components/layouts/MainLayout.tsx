import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B1220] overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111827',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            fontSize: '13px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#111827' },
          },
          error: {
            iconTheme: { primary: '#D71920', secondary: '#111827' },
          },
        }}
      />
    </div>
  );
}
