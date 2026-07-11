import {
  Banknote,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileCheck2,
  FileText,
  Home,
  Import,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { env } from '../config/env.js';
import { appInfo } from '../config/appInfo.js';
import useAuth from '../shared/auth/useAuth.js';
import { canAccessRoute } from '../shared/auth/permissions.js';

const groups = [
  { label: 'Visão geral', items: [['Painel', '/dashboard', Home, 'Resumo executivo']] },
  {
    label: 'Gestão financeira',
    items: [
      ['Estudantes', '/students', Users, 'Cadastro e contacto'],
      ['Cobranças', '/charges', FileText, 'Propinas e guias'],
      ['Comprovativos', '/proofs', FileCheck2, 'Validação DCR'],
      ['Recibos', '/receipts', Banknote, 'Documentos emitidos'],
    ],
  },
  {
    label: 'Gestão académica',
    items: [['Cursos e turmas', '/academic-catalog', BookOpen, 'Estrutura académica']],
  },
  {
    label: 'Automação e canais',
    items: [
      ['WhatsApp', '/whatsapp', MessageCircle, 'Atendimento e avisos'],
      ['Operações', '/operations', Workflow, 'Automação institucional'],
      ['Importações', '/imports', Import, 'Carga de dados'],
      ['Relatórios', '/reports', BarChart3, 'Gestão executiva'],
    ],
  },
  {
    label: 'Administração',
    items: [
      ['Usuários e permissões', '/admin-users', UserCog, 'Acessos e perfis'],
      ['Configurações', '/settings', Settings, 'Regras e ambiente'],
    ],
  },
];

function NavItem({ label, path, Icon, helper, onClose, collapsed }) {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      title={collapsed ? `${label} — ${helper}` : undefined}
      className={({ isActive }) => [
        'group relative flex items-center rounded-xl text-[13px] font-semibold transition duration-200',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-[#3157D5] text-white shadow-[0_10px_24px_rgba(49,87,213,.28)]'
          : 'text-slate-600 hover:bg-[#EEF3FF] hover:text-[#2449C6] dark:text-slate-300 dark:hover:bg-white/[.07] dark:hover:text-white',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          <span className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
            isActive
              ? 'bg-white/16 text-white'
              : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#3157D5] dark:bg-white/[.06] dark:text-slate-300 dark:group-hover:bg-white/[.10] dark:group-hover:text-white',
          ].join(' ')}>
            <Icon size={17} strokeWidth={2.1} />
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-5">{label}</span>
                <span className={['mt-0.5 block truncate text-[10px] font-medium', isActive ? 'text-white/72' : 'text-slate-400 dark:text-slate-500'].join(' ')}>{helper}</span>
              </span>
              <ChevronRight size={14} className={isActive ? 'text-white/75' : 'text-slate-300 dark:text-white/20'} />
            </>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function Content({ onClose, collapsed = false, onToggleCollapsed }) {
  const { user } = useAuth();
  const visibleGroups = groups
    .map((group) => ({ ...group, items: group.items.filter(([, path]) => canAccessRoute(user, path)) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="sidebar-surface flex h-full flex-col overflow-hidden border-r border-[#E5EAF2] bg-white text-[#0F172A] shadow-[18px_0_48px_rgba(15,23,42,.06)] dark:border-white/[.07] dark:bg-[#081321] dark:text-white dark:shadow-[18px_0_50px_rgba(0,0,0,.22)]">
      <div className={collapsed ? 'relative px-3 pb-4 pt-5' : 'relative px-4 pb-4 pt-5'}>
        <div className={collapsed ? 'relative flex flex-col items-center gap-3' : 'relative flex items-start gap-3'}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3157D5] text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(49,87,213,.25)]">SP</div>
          {!collapsed ? <div className="min-w-0 flex-1 pt-0.5"><p className="text-[16px] font-extrabold leading-tight tracking-tight">Secretária<span className="text-[#3157D5] dark:text-[#7EA0FF]">Pay</span></p><p className="mt-1 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400 dark:text-slate-500">Académico</p><p className="mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">IMETRO · DCR</p></div> : null}
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <button type="button" onClick={onToggleCollapsed} className={['relative mt-4 hidden h-9 items-center justify-center gap-2 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] px-3 text-[11px] font-semibold text-slate-500 transition hover:border-[#C7D4F8] hover:bg-[#EEF3FF] hover:text-[#3157D5] dark:border-white/[.08] dark:bg-white/[.04] dark:text-slate-300 dark:hover:bg-white/[.08] lg:inline-flex', collapsed ? 'w-full px-2' : 'w-auto'].join(' ')} title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}{!collapsed ? 'Recolher menu' : null}</button>
      </div>
      <nav className={collapsed ? 'flex-1 space-y-4 overflow-y-auto px-3 pb-5' : 'flex-1 space-y-5 overflow-y-auto px-3 pb-5'}>
        {visibleGroups.map((group) => <div key={group.label}>{!collapsed ? <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400 dark:text-slate-500">{group.label}</p> : null}<div className="space-y-1">{group.items.map(([label, path, Icon, helper]) => <NavItem key={path} label={label} path={path} Icon={Icon} helper={helper} onClose={onClose} collapsed={collapsed} />)}</div></div>)}
      </nav>
      <div className="px-3 pb-4"><div className="rounded-xl border border-[#E5EAF2] bg-[#F7F9FC] p-3.5 dark:border-white/[.08] dark:bg-white/[.04]"><div className="flex items-center justify-between gap-3"><CalendarDays size={17} className="text-[#3157D5] dark:text-[#7EA0FF]" />{!collapsed ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Online</span> : null}</div>{!collapsed ? <><p className="mt-3 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">Suporte DCR</p><p className="mt-1 truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{env.institutionName}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{user?.role || 'Perfil não informado'}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400"><Sparkles size={12} className="text-[#F4B400]" /> v{appInfo.version} · {appInfo.environmentLabel}</p></> : null}</div></div>
    </div>
  );
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapsed }) {
  return <><aside className={collapsed ? 'fixed inset-y-0 left-0 z-40 hidden w-[84px] transition-all duration-300 lg:block' : 'fixed inset-y-0 left-0 z-40 hidden w-[252px] transition-all duration-300 lg:block'}><Content collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} /></aside>{open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-label="Fechar menu" /><aside className="relative h-full w-[252px] max-w-[88vw]"><Content onClose={onClose} collapsed={false} onToggleCollapsed={onToggleCollapsed} /></aside></div>}</>;
}
