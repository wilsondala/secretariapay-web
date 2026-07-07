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
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { env } from '../config/env.js';
import { appInfo } from '../config/appInfo.js';

const groups = [
  {
    label: 'Visão geral',
    items: [['Dashboard', '/dashboard', Home, 'Resumo executivo']],
  },
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
      ['Importações', '/imports', Import, 'Carga de dados'],
      ['Relatórios', '/reports', BarChart3, 'Gestão executiva'],
      ['Configurações', '/settings', Settings, 'Regras e ambiente'],
    ],
  },
];

function NavItem({ label, path, Icon, helper, onClose }) {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-black transition duration-200',
          isActive
            ? 'bg-white text-imetro-navy shadow-[0_18px_44px_rgba(0,0,0,.22)] ring-1 ring-white/40'
            : 'text-white/76 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
            isActive ? 'bg-imetro-gold text-imetro-navy' : 'bg-white/8 text-white/82 group-hover:bg-white/12',
          ].join(' ')}>
            <Icon size={19} strokeWidth={2.3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate leading-5">{label}</span>
            <span className={['mt-0.5 block truncate text-[11px] font-bold', isActive ? 'text-slate-500' : 'text-white/45'].join(' ')}>{helper}</span>
          </span>
          <ChevronRight size={16} className={isActive ? 'text-imetro-navy' : 'text-white/35 group-hover:text-white/60'} />
        </>
      )}
    </NavLink>
  );
}

function Content({ onClose }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#061936] via-[#071f42] to-[#030b18] text-white shadow-[28px_0_70px_rgba(7,20,45,.24)]">
      <div className="relative px-5 pb-5 pt-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-24 h-24 w-24 rounded-full bg-imetro-gold/20 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/10 text-lg font-black shadow-[0_18px_44px_rgba(0,0,0,.24)]">
            SP
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[21px] font-black leading-tight tracking-tight">{env.appName}</p>
            <p className="mt-2 max-w-[210px] text-[12px] font-semibold uppercase tracking-[.14em] text-imetro-gold">IMETRO · DCR</p>
          </div>
          <button className="rounded-2xl p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-5 rounded-3xl border border-white/10 bg-white/[.07] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
              <ShieldCheck size={19} />
            </span>
            <div>
              <p className="text-sm font-black">Painel financeiro</p>
              <p className="mt-1 text-xs font-medium text-white/58">Propinas · guias · recibos</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[.18em] text-white/36">{group.label}</p>
            <div className="space-y-1.5">
              {group.items.map(([label, path, Icon, helper]) => (
                <NavItem key={path} label={label} path={path} Icon={Icon} helper={helper} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-3xl border border-white/10 bg-white/[.07] p-4 shadow-[0_18px_42px_rgba(0,0,0,.18)]">
          <div className="flex items-center justify-between gap-3">
            <CalendarDays size={18} className="text-imetro-gold" />
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/70">Demo ativa</span>
          </div>
          <p className="mt-3 text-[12px] font-semibold leading-5 text-white/72">{env.institutionName}</p>
          <p className="mt-3 flex items-center gap-2 text-xs font-black text-white"><Sparkles size={14} className="text-imetro-gold" /> v{appInfo.version} · {appInfo.environmentLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] lg:block">
        <Content />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-label="Fechar menu" />
          <aside className="relative h-full w-[292px] max-w-[88vw]">
            <Content onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
