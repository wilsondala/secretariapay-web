import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileClock,
  Loader2,
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
import { formatMoney } from '../utils/formatters.js';

const monthsFull = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11];
const monthsTrimester = [9, 10, 11];
const monthLabels = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

const inputClass = 'input-premium font-bold text-[#082B4B] dark:text-white';

export default function OperationsPage() {
  const [readiness, setReadiness] = useState(null);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generationResult, setGenerationResult] = useState(null);
  const [notificationResult, setNotificationResult] = useState(null);
  const [form, setForm] = useState({ year: 2026, monthlyAmount: 5000, dueDay: 10, scope: 'trimester' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [ready, logs, audits, payments] = await Promise.all([
        getOperationsReadiness().catch(() => null),
        listNotificationLogs().catch(() => []),
        listAuditLogs().catch(() => []),
        listPaymentTransactions().catch(() => []),
      ]);
      setReadiness(ready);
      setNotificationLogs(logs);
      setAuditLogs(audits);
      setTransactions(payments);
    } catch (err) {
      setError(readError(err, 'Falha ao carregar operações institucionais.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedMonths = useMemo(() => (form.scope === 'full' ? monthsFull : monthsTrimester), [form.scope]);
  const monthPreview = useMemo(() => selectedMonths.map((month) => `${monthLabels[month]}/${form.year}`).join(', '), [selectedMonths, form.year]);
  const logSummary = useMemo(() => notificationLogs.reduce((acc, log) => {
    const key = `${log.channel || 'CANAL'}_${log.status || 'STATUS'}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [notificationLogs]);

  async function handleGenerate(dryRun) {
    setRunning(true);
    setError('');
    setSuccess('');
    setGenerationResult(null);
    try {
      if (!dryRun && !window.confirm('Confirmar geração real das mensalidades? O sistema não duplica meses já existentes.')) return;
      const result = await generateMonthlyCharges({
        year: Number(form.year || 2026),
        monthlyAmount: Number(form.monthlyAmount || 0),
        dueDay: Number(form.dueDay || 10),
        months: selectedMonths,
        dryRun,
      });
      setGenerationResult(result);
      setSuccess(dryRun ? 'Simulação concluída. Nenhuma cobrança foi criada.' : 'Mensalidades geradas com sucesso.');
      await load();
    } catch (err) {
      setError(readError(err, 'Falha ao gerar mensalidades.'));
    } finally {
      setRunning(false);
    }
  }

  async function handleRunNotifications() {
    setRunning(true);
    setError('');
    setSuccess('');
    setNotificationResult(null);
    try {
      const result = await runFinancialNotifications();
      setNotificationResult(result);
      setSuccess('Automação de notificações executada. Confira o resumo e os registros abaixo.');
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
            <div className="premium-pill">
              <ShieldCheck size={14} />
              Operações institucionais
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[34px]">Central operacional da DCR</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85 sm:text-[15px]">
              Gere mensalidades do novo ciclo académico, rode notificações financeiras, acompanhe registros, auditoria e conciliação em uma única área.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={loading || running} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
              Atualizar
            </button>
            <button onClick={handleRunNotifications} disabled={running} className="btn-white">
              {running ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
              Rodar notificações
            </button>
          </div>
        </div>
      </section>

      {error ? <Notice tone="red" icon={AlertTriangle} text={error} /> : null}
      {success ? <Notice tone="green" icon={CheckCircle2} text={success} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} label="Prontidão da API" value={translateReadiness(readiness?.status) || (loading ? '...' : 'Verificar')} helper="Estado operacional" tone="blue" />
        <Metric icon={CalendarClock} label="Meses letivos" value="10" helper="Jan-Jul, Set-Nov" tone="amber" />
        <Metric icon={Mail} label="Notificações" value={notificationLogs.length} helper="Registros recentes" tone="emerald" />
        <Metric icon={CreditCard} label="Conciliação" value={transactions.length} helper="Transações registradas" tone="violet" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Gerar mensalidades académicas" subtitle="Cria cobranças para todos os estudantes ativos, sem duplicar mês já existente.">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Ano letivo">
              <input type="number" value={form.year} onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Valor mensal Kz">
              <input type="number" value={form.monthlyAmount} onChange={(event) => setForm((prev) => ({ ...prev, monthlyAmount: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Dia de vencimento">
              <input type="number" min="1" max="28" value={form.dueDay} onChange={(event) => setForm((prev) => ({ ...prev, dueDay: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Período">
              <select value={form.scope} onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))} className={inputClass}>
                <option value="trimester">Novo trimestre</option>
                <option value="full">Ano letivo completo</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm font-semibold leading-6 text-blue-900 dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
            <p className="font-black">Meses considerados:</p>
            <p className="mt-1">{monthPreview}</p>
            <p className="mt-2 text-xs text-blue-700 dark:text-sky-200">Agosto e Dezembro ficam fora por regra operacional. O vencimento será no dia {form.dueDay || 10}.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => handleGenerate(true)} disabled={running} className="btn-secondary gap-2">
              {running ? <Loader2 className="animate-spin" size={17} /> : <PlayCircle size={17} />}
              Simular geração
            </button>
            <button onClick={() => handleGenerate(false)} disabled={running} className="btn-primary gap-2">
              {running ? <Loader2 className="animate-spin" size={17} /> : <WalletCards size={17} />}
              Gerar mensalidades
            </button>
          </div>
        </Panel>

        <Panel title="Resumo da última operação" subtitle="Resultado devolvido pela API institucional.">
          {generationResult ? (
            <div className="space-y-3">
              <ResultRow label="Estado" value={translateStatus(generationResult.status)} />
              <ResultRow label="Ano" value={generationResult.year} />
              <ResultRow label="Valor mensal" value={formatMoney(generationResult.monthlyAmount)} />
              <ResultRow label="Criadas ou preparadas" value={generationResult.createdOrPrepared} />
              <ResultRow label="Já existentes" value={generationResult.skippedExisting} />
              <ResultRow label="Meses ignorados" value={(generationResult.ignoredMonths || []).map((m) => monthLabels[m]).join(', ') || '-'} />
              <ResultRow label="Modo" value={generationResult.dryRun ? 'Simulação' : 'Geração real'} />
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title="Nenhuma geração executada ainda" text="Use Simular geração primeiro. Depois, confirme a geração real." />
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Registros de notificações" subtitle="Últimos envios por WhatsApp, e-mail e outros canais.">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <MiniStat label="WhatsApp enviados" value={logSummary.WHATSAPP_SENT || 0} />
            <MiniStat label="E-mails enviados" value={logSummary.EMAIL_SENT || 0} />
          </div>
          <LogList items={notificationLogs.slice(0, 8)} empty="Nenhuma notificação registrada." render={(log) => (
            <>
              <p className="font-black text-imetro-navy dark:text-white">{translateNotificationType(log.notificationType)} · {translateChannel(log.channel)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{translateStatus(log.status)} · {formatDateTime(log.sentAt || log.createdAt)}</p>
              {log.errorMessage ? <p className="mt-2 text-xs font-semibold text-red-600">{log.errorMessage}</p> : null}
            </>
          )} />
        </Panel>

        <Panel title="Auditoria institucional" subtitle="Ações recentes gravadas pela API.">
          <LogList items={auditLogs.slice(0, 8)} empty="Nenhuma auditoria registrada." render={(log) => (
            <>
              <p className="font-black text-imetro-navy dark:text-white">{translateAudit(log.action)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{log.actor || 'Sistema'} · {formatDateTime(log.createdAt)}</p>
              <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{log.details || log.entityType || '-'}</p>
            </>
          )} />
        </Panel>

        <Panel title="Conciliação de pagamentos" subtitle="Transações registradas na retaguarda financeira.">
          <LogList items={transactions.slice(0, 8)} empty="Nenhuma transação registrada." render={(transaction) => (
            <>
              <p className="font-black text-imetro-navy dark:text-white">{translateProvider(transaction.provider)} · {translateStatus(transaction.status)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{translatePaymentMethod(transaction.paymentMethod)} · {formatDateTime(transaction.paidAt || transaction.createdAt)}</p>
              <p className="mt-2 text-sm font-black text-emerald-700 dark:text-emerald-300">{formatMoney(transaction.amount)} {transaction.currency || ''}</p>
            </>
          )} />
        </Panel>
      </section>

      {notificationResult ? (
        <Panel title="Última execução de notificações" subtitle="Resumo da cobrança automática executada manualmente.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <ResultTile label="Vence amanhã" value={notificationResult.chargesDueTomorrow} />
            <ResultTile label="Vence hoje" value={notificationResult.chargesDueToday} />
            <ResultTile label="Vencidas" value={notificationResult.chargesOverdue} />
            <ResultTile label="Enviadas" value={notificationResult.sent} />
            <ResultTile label="Falhas" value={notificationResult.failed} />
            <ResultTile label="Ignoradas" value={notificationResult.skipped} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function Notice({ tone, icon: Icon, text }) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  };
  return <div className={`rounded-3xl border p-4 shadow-[0_16px_46px_rgba(15,23,42,.05)] dark:shadow-none ${tones[tone] || tones.green}`}><div className="flex gap-3"><Icon className="mt-0.5 shrink-0" size={20} /><p className="text-sm font-semibold leading-6">{text}</p></div></div>;
}

function Metric({ icon: Icon, label, value, helper, tone }) {
  const tones = { blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200', emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200', violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200' };
  return <div className="card"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black text-slate-500 dark:text-slate-300">{label}</p><p className="mt-2 text-2xl font-black text-imetro-navy dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{helper}</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone] || tones.blue}`}><Icon size={23} /></div></div></div>;
}

function Panel({ title, subtitle, children }) {
  return <div className="card"><div><h2 className="text-lg font-black text-imetro-navy dark:text-white">{title}</h2>{subtitle ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{subtitle}</p> : null}</div><div className="mt-5">{children}</div></div>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>{children}</label>;
}

function ResultRow({ label, value }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/10"><p className="text-sm font-black text-slate-500 dark:text-slate-300">{label}</p><p className="text-right text-sm font-black text-imetro-navy dark:text-white">{String(value ?? '-')}</p></div>;
}

function ResultTile({ label, value }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/10"><p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p><p className="mt-2 text-2xl font-black text-imetro-navy dark:text-white">{Number(value || 0)}</p></div>;
}

function MiniStat({ label, value }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/10"><p className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p><p className="mt-1 text-xl font-black text-imetro-navy dark:text-white">{value}</p></div>;
}

function EmptyState({ icon: Icon, title, text }) {
  return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center dark:border-white/10 dark:bg-white/10"><Icon className="mx-auto text-slate-400 dark:text-slate-300" size={34} /><p className="mt-3 font-black text-imetro-navy dark:text-white">{title}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{text}</p></div>;
}

function LogList({ items, empty, render }) {
  if (!items.length) return <EmptyState icon={FileClock} title="Sem registros" text={empty} />;
  return <div className="space-y-3">{items.map((item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/10">{render(item)}</div>)}</div>;
}

function translateReadiness(value) {
  if (!value) return '';
  return value === 'READY' ? 'Pronta' : translateStatus(value);
}

function translateStatus(value) {
  const map = { OK: 'Concluído', READY: 'Pronto', SENT: 'Enviado', FAILED: 'Falhou', PREPARED: 'Preparado', PENDING: 'Pendente', PAID: 'Pago', CREATED: 'Criado' };
  return map[String(value || '').toUpperCase()] || String(value || '-');
}

function translateNotificationType(value) {
  const map = { DUE_TOMORROW: 'Vence amanhã', DUE_TODAY: 'Vence hoje', OVERDUE: 'Vencida' };
  return map[String(value || '').toUpperCase()] || 'Notificação';
}

function translateChannel(value) {
  const map = { EMAIL: 'E-mail', WHATSAPP: 'WhatsApp', SMS: 'SMS' };
  return map[String(value || '').toUpperCase()] || String(value || '-');
}

function translateAudit(value) {
  const map = { MONTHLY_CHARGES_GENERATED: 'Mensalidades geradas', MONTHLY_CHARGES_PREPARED: 'Mensalidades simuladas', FINANCIAL_NOTIFICATIONS_RUN: 'Notificações executadas', PAYMENT_TRANSACTION_RECORDED: 'Pagamento conciliado' };
  return map[String(value || '').toUpperCase()] || String(value || 'Ação operacional');
}

function translateProvider(value) {
  const map = { SECRETARIAPAY_INTERNAL: 'SecretáriaPay interno', APPYPAY: 'AppyPay', INFINITEPAY: 'InfinitePay' };
  return map[String(value || '').toUpperCase()] || String(value || 'Pagamento');
}

function translatePaymentMethod(value) {
  const map = { AUTO_RECONCILIATION: 'Conciliação automática' };
  return map[String(value || '').toUpperCase()] || String(value || 'Método não informado');
}

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
