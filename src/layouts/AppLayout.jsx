import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('secretariapay.theme') || 'light';
}

export default function AppLayout() {
  const location = useLocation();
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
  const routeClass = location.pathname === '/operations' ? 'panel-page operations-page' : 'panel-page';

  return (
    <div className="app-shell relative min-h-screen overflow-x-hidden text-[14px] text-slate-950 transition-colors duration-300 dark:text-white">
      <div className="app-ambient pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-blue absolute left-[12%] top-[-18rem] h-[42rem] w-[42rem] rounded-full blur-[120px]" />
        <div className="ambient-gold absolute right-[-12rem] top-[8%] h-[34rem] w-[34rem] rounded-full blur-[130px]" />
      </div>

      <Sidebar open={open} collapsed={collapsed} onClose={() => setOpen(false)} onToggleCollapsed={toggleCollapsed} />
      <div className={collapsed ? 'relative transition-all duration-300 lg:pl-[84px]' : 'relative transition-all duration-300 lg:pl-[252px]'}>
        <Topbar onMenuClick={() => setOpen(true)} collapsed={collapsed} onToggleSidebar={toggleCollapsed} theme={theme} onToggleTheme={toggleTheme} />
        <main className={`relative mx-auto w-full max-w-[1600px] px-4 pb-10 pt-[96px] sm:px-6 lg:px-7 xl:px-8 ${routeClass}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
