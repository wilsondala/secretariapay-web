import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Loader2,
  LockKeyhole,
  Mail,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import {
  generateMonthlyCharges,
  getOperationsReadiness,
  listAuditLogs,
  listNotificationLogs,
  listPaymentTransactions,
  runFinancialNotifications,
} from '../services/operationsService.js';
import { listAcademicServices } from '../services/academicServicesService.js';
import usePermissions from '../shared/auth/usePermissions.js';
import { formatMoney } from '../utils/formatters.js';

const monthLabels = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
  7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
};
const monthsFull = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11];
const monthsTrimester = [9, 10, 11];

export default function OperationsOfficialPage() {
  const { can } = usePermissions();
  const canGenerate = can('generateMonthlyCharges');
  const canNotify = can('runFinancialNotifications');
  const [readiness, setReadiness] = useState(null);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tuitionAmount, setTuitionAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generationResult, setGenerationResult] = useState(null);
  const [notificationResult, setNotificationResult] = useState(null);
  const [form, setForm] = useState({ year: new Date().getFullYear(), dueDay: 10, scope: 'trimester' });

  const selectedMonths = useMemo(
    () => (form.scope === 'full' ? monthsFull : monthsTrimester),
    [form.scope],
  );
  const monthPreview = selectedMonths.map((month) => `${monthLabels[month]}/${form.year}`).join(', ');
  const canGenerateNow = canGenerate && Number(tuitionAmount || 0) > 0;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [ready, logs, audits, payments, services] = await Promise.all([
        getOperationsReadiness().catch(() => null),
        listNotificationLogs().catch(() => []),
        listAuditLogs().catch(() => []),
        listPaymentTransactions().catch(() => []),
        listAcademicServices({ activeOnly: true }).catch(() => []),
      ]);
      const tuition = services.find((item) => String(item.code || item.serviceCode || '').toUpperCase() === 'TUITION');
      const amount = Number(tuition?.unitPrice ?? tuition?.unit_price ?? tuition?.price ?? 0);
      setReadiness(ready);
      setNotificationLogs(logs);
      setAuditLogs(audits);
      setTransactions(payments);
      setTuitionAmount(amount > 0 ? amount : null);
      if (!amount) setError('A propina oficial não foi encontrada no catálogo institucional. A geração foi bloqueada por segurança.');
    } catch (err) {
      setError(readError(err, 'Falha ao carregar as operações institucionais.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate(dryRun) {
    if (!canGenerateNow) return;
    if (!dryRun && !window.confirm(`Confirmar a geração real das propinas no valor de ${formatMoney(tuitionAmount)} por estudante?`)) return;
    setRunning(true);
    setError('');
    setSuccess('');
    setGenerationResult(null);
    try {
      const result = await generateMonthlyCharges({
        year: Number(form.year),
        monthlyAmount: Number(tuitionAmount),
        dueDay: Number(form.dueDay),
        months: selectedMonths,
        dryRun,
      });
      setGenerationResult(result);
      setSuccess(dryRun ? 'Simulação concluída. Nenhuma cobrança foi criada.' : 'Propinas geradas com o valor oficial do catálogo IMETRO.');
      await load();
    } catch (err) {
      setError(readError(err, 'Falha ao gerar propinas.'));
    } finally {
      setRunning(false);
    }
  }

  async function handleRunNotifications() {
    if (!canNotify) return;
    setRunning(true);
    setError('');
    setSuccess('');
    setNotificationResult(null);
    try {
      const result = await runFinancialNotifications();
      setNotificationResult(result);
      setSuccess('Execução concluída. Consulte o resumo e os registos de entrega.');
      await load();
    } catch (err) {
      setError(readError(err, 'Falha ao executar notificações.'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><ShieldCheck size={14} /> Operação financeira institucional</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[34px]">Central operacional da DCR</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85 sm:text-[15px]">
              Gere propinas exclusivamente com o valor ativo no catálogo IMETRO e acompanhe notificações, auditoria e conciliação.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={loading || running} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
            </button>
            {canNotify && (
              <button onClick={handleRunNotifications} disabled={running} className="btn-white">
                {running ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Rodar notificações
              </button>
            )}
          </div>
        </div>
      </section>

      {!canGenerate && !canNotify && <Notice tone="amber" icon={LockKeyhole} text="Perfil em modo de consulta. As ações financeiras estão protegidas." />}
      {error && <Notice tone="red" icon={AlertTriangle} text={error} />}
      {success && <Notice tone="green" icon={CheckCircle2} text={success} />}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} label="Prontidão da API" value={readiness?.status || (loading ? '...' : 'Verificar')} helper="Estado operacional" />
        <Metric icon={WalletCards} label="Propina oficial" value={tuitionAmount ? formatMoney(tuitionAmount) : 'Indisponível'} helper="Catálogo institucional" tone="amber" />
        <Metric icon={Mail} label="Notificações" value={notificationLogs.length} helper="Registos carregados" tone="green" />
        <Metric icon={CreditCard} label="Conciliação" value={transactions.length} helper="Transações registadas" tone="violet" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Gerar propinas académicas" subtitle="O valor é lido do catálogo oficial e não pode ser alterado manualmente nesta operação.">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Ano letivo"><input disabled={!canGenerate} type="number" value={form.year} onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))} className="input-premium" /></Field>
            <Field label="Valor oficial"><input disabled value={tuitionAmount || ''} className="input-premium" placeholder="Catálogo indisponível" /></Field>
            <Field label="Dia de vencimento"><input disabled={!canGenerate} type="number" min="1" max="28" value={form.dueDay} onChange={(event) => setForm((prev) => ({ ...prev, dueDay: event.target.value }))} className="input-premium" /></Field>
            <Field label="Período"><select disabled={!canGenerate} value={form.scope} onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))} className="input-premium"><option value="trimester">Novo trimestre</option><option value="full">Ano letivo completo</option></select></Field>
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900 dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
            <p className="font-black">Meses considerados</p><p className="mt-1">{monthPreview}</p><p className="mt-2 text-xs">Agosto e dezembro permanecem fora conforme a regra académica configurada.</p>
          </div>
          {canGenerate ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => handleGenerate(true)} disabled={running || !canGenerateNow} className="btn-secondary"><PlayCircle size={17} /> Simular geração</button>
              <button onClick={() => handleGenerate(false)} disabled={running || !canGenerateNow} className="btn-primary"><WalletCards size={17} /> Gerar propinas</button>
            </div>
          ) : <ReadOnlyHint />}
        </Panel>

        <Panel title="Resumo da última geração" subtitle="Resultado devolvido pela API institucional.">
          {generationResult ? (
            <div className="space-y-3">
              <ResultRow label="Estado" value={generationResult.status || '-'} />
              <ResultRow label="Ano" value={generationResult.year} />
              <ResultRow label="Valor por estudante" value={formatMoney(generationResult.monthlyAmount || tuitionAmount)} />
              <ResultRow label="Criadas ou preparadas" value={generationResult.createdOrPrepared ?? '-'} />
              <ResultRow label="Já existentes" value={generationResult.skippedExisting ?? '-'} />
              <ResultRow label="Modo" value={generationResult.dryRun ? 'Simulação' : 'Geração real'} />
            </div>
          ) : <EmptyState />}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <LogPanel title="Notificações" items={notificationLogs} render={(item) => `${item.notificationType || 'Notificação'} · ${item.channel || '-'} · ${item.status || '-'}`} />
        <LogPanel title="Auditoria" items={auditLogs} render={(item) => `${item.action || 'Ação'} · ${item.actor || 'Sistema'}`} />
        <LogPanel title="Conciliação" items={transactions} render={(item) => `${item.provider || 'Provedor'} · ${item.status || '-'} · ${formatMoney(item.amount || 0)}`} />
      </section>

      {notificationResult && (
        <Panel title="Última execução de notificações" subtitle="Resumo devolvido pela automação financeira.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ['Vence amanhã', notificationResult.chargesDueTomorrow], ['Vence hoje', notificationResult.chargesDueToday],
              ['Vencidas', notificationResult.chargesOverdue], ['Enviadas', notificationResult.sent],
              ['Falhas', notificationResult.failed], ['Ignoradas', notificationResult.skipped],
            ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{value ?? 0}</p></div>)}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children }) { return <section className="card-premium p-5"><h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p><div className="mt-5">{children}</div></section>; }
