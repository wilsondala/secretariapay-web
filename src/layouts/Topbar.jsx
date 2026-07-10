import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, FileText, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, RefreshCw, Send, ShieldCheck, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../shared/auth/useAuth.js';
import { env } from '../config/env.js';
import { loadTopbarAlerts } from '../services/alertService.js';

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

function formatBadge(value) {
  const count = Number(value || 0);
  if (count > 99) return '99+';
  return String(count);
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
  return 'border-[#007DB8]/18 bg-[#007DB8]/10 text-[#005AA7] dark:text-sky-300';
}

export default function Topbar({ onMenuClick, collapsed, onToggleSidebar, theme = 'light', onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const page = pageMap[location.pathname] || { section: 'Painel administrativo', title: 'SecretáriaPay', description: 'Navegação institucional' };
  const fixedClass = collapsed ? 'lg:left-[96px]' : 'lg:left-[292px]';
  const isDark = theme === 'dark';
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alerts, setAlerts] = useState({ count: 0, recentMessages: 0, hasRecentMessages: false, items: [], lastUpdatedAt: null });

  async function refreshAlerts() {
    setAlertsLoading(true);
    try {
      const result = await loadTopbarAlerts();
      setAlerts(result);
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
    <header className={`fixed left-0 right-0 top-0 z-50 border-b border-[#E6F0FB] bg-white/90 shadow-[0_10px_30px_rgba(8,43,75,.05)] backdrop-blur-[14px] transition-all duration-300 dark:border-white/10 dark:bg-[#061F36]/92 dark:shadow-none ${fixedClass}`}>
      <div className="mx-auto flex min-h-[72px] max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
        <button className="rounded-[14px] p-2.5 text-[#082B4B] transition hover:bg-[#E6F0FB]/70 dark:text-white dark:hover:bg-white/10 lg:hidden" onClick={onMenuClick} aria-label="Abrir menu">
          <Menu size={24} />
        </button>

        <button className="hidden rounded-[14px] p-2.5 text-[#082B4B] transition hover:bg-[#E6F0FB]/70 dark:text-white dark:hover:bg-white/10 lg:inline-flex" onClick={onToggleSidebar} aria-label={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'} title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}>
          {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-extrabold text-[#082B4B] dark:text-white">{env.dcrName}</p>
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 sm:inline-flex">
              Produção monitorada
            </span>
          </div>
          <p className="mt-1 hidden truncate text-[13px] font-medium text-slate-500 dark:text-slate-300 sm:block">
            Painel financeiro académico · guias, cobranças, comprovativos, recibos e WhatsApp
          </p>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <button className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#005AA7] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,90,167,.20)] transition hover:bg-[#007DB8] dark:shadow-none" onClick={() => window.location.reload()}>
            <RefreshCw size={17} />
            Atualizar
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-[#D8E6F3] bg-white px-4 text-sm font-semibold text-[#005AA7] shadow-sm transition hover:bg-[#F8FAFC] dark:border-white/15 dark:bg-[#061F36]/65 dark:text-[#E6F0FB] dark:shadow-none dark:hover:bg-[#082B4B]" onClick={() => navigate('/reports')}>
            <FileText size={17} />
            Relatório
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#16A34A] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(22,163,74,.20)] transition hover:bg-[#15803D] dark:shadow-none" onClick={() => navigate('/whatsapp')}>
            <Send size={17} />
            WhatsApp financeiro
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#D8E6F3] bg-white text-[#082B4B] shadow-sm transition hover:bg-[#F8FAFC] dark:border-white/15 dark:bg-[#061F36]/65 dark:text-[#E6F0FB] dark:shadow-none dark:hover:bg-[#082B4B]"
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAlertsOpen((value) => !value)}
            className="relative rounded-[14px] p-2.5 text-[#082B4B] transition hover:bg-[#E6F0FB]/70 dark:text-white dark:hover:bg-white/10"
            aria-label="Alertas do sistema"
            title="Alertas reais do sistema"
          >
            <Bell size={21} />
            {alerts.count > 0 ? (
              <span className="absolute right-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-[#061F36]">{formatBadge(alerts.count)}</span>
            ) : alerts.hasRecentMessages ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#16A34A] ring-2 ring-white dark:ring-[#061F36]" />
            ) : null}
          </button>

          {alertsOpen ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(380px,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-[#E6F0FB] bg-white shadow-[0_22px_70px_rgba(8,43,75,.16)] dark:border-white/10 dark:bg-[#082B4B] dark:shadow-none">
              <div className="flex items-start justify-between gap-3 border-b border-[#E6F0FB] px-4 py-3 dark:border-white/10">
                <div>
                  <p className="text-sm font-extrabold text-[#082B4B] dark:text-white">Alertas do sistema</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-300">Atualizado {formatTime(alerts.lastUpdatedAt) || 'agora'}</p>
                </div>
                <button type="button" onClick={refreshAlerts} className="rounded-xl border border-[#D8E6F3] px-2.5 py-1.5 text-xs font-bold text-[#005AA7] hover:bg-[#F8FAFC] dark:border-white/15 dark:text-[#E6F0FB] dark:hover:bg-white/10">
                  {alertsLoading ? '...' : 'Atualizar'}
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-3">
                {alerts.items.length ? alerts.items.slice(0, 8).map((item, index) => {
                  const Icon = item.type === 'critical' || item.type === 'warning' ? AlertTriangle : CheckCircle2;
                  return (
                    <button
                      type="button"
                      key={`${item.title}-${index}`}
                      onClick={() => openAlertPath(item.path)}
                      className="mb-2 flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:border-[#D8E6F3] hover:bg-[#F8FAFC] dark:hover:border-white/10 dark:hover:bg-white/8"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${alertToneClasses(item.type)}`}>
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#082B4B] dark:text-white">{item.title}</span>
                        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{item.description}</span>
                      </span>
                    </button>
                  );
                }) : (
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Nenhum alerta crítico no momento.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden min-w-0 rounded-[14px] border border-[#D8E6F3] bg-white px-3.5 py-2 text-right shadow-sm dark:border-white/15 dark:bg-[#061F36]/65 dark:shadow-none sm:block">
          <p className="max-w-[180px] truncate text-sm font-bold text-[#082B4B] dark:text-white">{user?.email || 'admin@imetro.ao'}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            <ShieldCheck size={12} /> {user?.role || 'ADMIN'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-red-500/20 bg-red-500/10 px-3.5 text-xs font-bold text-[#DC2626] shadow-sm transition hover:bg-red-500/15 dark:text-red-300 dark:shadow-none"
          title="Sair do painel"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#005AA7] to-[#082B4B] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(0,90,167,.20)] dark:shadow-none">AD</div>
      </div>

      <div className="border-t border-[#E6F0FB] bg-white/72 dark:border-white/10 dark:bg-[#082B4B]/50">
        <div className="mx-auto flex min-h-[38px] max-w-[1680px] items-center gap-2 px-4 text-xs font-semibold text-slate-500 dark:text-slate-300 sm:px-6 lg:px-8 xl:px-10">
          <span className="rounded-full bg-[#E6F0FB] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#082B4B] dark:bg-white/10 dark:text-[#E6F0FB]">Navegação</span>
          <span className="truncate">{page.section}</span>
          <span className="text-slate-300 dark:text-white/30">/</span>
          <span className="truncate font-bold text-[#082B4B] dark:text-white">{page.title}</span>
          <span className="hidden text-slate-300 dark:text-white/30 sm:inline">—</span>
          <span className="hidden truncate sm:inline">{page.description}</span>
        </div>
      </div>
    </header>
  );
}
