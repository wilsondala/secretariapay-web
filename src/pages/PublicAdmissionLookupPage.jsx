import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import PublicAdmissionLookup from '../components/public/PublicAdmissionLookup.jsx';
import { env } from '../config/env.js';

const whatsappNumber = import.meta.env.VITE_SECRETARIA_WHATSAPP || '244991640259';
const whatsappDisplay = '+244 991 640 259';
const whatsappText = encodeURIComponent('Olá, IMETRO. Preciso de apoio para consultar a minha candidatura 2026/2027.');
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

export default function PublicAdmissionLookupPage() {
  useEffect(() => {
    document.title = `Consultar candidatura 2026/2027 — ${env.institutionShortName}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#E9F0F8] text-[#071A35]">
      <header className="relative overflow-hidden bg-[#061936] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,148,221,.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(244,180,0,.18),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-6 sm:px-7 lg:px-8">
          <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/inscricoes" className="inline-flex items-center gap-3 text-white" aria-label={`${env.institutionShortName} — inscrições`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1194DD] font-black shadow-lg">SP</span>
              <span>
                <strong className="block text-base font-black">{env.institutionShortName}</strong>
                <small className="block max-w-sm text-xs font-semibold text-white/65">{env.institutionName}</small>
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/inscricoes" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/10">
                <ArrowLeft size={17} /> Voltar às inscrições
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="public-whatsapp-cta inline-flex min-h-12 items-center gap-3 rounded-xl bg-emerald-500 px-4 py-2 text-white shadow-lg transition hover:bg-emerald-600"
                aria-label={`Falar com Admissões pelo WhatsApp ${whatsappDisplay}`}
              >
                <MessageCircle size={20} />
                <span className="text-left leading-tight">
                  <strong className="block text-sm font-extrabold">WhatsApp oficial</strong>
                  <small className="block text-[11px] font-bold text-white/85">{whatsappDisplay}</small>
                </span>
              </a>
            </div>
          </nav>

          <div className="mt-10 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#F4B400]">{env.institutionShortName} · 2026/2027</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">Consulte a sua candidatura</h1>
            <p className="mt-4 text-sm font-medium leading-7 text-white/75 sm:text-base">
              Informe o código da candidatura e o número do documento utilizado na inscrição.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-8 lg:py-12">
        <PublicAdmissionLookup />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-sm font-semibold text-slate-500 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>{env.institutionName} ({env.institutionShortName})</p>
          <p>SecretáriaPay Académico · TRIA Company</p>
        </div>
      </footer>
    </div>
  );
}