function Field({ label, children }) { return <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Metric({ icon: Icon, label, value, helper, tone = 'blue' }) { const tones = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', violet: 'bg-violet-50 text-violet-700' }; return <div className="card-premium p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-black text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon size={22} /></div></div></div>; }
function Notice({ tone, icon: Icon, text }) { const classes = tone === 'red' ? 'border-red-200 bg-red-50 text-red-800' : tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'; return <div className={`flex gap-3 rounded-2xl border p-4 text-sm font-bold ${classes}`}><Icon size={19} />{text}</div>; }
function ResultRow({ label, value }) { return <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-white/10"><span className="text-sm font-semibold text-slate-500">{label}</span><strong className="text-sm text-slate-950 dark:text-white">{value ?? '-'}</strong></div>; }
function EmptyState() { return <div className="rounded-2xl bg-slate-50 p-6 text-center dark:bg-white/5"><ClipboardList className="mx-auto text-slate-400" size={28} /><p className="mt-3 font-black text-slate-700 dark:text-white">Nenhuma geração executada</p><p className="mt-1 text-sm text-slate-500">Execute primeiro uma simulação.</p></div>; }
function ReadOnlyHint() { return <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500 dark:bg-white/5"><LockKeyhole size={17} /> Operação protegida para este perfil.</div>; }
function LogPanel({ title, items, render }) { return <Panel title={title} subtitle="Últimos registos institucionais.">{items.length ? <div className="space-y-2">{items.slice(0, 8).map((item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-100 p-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">{render(item)}</div>)}</div> : <p className="text-sm font-semibold text-slate-500">Nenhum registo encontrado.</p>}</Panel>; }
function readError(error, fallback) { return error?.response?.data?.message || error?.message || fallback; }
