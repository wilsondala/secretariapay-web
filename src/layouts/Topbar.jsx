import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, FileText, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, RefreshCw, Send, ShieldCheck, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../shared/auth/useAuth.js';
import { env } from '../config/env.js';
import { loadTopbarAlerts } from '../services/alertService.js';

const pageMap = {
  '/dashboard': { section: 'Visão geral', title: 'Painel', description: 'Resumo executivo' },
  '/students': { section: 'Gestão financeira', title: 'Estudantes', description: 'Cadastro e contacto' },
  '/charges': { section: 'Gestão financeira', title: 'Cobranças', description: 'Propinas e guias' },
  '/proofs': { section: 'Gestão financeira', title: 'Comprovativos', description: 'Validação DCR' },
  '/receipts': { section: 'Gestão financeira', title: 'Recibos', description: 'Documentos emitidos' },
  '/whatsapp': { section: 'Automação e canais', title: 'WhatsApp', description: 'Atendimento e avisos' },
  '/operations': { section: 'Automação e canais', title: 'Operações', description: 'Automação institucional' },
  '/imports': { section: 'Automação e canais', title: 'Importações', description: 'Carga de dados' },
  '/reports': { section: 'Automação e canais', title: 'Relatórios', description: 'Gestão executiva' },
  '/settings': { section: 'Configurações', title: 'Configurações', description: 'Regras e ambiente' },
};

function formatBadge(value) {
  const count = Number(value || 0);
  return count > 99 ? '99+' : String(count);
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-AO', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function alertToneClasses(type) {
  if (type === 'critical') return 'border-red-500/15 bg-red-500/10 text-red-700 dark:text-red-300';
  if (type === 'warning') return 'border-amber-500/18 bg-amber-500/12 text-amber-700 dark:text-amber-300';
  if (type === 'success') return 'border-emerald-500/18 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
  return 'border-[#3157D5]/18 bg-[#3157D5]/10 text-[#3157D5] dark:text-[#9BB4FF]';
}

export default function Topbar({ onMenuClick, collapsed, onToggleSidebar, theme = 'light', onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = pageMap[location.pathname] || { section: 'Painel administrativo', title: 'SecretáriaPay', description: 'Navegação institucional' };
  const fixedClass = collapsed ? 'lg:left-[84px]' : 'lg:left-[252px]';
  const isDark = theme === 'dark';
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alerts, setAlerts] = useState({ count: 0, recentMessages: 0, hasRecentMessages: false, items: [], lastUpdatedAt: null });

  async function refreshAlerts() {
    setAlertsLoading(true);
    try {
      setAlerts(await loadTopbarAlerts());
    } catch (_error) {
      setAlerts({ count: 0, recentMessages: 0, hasRecentMessages: false, items: [{ type: 'warning', title: 'Não foi possível carregar alertas', description: 'Verifique a conexão com a API institucional.', path: '/operations' }], lastUpdatedAt: new Date().toISOString() });
    } finally {
      setAlertsLoading(false);
    }
  }

  useEffect(() => {
    refreshAlerts();
    const interval = window.setInterval(refreshAlerts, 60000);
    const onFocus = () => refreshAlerts();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openAlertPath = (path) => {
    setAlertsOpen(false);
    if (path) navigate(path);
  };

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 border-b border-[#E5EAF2] bg-white/88 shadow-[0_8px_28px_rgba(15,23,42,.05)] backdrop-blur-xl transition-all duration-300 dark:border-white/[.07] dark:bg-[#081321]/92 dark:shadow-[0_8px_30px_rgba(0,0,0,.18)] ${fixedClass}`}>
      <div className="mx-auto flex min-h-[64px] max-w-[1600px] items-center gap-2.5 px-4 sm:px-6 lg:px-7 xl:px-8">
        <button className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[.07] lg:hidden" onClick={onMenuClick} aria-label="Abrir menu"><Menu size={22} /></button>
        <button className="hidden rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[.07] lg:inline-flex" onClick={onToggleSidebar} aria-label={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'} title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}>
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[14px] font-extrabold text-[#0F172A] dark:text-white">{env.dcrName}</p>
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 sm:inline-flex">WhatsApp conectado</span>
          </div>
          <p className="mt-0.5 hidden truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">{page.section} / {page.title} — {page.description}</p>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <button className="topbar-action topbar-action-primary" onClick={() => window.location.reload()}><RefreshCw size={15} />Atualizar</button>
          <button className="topbar-action" onClick={() => navigate('/reports')}><FileText size={15} />Relatórios</button>
          <button className="topbar-action topbar-action-success" onClick={() => navigate('/whatsapp')}><Send size={15} />WhatsApp financeiro</button>
        </div>

        <button type="button" onClick={onToggleTheme} className="topbar-icon" aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'} title={isDark ? 'Modo claro' : 'Modo escuro'}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>

        <div className="relative">
          <button type="button" onClick={() => setAlertsOpen((value) => !value)} className="topbar-icon relative" aria-label="Alertas do sistema" title="Alertas reais do sistema">
            <Bell size={18} />
            {alerts.count > 0 ? <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-[#081321]">{formatBadge(alerts.count)}</span> : alerts.hasRecentMessages ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#081321]" /> : null}
          </button>

          {alertsOpen ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(380px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#E5EAF2] bg-white shadow-[0_22px_70px_rgba(15,23,42,.16)] dark:border-white/[.08] dark:bg-[#0D1B2E]">
              <div className="flex items-start justify-between gap-3 border-b border-[#E5EAF2] px-4 py-3 dark:border-white/[.08]">
                <div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Alertas do sistema</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Atualizado {formatTime(alerts.lastUpdatedAt) || 'agora'}</p></div>
                <button type="button" onClick={refreshAlerts} className="rounded-lg border border-[#E5EAF2] px-2.5 py-1.5 text-xs font-bold text-[#3157D5] hover:bg-slate-50 dark:border-white/[.08] dark:text-[#9BB4FF] dark:hover:bg-white/[.06]">{alertsLoading ? '...' : 'Atualizar'}</button>
              </div>
              <div className="max-h-[360px] overflow-y-auto p-3">
                {alerts.items.length ? alerts.items.slice(0, 8).map((item, index) => {
                  const Icon = item.type === 'critical' || item.type === 'warning' ? AlertTriangle : CheckCircle2;
                  return <button type="button" key={`${item.title}-${index}`} onClick={() => openAlertPath(item.path)} className="mb-2 flex w-full items-start gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-[#E5EAF2] hover:bg-slate-50 dark:hover:border-white/[.08] dark:hover:bg-white/[.05]"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${alertToneClasses(item.type)}`}><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900 dark:text-white">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span></span></button>;
                }) : <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Nenhum alerta crítico no momento.</div>}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden min-w-0 items-center gap-2.5 rounded-xl border border-[#E5EAF2] bg-white px-2.5 py-1.5 dark:border-white/[.08] dark:bg-white/[.04] sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3157D5] to-[#183A9D] text-[10px] font-extrabold text-white">AD</div>
          <div className="hidden text-left 2xl:block"><p className="max-w-[150px] truncate text-xs font-bold text-slate-800 dark:text-white">{user?.email || 'admin@imetro.ao'}</p><p className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400"><ShieldCheck size={10} /> {user?.role || 'ADMIN'}</p></div>
        </div>

        <button type="button" onClick={handleLogout} className="topbar-icon text-red-500 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10" title="Sair do painel"><LogOut size={17} /></button>
      </div>
    </header>
  );
}
