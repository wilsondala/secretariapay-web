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
    <div className="relative min-h-screen overflow-x-hidden bg-[#F5F7FB] text-[14px] text-slate-950 transition-colors duration-300 dark:bg-[#07111F] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[8%] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#2F80ED]/10 blur-[110px] dark:bg-[#2F80ED]/16" />
        <div className="absolute right-[-10rem] top-[18%] h-[34rem] w-[34rem] rounded-full bg-[#F4B400]/8 blur-[120px] dark:bg-[#F4B400]/7" />
        <div className="absolute bottom-[-22rem] left-[38%] h-[38rem] w-[38rem] rounded-full bg-[#1769E0]/7 blur-[120px] dark:bg-[#1769E0]/10" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.035)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 dark:opacity-20" />
      </div>

      <Sidebar open={open} collapsed={collapsed} onClose={() => setOpen(false)} onToggleCollapsed={toggleCollapsed} />
      <div className={collapsed ? 'relative transition-all duration-300 lg:pl-[96px]' : 'relative transition-all duration-300 lg:pl-[292px]'}>
        <Topbar onMenuClick={() => setOpen(true)} collapsed={collapsed} onToggleSidebar={toggleCollapsed} theme={theme} onToggleTheme={toggleTheme} />
        <main className="relative mx-auto w-full max-w-[1540px] px-4 pb-10 pt-[108px] sm:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
