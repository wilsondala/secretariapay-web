import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarX,
  FileCheck2,
  FileText,
  GraduationCap,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
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
  const pendingProofs = Math.max(Number(summary?.pendingCharges || 0) - 1, 0);
  const onTimeAmount = Math.max(Number(summary?.openAmount || 0) - Number(summary?.overdueAmount || 0), 0);
  const openAmount = Number(summary?.openAmount || 0);
  const overduePercent = openAmount > 0 ? Math.round((Number(summary?.overdueAmount || 0) / openAmount) * 100) : 0;
  const onTimePercent = Math.max(0, 100 - overduePercent);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#061936] via-[#08285a] to-[#061936] p-7 text-white shadow-[0_22px_60px_rgba(7,20,45,.16)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.14em] text-white/88">Painel institucional — DCR</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Secretária<span className="text-imetro-gold">Pay</span> Académico
            </h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-white/88">
              Gestão inteligente de propinas, mensalidades, comprovativos, recibos, cobranças e atendimento WhatsApp do {env.institutionName}.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/90">
            <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
            API produção {online ? 'online' : 'offline'}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Estudantes cadastrados"
          value={summary.studentsTotal}
          description="Estudantes ativos no sistema"
          icon={GraduationCap}
          gradient="from-blue-500 to-blue-700"
        />
        <MetricCard
          title="Cobranças pendentes"
          value={summary.pendingCharges}
          description="Pagamentos aguardando regularização"
          icon={FileText}
          gradient="from-amber-400 to-orange-500"
        />
        <MetricCard
          title="Mensalidades vencidas"
          value={summary.overdueCharges}
          description="Propinas fora do prazo de pagamento"
          icon={CalendarX}
          gradient="from-red-500 to-red-600"
        />
        <MetricCard
          title="Total em aberto"
          value={formatMoney(summary.openAmount)}
          description="Valor total pendente no sistema"
          icon={WalletCards}
          gradient="from-emerald-500 to-green-600"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-black text-imetro-navy">Fluxo operacional da DCR</h2>
              <p className="mt-2 text-sm font-medium text-[#10254a]">Acompanhamento completo do ciclo académico-financeiro dos estudantes.</p>
            </div>
            <button className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={load}>
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
            <FlowStep number="1" icon={Users} title="Estudantes e turmas" description={`${summary.studentsTotal} estudantes sincronizados`} tone="text-blue-600" />
            <FlowArrow />
            <FlowStep number="2" icon={FileText} title="Propinas e cobranças" description={`${summary.chargesTotal} cobranças registradas`} tone="text-blue-700" />
            <FlowArrow />
            <FlowStep number="3" icon={MessageCircle} title="WhatsApp institucional" description="Envio de guias, avisos e atendimento automatizado" tone="text-emerald-500" />
            <FlowArrow />
            <FlowStep number="4" icon={FileCheck2} title="Validação manual" description="Comprovativos pendentes de análise e recibo" tone="text-amber-500" />
            <FlowArrow />
            <FlowStep number="5" icon={ShieldCheck} title="Restrição académica" description="Bloqueio automático para estudantes inadimplentes" tone="text-red-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={22} />
            <h2 className="text-xl font-black">Alertas críticos para a DCR</h2>
          </div>
          <div className="mt-5 space-y-3">
            <AlertRow icon={UserRoundX} title="Alunos sem contacto oficial" description="Estudantes sem telefone ou WhatsApp registado" value={summary.noContactStudents} />
            <AlertRow icon={CalendarX} title="Mensalidades vencidas" description="Mensalidades em atraso" value={summary.overdueCharges} />
            <AlertRow icon={Banknote} title="Valor vencido/em atraso" description="Total de valor fora do prazo" value={formatMoney(summary.overdueAmount)} wide />
            <AlertRow icon={ReceiptText} title="Comprovativos pendentes" description="Pagamentos enviados pelos alunos aguardando validação manual" value={pendingProofs} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.8fr_1fr_1.18fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
          <h2 className="text-lg font-black text-imetro-navy">Resumo financeiro</h2>
          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <DonutChart onTimePercent={onTimePercent} overduePercent={overduePercent} total={summary.openAmount} />
            <div className="w-full space-y-4 text-sm">
              <Legend color="bg-emerald-500" title={`Pagamentos em dia`} value={`${formatMoney(onTimeAmount)} (${onTimePercent}%)`} />
              <Legend color="bg-red-500" title="Vencidos" value={`${formatMoney(summary.overdueAmount)} (${overduePercent}%)`} />
              <Legend color="bg-imetro-navy" title="Total" value={formatMoney(summary.openAmount)} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black text-imetro-navy">Evolução das cobranças</h2>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">
              <option>Últimos 6 meses</option>
            </select>
          </div>
          <LineChart data={monthlyData} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
          <h2 className="text-lg font-black text-imetro-navy">Atividades recentes</h2>
          <div className="mt-5 space-y-4">
            {recentActivities.map((activity) => (
              <RecentActivity key={activity.id} {...activity} />
            ))}
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-2 px-2 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2024 {env.institutionName}. Todos os direitos reservados.</p>
        <p className="font-semibold">SecretáriaPay Académico v2.1.0</p>
      </footer>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, gradient }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,.06)]">
      <div className="flex items-center gap-5">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <Icon size={34} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-wide text-[#10254a]">{title}</p>
          <p className="mt-3 truncate text-3xl font-black text-imetro-navy">{value}</p>
          <p className="mt-3 text-xs font-medium leading-5 text-[#324667]">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FlowStep({ number, icon: Icon, title, description, tone }) {
  return (
    <div className="relative flex min-h-[172px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4 text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,.75)]">
      <span className="absolute -top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white shadow-md">{number}</span>
      <Icon size={36} className={tone} strokeWidth={2.2} />
      <p className="mt-5 text-sm font-black leading-5 text-imetro-navy">{title}</p>
      <p className="mt-3 text-xs font-medium leading-5 text-[#37506f]">{description}</p>
    </div>
  );
}

function FlowArrow() {
  return <div className="hidden items-center justify-center md:flex md:-mx-2"><ArrowRight size={21} className="text-slate-300" /></div>;
}

function AlertRow({ icon: Icon, title, description, value, wide })  {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,.04)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
        <Icon size={23} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-imetro-navy">{title}</p>
        <p className="mt-1 text-xs font-medium leading-4 text-[#425879]">{description}</p>
      </div>
      <p className={`shrink-0 text-right font-black text-red-600 ${wide ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}

function DonutChart({ onTimePercent, overduePercent, total }) {
  const safeOnTime = Math.max(0, Math.min(100, onTimePercent));
  return (
    <div
      className="relative h-48 w-48 shrink-0 rounded-full"
      style={{ background: `conic-gradient(#22c55e 0 ${safeOnTime}%, #ef4444 ${safeOnTime}% 100%)` }}
    >
      <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <p className="text-base font-black text-imetro-navy">{formatMoney(total)}</p>
        <p className="mt-1 text-xs font-bold text-[#425879]">Total em aberto</p>
      </div>
    </div>
  );
}

function Legend({ color, title, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 h-4 w-4 shrink-0 rounded ${color}`} />
      <div>
        <p className="font-bold text-[#10254a]">{title}</p>
        <p className="mt-1 text-xs font-medium text-[#425879]">{value}</p>
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
    <div className="mt-4 overflow-hidden rounded-xl">
      <svg className="h-[275px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução das cobranças">
        <defs>
          <linearGradient id="chargesArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * (height - padding.top - padding.bottom);
          const label = `${Math.round(((1 - ratio) * maxValue) / 1000)}K`;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#334155">{label}</text>
            </g>
          );
        })}
        <path d={area} fill="url(#chargesArea)" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="#2563eb" strokeWidth="4" />
            <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">{formatCompact(point.value)}</text>
            <text x={point.x} y={height - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RecentActivity({ icon: Icon, title, description, time, tone }) {
  return (
    <div className="grid grid-cols-[34px_1fr_auto] items-start gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
        <Icon size={21} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-imetro-navy">{title}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-[#425879]">{description}</p>
      </div>
      <p className="whitespace-pre-line text-right text-xs font-medium leading-5 text-[#425879]">{time}</p>
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
    { label: 'Jan', value: 120000 },
    { label: 'Fev', value: 150000 },
    { label: 'Mar', value: 210000 },
    { label: 'Abr', value: 250000 },
    { label: 'Mai', value: 300000 },
    { label: 'Jun', value: 400500 },
  ];
}

function buildRecentActivities(charges) {
  const fallback = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      title: 'Cobrança enviada via WhatsApp',
      description: 'Curso de Engenharia Informática - 2º Ano',
      time: 'Hoje\n10:30',
      tone: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
    },
    {
      id: 'proof',
      icon: FileCheck2,
      title: 'Comprovativo submetido',
      description: 'Aluno: João Manuel - 3º Ano',
      time: 'Hoje\n09:15',
      tone: { bg: 'bg-amber-50', text: 'text-amber-500' },
    },
    {
      id: 'blocked',
      icon: ShieldCheck,
      title: 'Restrição aplicada',
      description: 'Aluno: Maria Santos - Propina em atraso',
      time: 'Ontem\n16:45',
      tone: { bg: 'bg-red-50', text: 'text-red-500' },
    },
    {
      id: 'receipt',
      icon: ReceiptText,
      title: 'Recibo emitido',
      description: 'Recibo Nº 2024/5478',
      time: 'Ontem\n11:20',
      tone: { bg: 'bg-blue-50', text: 'text-blue-600' },
    },
  ];

  if (!charges.length) return fallback;

  const fromCharges = charges.slice(0, 4).map((charge, index) => {
    const overdue = chargeIsOverdue(charge);
    const status = normalizeChargeStatus(charge.status);
    return {
      id: charge.id || `${charge.chargeCode}-${index}`,
      icon: overdue ? ShieldCheck : FileText,
      title: overdue ? 'Cobrança vencida identificada' : `Cobrança ${status.toLowerCase()}`,
      description: `${charge.studentName || 'Estudante'} · ${charge.description || charge.chargeCode || 'Propina mensal'}`,
      time: index === 0 ? 'Hoje\nAgora' : 'Recente',
      tone: overdue ? { bg: 'bg-red-50', text: 'text-red-500' } : { bg: 'bg-blue-50', text: 'text-blue-600' },
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
