import { Bell, FileText, Menu, RefreshCw, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../shared/auth/useAuth.js';
import { env } from '../config/env.js';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="flex min-h-[70px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="rounded-xl p-2 text-imetro-navy hover:bg-slate-100" onClick={onMenuClick} aria-label="Abrir menu">
          <Menu size={25} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#1c355e]">{env.dcrName}</p>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <button className="inline-flex items-center gap-2 rounded-lg bg-imetro-navy px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(7,20,45,.18)] transition hover:bg-imetro-navySoft" onClick={() => window.location.reload()}>
            <RefreshCw size={17} />
            Atualizar dados
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#10254a] transition hover:bg-slate-50" onClick={() => navigate('/reports')}>
            <FileText size={17} />
            Gerar relatório
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,185,129,.22)] transition hover:bg-emerald-600" onClick={() => navigate('/whatsapp')}>
            <Send size={17} />
            Enviar cobranças WhatsApp
          </button>
        </div>

        <button className="relative rounded-xl p-2.5 text-imetro-navy hover:bg-slate-100" aria-label="Notificações">
          <Bell size={21} />
          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">3</span>
        </button>

        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-[160px] truncate text-sm font-bold text-[#172c52]">{user?.email || 'admin@imetro.ao'}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{user?.role || 'ADMIN'}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-imetro-navy text-sm font-black text-white shadow-soft">AD</div>
      </div>
    </header>
  );
}
