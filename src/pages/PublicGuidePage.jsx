import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileText, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import { env } from '../config/env.js';
import { formatMoney, formatDate } from '../utils/formatters.js';

export default function PublicGuidePage() {
  const { guideCode } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const safeCode = useMemo(() => encodeURIComponent(guideCode || ''), [guideCode]);
  const pdfUrl = `${env.apiBaseUrl}/api/v1/public/guides/${safeCode}/pdf`;

  useEffect(() => {
    let active = true;
    async function loadGuide() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/v1/public/guides/${safeCode}`);
        if (!response.ok) throw new Error('Guia não encontrada ou indisponível.');
        const data = await response.json();
        if (active) setGuide(data);
      } catch (err) {
        if (active) setError(err.message || 'Falha ao carregar guia.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadGuide();
    return () => {
      active = false;
    };
  }, [safeCode]);

  return (
    <div className="min-h-screen bg-slate-50 text-[#061936]">
      <header className="relative overflow-hidden bg-[#061936] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#061936] via-[#08285A] to-[#030b18]" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full border-[16px] border-emerald-500/50" />
        <div className="absolute -right-6 bottom-10 h-64 w-64 rounded-full border-[16px] border-imetro-gold/60" />
        <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/75 transition hover:text-white">
            <ArrowLeft size={18} />
            Voltar para o SecretáriaPay
          </Link>
          <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.35em] text-imetro-gold">Guia pública</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Guia de pagamento</h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-white/75">
                Documento público de consulta e download da guia emitida pelo SecretáriaPay Académico.
              </p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-white text-emerald-600 shadow-xl">
              <FileText size={46} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-7 lg:px-8">
        {loading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto animate-spin text-imetro-gold" size={42} />
            <p className="mt-4 text-base font-bold text-slate-600">Carregando guia...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto text-red-600" size={44} />
            <h2 className="mt-4 text-2xl font-black text-red-700">Guia indisponível</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">{error}</p>
          </div>
        )}

        {!loading && guide && (
          <div className="grid gap-5 lg:grid-cols-[1fr_.75fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.25em] text-slate-400">Código da guia</p>
                  <h2 className="mt-2 text-3xl font-black text-[#061936]">{guide.guideCode || guideCode}</h2>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                  <AlertTriangle size={16} />
                  Pendente DCR
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Info label="Estudante" value={guide.studentName} />
                <Info label="Número" value={guide.studentNumber} />
                <Info label="Valor" value={formatMoney(guide.amount, guide.currency || 'AOA')} />
                <Info label="Vencimento" value={formatDate(guide.dueDate)} />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h3 className="flex items-center gap-2 text-base font-black text-[#061936]">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  Orientação institucional
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                  {guide.message || 'Após o pagamento, envie o comprovativo pelo WhatsApp institucional ou apresente-o à DCR para validação.'}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#061936] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
                >
                  <Download size={18} />
                  Abrir PDF da guia
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#061936] transition hover:bg-slate-50"
                >
                  <FileText size={18} />
                  Baixar PDF
                </a>
              </div>
            </section>

            <aside className="rounded-[2rem] bg-[#061936] p-6 text-white shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-imetro-gold text-[#061936]">
                <GraduationCap size={34} />
              </div>
              <h3 className="mt-5 text-2xl font-black">SecretáriaPay Académico</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-white/75">
                Esta guia é uma referência de pagamento. O recibo institucional definitivo será emitido após validação da DCR.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <Rule text="Confira sempre o código da guia antes de pagar." />
                <Rule text="Envie o comprovativo após o pagamento." />
                <Rule text="A validação financeira é feita pela DCR." />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-base font-black text-[#061936]">{value || '-'}</p>
    </div>
  );
}

function Rule({ text }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/10 p-3">
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={18} />
      <p className="font-semibold leading-6 text-white/78">{text}</p>
    </div>
  );
}
