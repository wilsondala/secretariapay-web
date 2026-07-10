import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarX,
  CheckCircle2,
  FileCheck2,
  FileText,
  GraduationCap,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserRoundX,
  Users,
  WalletCards,
} from 'lucide-react';
import api from '../services/api.js';
import { loadDashboardSummary } from '../services/dashboardService.js';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { env } from '../config/env.js';
import { chargeIsOverdue, formatMoney, normalizeChargeStatus } from '../utils/formatters.js';

export default function DashboardPage() {
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthResult, summaryResult] = await Promise.allSettled([
        api.get('/actuator/health'),
        loadDashboardSummary(),
      ]);
      setHealth(healthResult.status === 'fulfilled' ? healthResult.value.data : { status: 'OFFLINE' });
      if (summaryResult.status === 'rejected') throw summaryResult.reason;
      setSummary(summaryResult.value);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const monthlyData = useMemo(() => buildMonthlyEvolution(summary?.charges || []), [summary]);
  const recentActivities = useMemo(() => buildRecentActivities(summary?.charges || []), [summary]);

  if (loading) return <LoadingState message="Carregando painel institucional IMETRO/DCR..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const online = health?.status === 'UP';
  const pendingProofs = Number(summary?.pendingProofs || 0);
  const onTimeAmount = Math.max(Number(summary?.openAmount || 0) - Number(summary?.overdueAmount || 0), 0);
  const openAmount = Number(summary?.openAmount || 0);
  const overduePercent = openAmount > 0 ? Math.round((Number(summary?.overdueAmount || 0) / openAmount) * 100) : 0;
  const onTimePercent = Math.max(0, 100 - overduePercent);
  const automationScore = Math.max(62, Math.min(98, 100 - Math.round((Number(summary?.overdueCharges || 0) / Math.max(Number(summary?.chargesTotal || 1), 1)) * 100)));

  return (
    <div className="space-y-6">
      <section className="premium-hero">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-[#F2B300]/20 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1.35fr_.65fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-pill">Painel institucional · DCR</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-emerald-100">
                {online ? 'API online' : 'API offline'}
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Secretária<span className="text-[#F2B300]">Pay</span> Académico
            </h1>
            <p className="mt-4 max-w-4xl text-sm font-medium leading-7 text-white/82 sm:text-base">
              Centro executivo para controlo de propinas, guias de pagamento, comprovativos, recibos e automação financeira via WhatsApp do {env.institutionName}.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroBadge icon={MessageCircle} title="WhatsApp financeiro" text="Guias, simulações e recibos" />
              <HeroBadge icon={FileCheck2} title="Validação DCR" text="Comprovativos organizados" />
              <HeroBadge icon={ShieldCheck} title="Controlo académico" text="Atrasos e regularização" />
            </div>
          </div>

          <div className="rounded-[22px] border border-white/16 bg-white/10 p-5 backdrop-blur-xl dark:bg-white/[.06]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-white/60">Saúde operacional</p>
                <p className="mt-3 text-4xl font-extrabold text-white">{automationScore}%</p>
                <p className="mt-2 text-sm font-semibold text-white/72">Índice demonstrativo de automação financeira</p>
              </div>
              <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-400/14 text-emerald-100">
                <TrendingUp size={26} />
              </span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/12">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-[#F2B300]" style={{ width: `${automationScore}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Estudantes" value={summary.studentsTotal} description="Base académica cadastrada" icon={GraduationCap} tone="blue" helper="Cadastro" />
        <MetricCard title="Cobranças pendentes" value={summary.pendingCharges} description="Aguardando pagamento" icon={FileText} tone="amber" helper="DCR" />
        <MetricCard title="Mensalidades vencidas" value={summary.overdueCharges} description="Exigem atenção imediata" icon={CalendarX} tone="red" helper="Atrasos" />
        <MetricCard title="Total em aberto" value={formatMoney(summary.openAmount)} description="Valor pendente no sistema" icon={WalletCards} tone="emerald" helper="Financeiro" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_.9fr]">
        <PanelCard title="Esteira financeira da DCR" subtitle="Onde cada funcionalidade atua dentro da operação diária." action={<RefreshButton onClick={load} />}>
          <div className="grid gap-3 lg:grid-cols-5">
            <FlowStep number="1" icon={Users} title="Estudante" description="Cadastro, curso, turma e contacto oficial." tone="blue" />
            <FlowStep number="2" icon={FileText} title="Guia" description="Propina, multa, mês e forma de pagamento." tone="indigo" />
            <FlowStep number="3" icon={MessageCircle} title="WhatsApp" description="Envio de guia, lembrete e simulação demo." tone="emerald" />
            <FlowStep number="4" icon={FileCheck2} title="DCR" description="Comprovativos e aprovação operacional." tone="amber" />
            <FlowStep number="5" icon={ReceiptText} title="Recibo" description="Documento emitido e enviado ao aluno." tone="violet" />
          </div>
        </PanelCard>

        <PanelCard title="Prioridades financeiras" subtitle="Alertas que merecem decisão da direção/DCR.">
          <div className="space-y-3">
            <AlertRow icon={UserRoundX} title="Alunos sem contacto" description="Sem telefone ou WhatsApp registado" value={summary.noContactStudents} />
            <AlertRow icon={CalendarX} title="Mensalidades vencidas" description="Propinas fora do prazo" value={summary.overdueCharges} />
            <AlertRow icon={Banknote} title="Valor vencido" description="Montante com atraso" value={formatMoney(summary.overdueAmount)} wide />
            <AlertRow icon={ReceiptText} title="Comprovativos pendentes" description="Aguardando análise DCR" value={pendingProofs} />
          </div>
        </PanelCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.82fr_1fr_1.05fr]">
        <PanelCard title="Resumo financeiro" subtitle="Relação entre cobrança em dia e vencida.">
          <div className="mt-2 flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <DonutChart onTimePercent={onTimePercent} total={summary.openAmount} />
            <div className="w-full space-y-4 text-sm">
              <Legend color="bg-emerald-500" title="Valores em dia" value={`${formatMoney(onTimeAmount)} (${onTimePercent}%)`} />
              <Legend color="bg-red-500" title="Valores vencidos" value={`${formatMoney(summary.overdueAmount)} (${overduePercent}%)`} />
              <Legend color="bg-[#005AA7]" title="Total em aberto" value={formatMoney(summary.openAmount)} />
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Evolução das cobranças" subtitle="Volume financeiro por mês de referência.">
          <LineChart data={monthlyData} />
        </PanelCard>

        <PanelCard title="Atividades recentes" subtitle="Últimos movimentos relevantes no painel.">
          <div className="mt-5 space-y-4">
            {recentActivities.map((activity) => (
              <RecentActivity key={activity.id} {...activity} />
            ))}
          </div>
        </PanelCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <FeatureCard icon={MessageCircle} title="Robô financeiro WhatsApp" description="Atendimento demonstrativo com guia PDF, simulação de pagamento, recibo PDF e encerramento cordial." />
        <FeatureCard icon={FileCheck2} title="Comprovativos e DCR" description="Organização do fluxo manual para depósito, balcão, TPA e transferência de outro banco." />
        <FeatureCard icon={ReceiptText} title="Recibos institucionais" description="Base preparada para emitir, reenviar e validar documentos financeiros do aluno." />
      </section>
    </div>
  );
}

function HeroBadge({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[18px] border border-white/12 bg-white/[.08] p-4 backdrop-blur-xl transition hover:bg-white/[.12]">
      <Icon size={20} className="text-[#F2B300]" />
      <p className="mt-3 text-sm font-extrabold text-white">{title}</p>
      <p className="mt-1 text-xs font-semibold text-white/62">{text}</p>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, tone, helper }) {
  const tones = {
    blue: {
      accent: 'bg-blue-500 text-white ring-blue-200/70 dark:bg-sky-500 dark:ring-sky-400/20',
      pill: 'bg-blue-50 text-blue-700 dark:bg-sky-500/12 dark:text-sky-200',
      border: 'hover:border-blue-300 dark:hover:border-sky-400/40',
      glow: 'bg-blue-400/20 dark:bg-sky-400/10',
    },
    amber: {
      accent: 'bg-amber-500 text-white ring-amber-200/70 dark:bg-amber-400 dark:text-[#082B4B] dark:ring-amber-300/20',
      pill: 'bg-amber-50 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
      border: 'hover:border-amber-300 dark:hover:border-amber-300/40',
      glow: 'bg-amber-300/24 dark:bg-amber-300/10',
    },
    red: {
      accent: 'bg-red-500 text-white ring-red-200/70 dark:bg-red-500 dark:ring-red-300/20',
      pill: 'bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-200',
      border: 'hover:border-red-300 dark:hover:border-red-300/40',
      glow: 'bg-red-300/20 dark:bg-red-400/10',
    },
    emerald: {
      accent: 'bg-emerald-500 text-white ring-emerald-200/70 dark:bg-emerald-400 dark:text-[#082B4B] dark:ring-emerald-300/20',
      pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-300/40',
      glow: 'bg-emerald-300/20 dark:bg-emerald-300/10',
    },
  };
  const current = tones[tone] || tones.blue;

  return (
    <div className={`group relative overflow-hidden rounded-[20px] border border-[#E6F0FB] bg-white p-5 shadow-[0_18px_55px_rgba(8,43,75,.07)] transition duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-[#082B4B]/78 dark:shadow-none ${current.border}`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${current.glow}`} />
      <div className="relative flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${current.pill}`}>{helper}</span>
          <p className="mt-4 text-[13px] font-extrabold uppercase tracking-wide text-[#082B4B] dark:text-white/82">{title}</p>
          <p className="mt-3 truncate text-[2rem] font-extrabold leading-none tracking-[-.04em] text-[#082B4B] dark:text-white">{value}</p>
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg ring-1 dark:shadow-none ${current.accent}`}>
          <Icon size={27} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

function PanelCard({ title, subtitle, action, children }) {
  return (
    <div className="rounded-[20px] border border-[#E6F0FB] bg-white p-5 shadow-[0_18px_55px_rgba(8,43,75,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#082B4B]/78 dark:shadow-none">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#082B4B] dark:text-white">{title}</h2>
          {subtitle && <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function RefreshButton({ onClick }) {
  return (
    <button className="inline-flex h-10 w-fit items-center gap-2 rounded-[14px] border border-[#D8E6F3] bg-white px-3.5 text-sm font-bold text-[#082B4B] shadow-sm transition hover:bg-[#F8FAFC] dark:border-white/12 dark:bg-[#061F36]/70 dark:text-white dark:shadow-none dark:hover:bg-white/10" onClick={onClick}>
      <RefreshCw size={16} />
      Atualizar
    </button>
  );
}

function FlowStep({ number, icon: Icon, title, description, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-sky-500/12 dark:text-sky-200 dark:ring-sky-400/20',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-500/12 dark:text-indigo-200 dark:ring-indigo-400/20',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-400/12 dark:text-emerald-200 dark:ring-emerald-300/20',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-300/20',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-400/12 dark:text-violet-200 dark:ring-violet-300/20',
  };
  return (
    <div className="relative rounded-[18px] border border-[#E6F0FB] bg-gradient-to-b from-white to-[#F8FAFC] p-4 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:from-[#061F36]/80 dark:to-[#082B4B]/70 dark:shadow-none">
      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#082B4B] text-[11px] font-extrabold text-white dark:bg-white/12">{number}</span>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${tones[tone] || tones.blue}`}>
        <Icon size={23} strokeWidth={2.2} />
      </div>
      <p className="mt-5 text-sm font-extrabold leading-5 text-[#082B4B] dark:text-white">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{description}</p>
    </div>
  );
}

function AlertRow({ icon: Icon, title, description, value, wide }) {
  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-red-100 bg-gradient-to-r from-red-50 to-white px-4 py-3 dark:border-red-400/18 dark:from-red-500/12 dark:to-[#061F36]/70">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm dark:bg-red-500/14 dark:text-red-200 dark:shadow-none">
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-[#082B4B] dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-4 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      <p className={`shrink-0 text-right font-extrabold text-red-600 dark:text-red-200 ${wide ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}

function DonutChart({ onTimePercent, total }) {
  const safeOnTime = Math.max(0, Math.min(100, onTimePercent));
  return (
    <div className="relative h-48 w-48 shrink-0 rounded-full shadow-[0_18px_45px_rgba(8,43,75,.10)] dark:shadow-none" style={{ background: `conic-gradient(#22c55e 0 ${safeOnTime}%, #ef4444 ${safeOnTime}% 100%)` }}>
      <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner dark:bg-[#061F36] dark:shadow-none">
        <p className="text-base font-extrabold text-[#082B4B] dark:text-white">{formatMoney(total)}</p>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">Total em aberto</p>
      </div>
    </div>
  );
}

function Legend({ color, title, value }) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-[#E6F0FB] bg-[#F8FAFC] p-3 dark:border-white/10 dark:bg-[#061F36]/65">
      <span className={`mt-1 h-4 w-4 shrink-0 rounded ${color}`} />
      <div>
        <p className="font-extrabold text-[#082B4B] dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{value}</p>
      </div>
    </div>
  );
}

function LineChart({ data }) {
  const width = 620;
  const height = 260;
  const padding = { left: 50, right: 28, top: 26, bottom: 38 };
  const maxValue = Math.max(...data.map((item) => item.value), 100000);
  const points = data.map((item, index) => {
    const x = padding.left + (index * (width - padding.left - padding.right)) / Math.max(data.length - 1, 1);
    const y = height - padding.bottom - (item.value / maxValue) * (height - padding.top - padding.bottom);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  return (
    <div className="mt-4 overflow-hidden rounded-xl text-[#005AA7] dark:text-sky-300">
      <svg className="h-[275px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução das cobranças">
        <defs>
          <linearGradient id="chargesAreaPremium" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * (height - padding.top - padding.bottom);
          const label = `${Math.round(((1 - ratio) * maxValue) / 1000)}K`;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="12" fontWeight="800" fill="currentColor" opacity="0.82">{label}</text>
            </g>
          );
        })}
        <path d={area} fill="url(#chargesAreaPremium)" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="currentColor" strokeWidth="4" />
            <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="12" fontWeight="900" fill="currentColor">{formatCompact(point.value)}</text>
            <text x={point.x} y={height - 12} textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor" opacity="0.78">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RecentActivity({ icon: Icon, title, description, time, tone }) {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-start gap-3 rounded-[16px] border border-[#E6F0FB] bg-[#F8FAFC] p-3 dark:border-white/10 dark:bg-[#061F36]/65">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.bg} ${tone.text}`}>
        <Icon size={21} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#082B4B] dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      <p className="whitespace-pre-line text-right text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{time}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[20px] border border-[#E6F0FB] bg-white p-5 shadow-[0_18px_55px_rgba(8,43,75,.06)] dark:border-white/10 dark:bg-[#082B4B]/78 dark:shadow-none">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#082B4B] text-[#F2B300] dark:bg-white/10 dark:text-[#F2B300]">
        <Icon size={23} />
      </div>
      <p className="mt-5 text-base font-extrabold text-[#082B4B] dark:text-white">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{description}</p>
    </div>
  );
}

function buildMonthlyEvolution(charges) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: monthLabel(date), value: 0 };
  });

  charges.forEach((charge) => {
    const rawMonth = charge.referenceMonth || charge.reference_month || charge.dueDate || charge.due_date;
    const key = extractMonthKey(rawMonth);
    const target = months.find((item) => item.key === key);
    if (target) target.value += Number(charge.totalAmount || charge.total_amount || charge.amount || 0);
  });

  const hasData = months.some((item) => item.value > 0);
  if (hasData) return months;

  return [
    { label: 'Jan', value: 0 },
    { label: 'Fev', value: 0 },
    { label: 'Mar', value: 0 },
    { label: 'Abr', value: 0 },
    { label: 'Mai', value: 0 },
    { label: 'Jun', value: 0 },
  ];
}

function buildRecentActivities(charges) {
  const fallback = [
    { id: 'health', icon: CheckCircle2, title: 'API operacional', description: 'Serviço financeiro disponível em produção', time: 'Online', tone: { bg: 'bg-emerald-50 dark:bg-emerald-400/12', text: 'text-emerald-600 dark:text-emerald-200' } },
  ];

  if (!charges.length) return fallback;

  const fromCharges = charges.slice(0, 4).map((charge, index) => {
    const overdue = chargeIsOverdue(charge);
    const status = normalizeChargeStatus(charge.status);
    return {
      id: charge.id || `${charge.chargeCode}-${index}`,
      icon: overdue ? AlertTriangle : FileText,
      title: overdue ? 'Cobrança vencida identificada' : `Cobrança ${status.toLowerCase()}`,
      description: `${charge.studentName || 'Estudante'} · ${charge.description || charge.chargeCode || 'Propina mensal'}`,
      time: index === 0 ? 'Hoje\nAgora' : 'Recente',
      tone: overdue ? { bg: 'bg-red-50 dark:bg-red-500/12', text: 'text-red-500 dark:text-red-200' } : { bg: 'bg-blue-50 dark:bg-sky-500/12', text: 'text-blue-600 dark:text-sky-200' },
    };
  });

  return [...fromCharges, ...fallback].slice(0, 4);
}

function extractMonthKey(value) {
  if (!value) return '';
  const text = String(value);
  const match = text.match(/(\d{4})[-_/](\d{1,2})/);
  if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('pt-AO', { month: 'short' }).format(date).replace('.', '').replace(/^./, (letter) => letter.toUpperCase());
}

function formatCompact(value) {
  const numeric = Number(value || 0);
  if (numeric >= 1000) return `${Math.round(numeric / 1000)}K`;
  return String(numeric);
}
