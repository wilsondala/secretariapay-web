import { Bell, FileText, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, RefreshCw, Send, ShieldCheck, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../shared/auth/useAuth.js';
import { env } from '../config/env.js';

const pageMap = {
  '/dashboard': { section: 'Visão geral', title: 'Painel', description: 'Resumo executivo' },
  '/students': { section: 'Operação financeira', title: 'Estudantes', description: 'Cadastro e contacto' },
  '/charges': { section: 'Operação financeira', title: 'Cobranças', description: 'Propinas e guias' },
  '/proofs': { section: 'Operação financeira', title: 'Comprovativos', description: 'Validação DCR' },
  '/receipts': { section: 'Operação financeira', title: 'Recibos', description: 'Documentos emitidos' },
  '/whatsapp': { section: 'Automação e análise', title: 'WhatsApp', description: 'Atendimento e avisos' },
  '/operations': { section: 'Automação e análise', title: 'Operações', description: 'Automação institucional' },
  '/imports': { section: 'Automação e análise', title: 'Importações', description: 'Carga de dados' },
  '/reports': { section: 'Automação e análise', title: 'Relatórios', description: 'Gestão executiva' },
  '/settings': { section: 'Automação e análise', title: 'Configurações', description: 'Regras e ambiente' },
  '/demo': { section: 'Demonstração', title: 'Checklist', description: 'Validação do MVP' },
  '/about': { section: 'Institucional', title: 'Sobre', description: 'Informações do sistema' },
};

export default function Topbar({ onMenuClick, collapsed, onToggleSidebar, theme = 'light', onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = pageMap[location.pathname] || { section: 'Painel administrativo', title: 'SecretáriaPay', description: 'Navegação institucional' };
  const fixedClass = collapsed ? 'lg:left-[96px]' : 'lg:left-[292px]';
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,.045)] backdrop-blur-2xl transition-all duration-300 dark:border-slate-800 dark:bg-[#0F172A]/92 dark:shadow-none ${fixedClass}`}>
      <div className="mx-auto flex min-h-[72px] max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
        <button className="rounded-2xl p-2.5 text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={onMenuClick} aria-label="Abrir menu">
          <Menu size={24} />
        </button>

        <button className="hidden rounded-2xl p-2.5 text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 lg:inline-flex" onClick={onToggleSidebar} aria-label={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'} title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}>
          {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-extrabold text-slate-950 dark:text-slate-50">{env.dcrName}</p>
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
              Produção monitorada
            </span>
          </div>
          <p className="mt-1 hidden truncate text-[13px] font-medium text-slate-500 dark:text-slate-400 sm:block">
            Painel financeiro académico · guias, cobranças, comprovativos, recibos e WhatsApp
          </p>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-primary px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,.22)] transition hover:bg-brand-hover dark:shadow-none" onClick={() => window.location.reload()}>
            <RefreshCw size={17} />
            Atualizar
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:hover:bg-slate-700" onClick={() => navigate('/reports')}>
            <FileText size={17} />
            Relatório
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-success px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(22,163,74,.20)] transition hover:bg-emerald-700 dark:shadow-none" onClick={() => navigate('/whatsapp')}>
            <Send size={17} />
            WhatsApp financeiro
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:hover:bg-slate-700"
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button className="relative rounded-2xl p-2.5 text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800" aria-label="Notificações">
          <Bell size={21} />
          <span className="absolute right-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-danger px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900">3</span>
        </button>

        <div className="hidden min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-right shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none sm:block">
          <p className="max-w-[180px] truncate text-sm font-bold text-slate-900 dark:text-slate-50">{user?.email || 'admin@imetro.ao'}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <ShieldCheck size={12} /> {user?.role || 'ADMIN'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 text-xs font-bold text-brand-danger shadow-sm transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:shadow-none"
          title="Sair do painel"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#0F766E] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(37,99,235,.22)] dark:shadow-none">AD</div>
      </div>

      <div className="border-t border-slate-100 bg-white/72 dark:border-slate-800 dark:bg-[#111827]/80">
        <div className="mx-auto flex min-h-[38px] max-w-[1680px] items-center gap-2 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8 xl:px-10">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">Navegação</span>
          <span className="truncate">{page.section}</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="truncate font-bold text-slate-950 dark:text-slate-50">{page.title}</span>
          <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">—</span>
          <span className="hidden truncate sm:inline">{page.description}</span>
        </div>
      </div>
    </header>
  );
}
