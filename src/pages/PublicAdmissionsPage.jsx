import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Loader2,
  MessageCircle,
  School,
  ShieldCheck,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { env } from '../config/env.js';
import { getOfficialAdmissionsCatalog } from '../services/admissionsService.js';
import PublicAdmissionForm from '../components/public/PublicAdmissionForm.jsx';

const whatsappNumber = import.meta.env.VITE_SECRETARIA_WHATSAPP || '244930123456';
const whatsappText = encodeURIComponent('Olá, IMETRO. Preciso de informações sobre as inscrições 2026/2027.');
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function money(value, currency = 'AOA') {
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  return `${formatted} ${currency === 'AOA' ? 'Kz' : currency}`;
}

function readError(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'Não foi possível carregar as informações oficiais de inscrição.';
}

function campaignState(catalog) {
  if (!catalog) return { tone: 'slate', label: 'A carregar', description: 'A consultar a campanha oficial.' };
  if (!catalog.publicFormEnabled) {
    return {
      tone: 'amber',
      label: 'Formulário em validação',
      description: 'A inscrição pública ainda não foi ativada pela instituição.',
    };
  }
  if (catalog.registrationOpen) {
    return {
      tone: 'green',
      label: 'Inscrições abertas',
      description: 'A campanha oficial está disponível para novos candidatos.',
    };
  }
  const today = new Date();
  const start = new Date(`${catalog.registrationStart}T00:00:00`);
  if (today < start) {
    return {
      tone: 'blue',
      label: 'Abertura programada',
      description: `As inscrições começam em ${formatDate(catalog.registrationStart)}.`,
    };
  }
  return {
    tone: 'slate',
    label: 'Período encerrado',
    description: `A campanha terminou em ${formatDate(catalog.registrationEnd)}.`,
  };
}

const STATE_STYLES = {
  green: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
  blue: 'border-blue-300/30 bg-blue-500/10 text-blue-100',
  amber: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
  slate: 'border-white/15 bg-white/5 text-white/80',
};

