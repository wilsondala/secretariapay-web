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
    <div className="min-h-screen overflow-x-hidden bg-[#F2F5F9] text-[14px] text-slate-950 transition-colors duration-300 dark:bg-[#061F36] dark:bg-[linear-gradient(180deg,#061F36_0%,#082B4B_100%)] dark:text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[16rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#007DB8]/12 blur-3xl dark:bg-[#007DB8]/16" />
        <div className="absolute bottom-[-16rem] right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-[#F2B300]/14 blur-3xl dark:bg-[#F2B300]/10" />
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
