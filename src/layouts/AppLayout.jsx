import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('secretariapay.theme') || 'light';
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('secretariapay.sidebarCollapsed') === 'true');
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('secretariapay.sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('secretariapay.theme', theme);
  }, [theme]);

  const toggleCollapsed = () => setCollapsed((value) => !value);
  const toggleTheme = () => setTheme((value) => (value === 'dark' ? 'light' : 'dark'));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[14px] text-slate-950 transition-colors duration-300 dark:bg-[#0B1120] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[16rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute bottom-[-16rem] right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-teal-100/60 blur-3xl dark:bg-teal-900/20" />
      </div>

      <Sidebar open={open} collapsed={collapsed} onClose={() => setOpen(false)} onToggleCollapsed={toggleCollapsed} />
      <div className={collapsed ? 'relative transition-all duration-300 lg:pl-[96px]' : 'relative transition-all duration-300 lg:pl-[292px]'}>
        <Topbar onMenuClick={() => setOpen(true)} collapsed={collapsed} onToggleSidebar={toggleCollapsed} theme={theme} onToggleTheme={toggleTheme} />
        <main className="mx-auto w-full max-w-[1680px] px-4 pb-6 pt-[126px] sm:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
