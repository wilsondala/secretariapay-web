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
        'group relative flex items-center rounded-2xl text-[14px] font-medium transition duration-200',
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-3',
        isActive
          ? 'border border-white/12 bg-white/[.14] text-white shadow-[0_14px_34px_rgba(0,0,0,.12)]'
          : 'text-[#E6F0FB]/78 hover:bg-white/[.08] hover:text-white',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed ? <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#F2B300]" /> : null}
          <span className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
            isActive ? 'bg-[#F2B300] text-[#082B4B]' : 'bg-white/[.08] text-[#E6F0FB] group-hover:bg-white/[.12]',
          ].join(' ')}>
            <Icon size={19} strokeWidth={2.2} />
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-5">{label}</span>
                <span className={['mt-0.5 block truncate text-[11px] font-medium', isActive ? 'text-white/75' : 'text-[#E6F0FB]/48'].join(' ')}>{helper}</span>
              </span>
              <ChevronRight size={16} className={isActive ? 'text-[#F2B300]' : 'text-white/30 group-hover:text-white/60'} />
            </>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function Content({ onClose, collapsed = false, onToggleCollapsed }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#005AA7_0%,#082B4B_100%)] text-white shadow-[28px_0_70px_rgba(8,43,75,.20)] dark:shadow-none">
      <div className={collapsed ? 'relative px-3 pb-4 pt-5' : 'relative px-5 pb-5 pt-7'}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/12 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-24 h-24 w-24 rounded-full bg-[#F2B300]/20 blur-2xl" />
        <div className={collapsed ? 'relative flex flex-col items-center gap-3' : 'relative flex items-start gap-3'}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/14 bg-white/[.12] text-lg font-extrabold shadow-[0_18px_44px_rgba(0,0,0,.12)]">
            SP
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="text-[21px] font-extrabold leading-tight tracking-tight">{env.appName}</p>
              <p className="mt-2 max-w-[210px] text-[12px] font-semibold uppercase tracking-[.14em] text-[#FDE68A]">IMETRO · DCR</p>
            </div>
          ) : null}
          <button className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className={['relative mt-4 hidden h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.08] px-3 text-[12px] font-semibold text-[#E6F0FB] transition hover:bg-white/[.14] hover:text-white lg:inline-flex', collapsed ? 'w-full px-2' : 'w-auto'].join(' ')}
          title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          {!collapsed ? 'Recolher menu' : null}
        </button>

        {!collapsed ? (
          <div className="relative mt-5 rounded-[18px] border border-white/10 bg-white/[.08] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/14 text-emerald-200">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p className="text-sm font-bold">Painel financeiro</p>
                <p className="mt-1 text-xs font-medium text-[#E6F0FB]/62">Propinas · guias · recibos</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <nav className={collapsed ? 'flex-1 space-y-4 overflow-y-auto px-3 pb-5' : 'flex-1 space-y-6 overflow-y-auto px-4 pb-5'}>
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed ? <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#E6F0FB]/46">{group.label}</p> : null}
            <div className="space-y-1.5">
              {group.items.map(([label, path, Icon, helper]) => (
                <NavItem key={path} label={label} path={path} Icon={Icon} helper={helper} onClose={onClose} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={collapsed ? 'px-3 pb-5' : 'px-4 pb-5'}>
        <div className="rounded-[18px] border border-white/10 bg-white/[.08] p-4 shadow-[0_18px_42px_rgba(0,0,0,.10)] dark:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <CalendarDays size={18} className="text-[#F2B300]" />
            {!collapsed ? <span className="rounded-full border border-[#F2B300]/28 bg-[#F2B300]/14 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#FDE68A]">Demo ativa</span> : null}
          </div>
          {!collapsed ? (
            <>
              <p className="mt-3 text-[12px] font-medium leading-5 text-[#E6F0FB]/72">{env.institutionName}</p>
              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-white"><Sparkles size={14} className="text-[#F2B300]" /> v{appInfo.version} · {appInfo.environmentLabel}</p>
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
          <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-md" onClick={onClose} aria-label="Fechar menu" />
          <aside className="relative h-full w-[292px] max-w-[88vw]">
            <Content onClose={onClose} collapsed={false} onToggleCollapsed={onToggleCollapsed} />
          </aside>
        </div>
      )}
    </>
  );
}
