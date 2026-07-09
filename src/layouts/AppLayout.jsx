import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('secretariapay.sidebarCollapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('secretariapay.sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((value) => !value);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#eef3f8] text-[14px] text-imetro-ink">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[16rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-[-16rem] right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,.055)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <Sidebar open={open} collapsed={collapsed} onClose={() => setOpen(false)} onToggleCollapsed={toggleCollapsed} />
      <div className={collapsed ? 'relative transition-all duration-300 lg:pl-[96px]' : 'relative transition-all duration-300 lg:pl-[292px]'}>
        <Topbar onMenuClick={() => setOpen(true)} collapsed={collapsed} onToggleSidebar={toggleCollapsed} />
        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
