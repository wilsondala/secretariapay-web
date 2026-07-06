import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-[14px] text-imetro-ink">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[280px]">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
