import {
  Banknote,
  BarChart3,
  CalendarDays,
  FileCheck2,
  FileText,
  Home,
  Import,
  MessageCircle,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { env } from '../config/env.js';
import { appInfo } from '../config/appInfo.js';

const items = [
  ['Dashboard', '/dashboard', Home],
  ['Estudantes', '/students', Users],
  ['Cobranças', '/charges', FileText],
  ['Comprovativos', '/proofs', FileCheck2],
  ['Recibos', '/receipts', Banknote],
  ['WhatsApp', '/whatsapp', MessageCircle],
  ['Importações', '/imports', Import],
  ['Relatórios', '/reports', BarChart3],
  ['Configurações', '/settings', Settings],
];

function NavItem({ label, path, Icon, onClose }) {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold transition',
          isActive
            ? 'bg-imetro-gold text-imetro-navy shadow-[0_12px_28px_rgba(215,169,40,.32)]'
            : 'text-white/88 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon size={20} strokeWidth={2.2} />
      <span>{label}</span>
    </NavLink>
  );
}

function Content({ onClose }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#061936] via-[#062044] to-[#031126] text-white">
      <div className="px-5 pb-7 pt-8">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-black leading-tight tracking-tight">{env.appName}</p>
            <p className="mt-2 max-w-[210px] text-sm font-medium leading-6 text-white/82">
              Sistema de Gestão Académica e Financeira
            </p>
          </div>
          <button className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {items.map(([label, path, Icon]) => (
          <NavItem key={path} label={label} path={path} Icon={Icon} onClose={onClose} />
        ))}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-xl border border-white/10 bg-white/[.06] p-4 shadow-[0_18px_42px_rgba(0,0,0,.18)]">
          <CalendarDays size={18} className="mb-3 text-imetro-gold" />
          <p className="text-[12px] leading-5 text-white/78">{env.institutionName}</p>
          <p className="mt-3 text-xs font-bold text-white">v{appInfo.version} · {appInfo.environmentLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] lg:block">
        <Content />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
          <aside className="relative h-full w-[280px] max-w-[86vw]">
            <Content onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
