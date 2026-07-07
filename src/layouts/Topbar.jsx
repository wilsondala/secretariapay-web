import { Bell, FileText, Menu, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../shared/auth/useAuth.js';
import { env } from '../config/env.js';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/82 shadow-[0_10px_30px_rgba(15,23,42,.045)] backdrop-blur-2xl">
      <div className="mx-auto flex min-h-[78px] max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
        <button className="rounded-2xl p-2.5 text-imetro-navy transition hover:bg-slate-100 lg:hidden" onClick={onMenuClick} aria-label="Abrir menu">
          <Menu size={25} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-black text-[#10254a]">{env.dcrName}</p>
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:inline-flex">
              Produção monitorada
            </span>
          </div>
          <p className="mt-1 hidden truncate text-xs font-semibold text-slate-500 sm:block">
            Painel financeiro académico · guias, cobranças, comprovativos, recibos e WhatsApp
          </p>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <button className="inline-flex items-center gap-2 rounded-2xl bg-imetro-navy px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.18)] transition hover:-translate-y-0.5 hover:bg-imetro-navySoft" onClick={() => window.location.reload()}>
            <RefreshCw size={17} />
            Atualizar
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#10254a] shadow-[0_10px_28px_rgba(15,23,42,.04)] transition hover:-translate-y-0.5 hover:bg-slate-50" onClick={() => navigate('/reports')}>
            <FileText size={17} />
            Relatório
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(16,185,129,.22)] transition hover:-translate-y-0.5 hover:bg-emerald-600" onClick={() => navigate('/whatsapp')}>
            <Send size={17} />
            WhatsApp financeiro
          </button>
        </div>

        <button className="relative rounded-2xl p-2.5 text-imetro-navy transition hover:bg-slate-100" aria-label="Notificações">
          <Bell size={21} />
          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">3</span>
        </button>

        <div className="hidden min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-right shadow-[0_10px_28px_rgba(15,23,42,.04)] sm:block">
          <p className="max-w-[180px] truncate text-sm font-black text-[#172c52]">{user?.email || 'admin@imetro.ao'}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500"><ShieldCheck size={12} /> {user?.role || 'ADMIN'}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#07142D] to-[#0B2A5B] text-sm font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.22)]">AD</div>
      </div>
    </header>
  );
}
