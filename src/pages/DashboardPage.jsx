import { useEffect, useState } from 'react';
import { AlertTriangle, Banknote, FileCheck2, MessageCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import api from '../services/api.js';
import { loadDashboardSummary } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { env } from '../config/env.js';
import { formatMoney } from '../utils/formatters.js';

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

  if (loading) return <LoadingState message="Carregando painel IMETRO/DCR..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const online = health?.status === 'UP';

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-imetro-navy p-4 text-white shadow-soft lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.25em] text-imetro-gold">Painel IMETRO/DCR</p>
          <h1 className="mt-3 text-base font-black">{env.appName}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            Gestão de propinas, guias de pagamento, comprovativos, recibos e atendimento WhatsApp do {env.institutionName}.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <div>
              <p className="text-sm font-bold">API produção</p>
              <p className="text-xs text-white/65">{online ? 'Online e saudável' : 'Indisponível'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Estudantes" value={summary.studentsTotal} description="Cadastro académico" icon={Users} />
        <StatCard title="Cobranças pendentes" value={summary.pendingCharges} description="Aguardando pagamento" icon={Banknote} tone="gold" />
        <StatCard title="Mensalidades vencidas" value={summary.overdueCharges} description={formatMoney(summary.overdueAmount)} icon={AlertTriangle} tone="danger" />
        <StatCard title="Total em aberto" value={formatMoney(summary.openAmount)} description="Pendente + vencido" icon={RefreshCw} tone="warning" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-imetro-ink">Fluxo operacional da DCR</h2>
              <p className="mt-1 text-sm text-slate-500">Dados reais carregados dos endpoints de estudantes e cobranças.</p>
            </div>
            <button className="btn-secondary" onClick={load}>
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {[
              ['Estudantes e turmas', `${summary.studentsTotal} estudantes sincronizados`, Users],
              ['Propinas e cobranças', `${summary.chargesTotal} cobranças registradas`, Banknote],
              ['WhatsApp institucional', 'Envio de guias e atendimento', MessageCircle],
              ['Validação manual', 'Comprovativos antes do recibo', FileCheck2],
              ['Restrição académica', `${summary.blockedStudents} estudantes bloqueados`, ShieldCheck],
            ].map(([title, description, Icon]) => (
              <div key={title} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-imetro-navy shadow-sm">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-black text-imetro-ink">Alertas para a DCR</h2>
          <div className="mt-6 space-y-4">
            <Box title="Alunos sem contacto oficial" value={summary.noContactStudents} />
            <Box title="Mensalidades vencidas" value={summary.overdueCharges} />
            <Box title="Valor vencido/em atraso" value={formatMoney(summary.overdueAmount)} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Box({ title, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-base font-black text-slate-900">{value}</p>
    </div>
  );
}
