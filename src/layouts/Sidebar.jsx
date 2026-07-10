import {
  Banknote,
  BarChart3,
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
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { env } from '../config/env.js';
import { appInfo } from '../config/appInfo.js';

const groups = [
  { label: 'Visão geral', items: [['Painel', '/dashboard', Home, 'Resumo executivo']] },
  {
    label: 'Operação financeira',
    items: [
      ['Estudantes', '/students', Users, 'Cadastro e contacto'],
      ['Cobranças', '/charges', FileText, 'Propinas e guias'],
      ['Comprovativos', '/proofs', FileCheck2, 'Validação DCR'],
      ['Recibos', '/receipts', Banknote, 'Documentos emitidos'],
    ],
  },
  {
    label: 'Automação e análise',
    items: [
      ['WhatsApp', '/whatsapp', MessageCircle, 'Atendimento e avisos'],
      ['Operações', '/operations', Workflow, 'Automação institucional'],
      ['Importações', '/imports', Import, 'Carga de dados'],
      ['Relatórios', '/reports', BarChart3, 'Gestão executiva'],
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
        'group flex items-center rounded-2xl text-[14px] font-medium transition duration-200',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-3',
        isActive
          ? 'bg-blue-50 text-brand-primary shadow-sm ring-1 ring-blue-100 dark:bg-blue-500/12 dark:text-blue-200 dark:ring-blue-400/20'
          : 'text-slate-200/78 hover:bg-white/8 hover:text-white dark:hover:bg-blue-500/10',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          <span className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
            isActive ? 'bg-brand-primary text-white dark:bg-blue-500' : 'bg-white/8 text-slate-200/82 group-hover:bg-white/12',
          ].join(' ')}>
            <Icon size={19} strokeWidth={2.2} />
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-5">{label}</span>
                <span className={['mt-0.5 block truncate text-[11px] font-medium', isActive ? 'text-blue-700 dark:text-blue-200/80' : 'text-slate-300/45'].join(' ')}>{helper}</span>
              </span>
              <ChevronRight size={16} className={isActive ? 'text-brand-primary dark:text-blue-200' : 'text-white/30 group-hover:text-white/60'} />
            </>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function Content({ onClose, collapsed = false, onToggleCollapsed }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#0B1F42] to-[#07111F] text-white shadow-[28px_0_70px_rgba(7,20,45,.20)] dark:from-[#0B1120] dark:via-[#0F172A] dark:to-[#020617] dark:shadow-none">
      <div className={collapsed ? 'relative px-3 pb-4 pt-5' : 'relative px-5 pb-5 pt-7'}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-24 h-24 w-24 rounded-full bg-teal-400/14 blur-2xl" />
        <div className={collapsed ? 'relative flex flex-col items-center gap-3' : 'relative flex items-start gap-3'}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/10 bg-white/10 text-lg font-extrabold shadow-[0_18px_44px_rgba(0,0,0,.18)]">
            SP
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="text-[21px] font-extrabold leading-tight tracking-tight">{env.appName}</p>
              <p className="mt-2 max-w-[210px] text-[12px] font-semibold uppercase tracking-[.14em] text-blue-200">IMETRO · DCR</p>
            </div>
          ) : null}
          <button className="rounded-2xl p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className={['relative mt-4 hidden h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.07] px-3 text-[12px] font-semibold text-white/75 transition hover:bg-white/12 hover:text-white lg:inline-flex', collapsed ? 'px-2' : ''].join(' ')}
          title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          {!collapsed ? 'Recolher menu' : null}
        </button>

        {!collapsed ? (
          <div className="relative mt-5 rounded-[18px] border border-white/10 bg-white/[.07] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p className="text-sm font-bold">Painel financeiro</p>
                <p className="mt-1 text-xs font-medium text-white/58">Propinas · guias · recibos</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <nav className={collapsed ? 'flex-1 space-y-4 overflow-y-auto px-3 pb-5' : 'flex-1 space-y-6 overflow-y-auto px-4 pb-5'}>
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed ? <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-white/36">{group.label}</p> : null}
            <div className="space-y-1.5">
              {group.items.map(([label, path, Icon, helper]) => (
                <NavItem key={path} label={label} path={path} Icon={Icon} helper={helper} onClose={onClose} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={collapsed ? 'px-3 pb-5' : 'px-4 pb-5'}>
        <div className="rounded-[18px] border border-white/10 bg-white/[.07] p-4 shadow-[0_18px_42px_rgba(0,0,0,.12)] dark:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <CalendarDays size={18} className="text-blue-200" />
            {!collapsed ? <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/70">Demo ativa</span> : null}
          </div>
          {!collapsed ? (
            <>
              <p className="mt-3 text-[12px] font-medium leading-5 text-white/72">{env.institutionName}</p>
              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-white"><Sparkles size={14} className="text-blue-200" /> v{appInfo.version} · {appInfo.environmentLabel}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapsed }) {
  return (
    <>
      <aside className={collapsed ? 'fixed inset-y-0 left-0 z-40 hidden w-[96px] transition-all duration-300 lg:block' : 'fixed inset-y-0 left-0 z-40 hidden w-[292px] transition-all duration-300 lg:block'}>
        <Content collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-label="Fechar menu" />
          <aside className="relative h-full w-[292px] max-w-[88vw]">
            <Content onClose={onClose} collapsed={false} onToggleCollapsed={onToggleCollapsed} />
          </aside>
        </div>
      )}
    </>
  );
}