export default function PublicAdmissionsPage() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setCatalog(await getOfficialAdmissionsCatalog(env.institutionId));
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const courses = useMemo(
    () => (catalog?.departments || []).flatMap((department) =>
      department.courses.map((course) => ({
        ...course,
        departmentCode: department.departmentCode,
      }))),
    [catalog],
  );

  const state = campaignState(catalog);
  const canStart = Boolean(catalog?.registrationOpen && catalog?.publicFormEnabled);
  const localPreviewEnabled = import.meta.env.DEV && Boolean(catalog);

  function openForm() {
    setShowForm(true);
    window.setTimeout(() => {
      document.getElementById('ficha-inscricao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#071A35]">
      <header className="relative overflow-hidden bg-[#061936] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,148,221,.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(244,180,0,.18),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-7 lg:px-8 lg:pb-20">
          <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="inline-flex items-center gap-3 text-white" aria-label="SecretariaPay Académico — página inicial">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1194DD] font-black shadow-lg">SP</span>
              <span>
                <strong className="block text-base font-black">SecretáriaPay Académico</strong>
                <small className="text-xs font-semibold text-white/65">{env.institutionShortName} · Admissões 2026/2027</small>
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/10">
                <ArrowLeft size={17} /> Página inicial
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-600">
                <MessageCircle size={18} /> Falar com Admissões
              </a>
            </div>
          </nav>

          <section className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.13em] text-white/85">
                <GraduationCap size={16} className="text-[#F4B400]" /> Campanha oficial IMETRO
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl lg:text-6xl">
                Inscrições <span className="text-[#F4B400]">2026/2027</span>
              </h1>
              <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-white/75 sm:text-lg">
                Consulte os cursos e turnos da campanha oficial. O preenchimento da ficha e as etapas financeiras serão ativados progressivamente após validação institucional.
              </p>
            </div>

            <div className={`rounded-[2rem] border p-5 shadow-2xl backdrop-blur ${STATE_STYLES[state.tone]}`}>
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : canStart ? <CheckCircle2 size={24} /> : <Clock3 size={24} />}
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.13em] text-current/70">Estado da campanha</p>
                  <h2 className="mt-1 text-xl font-black">{state.label}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-current/75">{state.description}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-7 lg:px-8 lg:py-12">
        {error ? (
          <section className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3"><XCircle className="mt-0.5 shrink-0" size={20} /><div><p className="font-black">Falha ao carregar a campanha</p><p className="mt-1 text-sm font-semibold">{error}</p></div></div>
            <button type="button" onClick={load} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-extrabold">Tentar novamente</button>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={CalendarDays} label="Ano académico" value={catalog?.academicYear || '-'} helper={catalog ? `${formatDate(catalog.registrationStart)} a ${formatDate(catalog.registrationEnd)}` : 'A carregar'} />
          <SummaryCard icon={WalletCards} label="Taxa de inscrição" value={catalog ? money(catalog.registrationFee, catalog.currency) : '-'} helper="Valor configurado na campanha" />
          <SummaryCard icon={School} label="Cursos disponíveis" value={loading ? '...' : String(courses.length)} helper="Catálogo oficial ativo" />
          <SummaryCard icon={ShieldCheck} label="Validação" value="Institucional" helper="Ativação progressiva por etapas" />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(7,26,53,.08)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#1194DD]">Catálogo da campanha</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-3xl">Cursos e turnos disponíveis</h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">As opções abaixo são carregadas diretamente do catálogo oficial configurado para 2026/2027.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-extrabold text-slate-500"><Loader2 className="animate-spin" size={22} /> A carregar cursos e turnos...</div>
          ) : null}

          {!loading && courses.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => <CourseCard key={course.courseId} course={course} />)}
            </div>
          ) : null}

          {!loading && !error && courses.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">Nenhum curso foi disponibilizado para esta campanha.</div>
          ) : null}
        </section>

        <section className="grid gap-5 rounded-[2rem] bg-[#071A35] p-6 text-white shadow-[0_28px_80px_rgba(7,26,53,.18)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#F4B400]">Próxima etapa do piloto</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-3xl">Ficha pública de inscrição</h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/70">A ficha recolherá somente os dados necessários já suportados pelo processo oficial. Campos, documentos e regras ainda não aprovados continuarão identificados como provisórios.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button type="button" onClick={openForm} disabled={!canStart} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F4B400] px-6 py-3 text-sm font-black text-[#071A35] shadow-lg transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">
              {canStart ? 'Iniciar inscrição' : 'Aguardar abertura'} <ArrowRight size={18} />
            </button>
            {!canStart && localPreviewEnabled ? (
              <button type="button" onClick={openForm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-white/15">
                <ClipboardList size={17} /> Pré-visualizar ficha local
              </button>
            ) : null}
          </div>
        </section>

        {showForm && catalog ? (
          <PublicAdmissionForm
            catalog={catalog}
            courses={courses}
            canSubmit={canStart}
            onClose={() => setShowForm(false)}
          />
        ) : null}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm font-semibold text-slate-500 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>{env.institutionName} ({env.institutionShortName})</p>
          <p>SecretáriaPay Académico · TRIA Company</p>
        </div>
      </footer>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_50px_rgba(7,26,53,.06)]">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-[#071A35]">{value}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</p></div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1194DD]/10 text-[#1194DD]"><Icon size={21} /></span>
      </div>
    </article>
  );
}

function CourseCard({ course }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-[#F8FAFD] p-5 transition hover:-translate-y-0.5 hover:border-[#1194DD]/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#071A35] text-white"><GraduationCap size={21} /></span>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 shadow-sm">{course.courseCode}</span>
      </div>
      <h3 className="mt-4 text-base font-black leading-6 text-[#071A35]">{course.courseName}</h3>
      <p className="mt-1 text-xs font-semibold text-slate-400">Departamento {course.departmentCode || '-'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(course.shifts || []).map((shift) => (
          <span key={shift.code} className="rounded-full border border-[#1194DD]/20 bg-[#1194DD]/8 px-3 py-1.5 text-xs font-extrabold text-[#0874B4]">{shift.label}</span>
        ))}
      </div>
    </article>
  );
}
