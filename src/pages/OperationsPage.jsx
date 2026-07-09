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
  Sparkles,
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

const defaultMonths = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11];
const trimesterMonths = [9, 10, 11];
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
  const [form, setForm] = useState({
    year: 2026,
    monthlyAmount: 5000,
    dueDay: 10,
    scope: 'trimester',
  });

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

  const selectedMonths = useMemo(() => {
    return form.scope === 'full' ? defaultMonths : trimesterMonths;
  }, [form.scope]);

  const monthlyPreview = useMemo(() => selectedMonths.map((month) => `${monthLabels[month]}/${form.year}`).join(', '), [selectedMonths, form.year]);

  const logSummary = useMemo(() => {
    return notificationLogs.reduce((acc, log) => {
      const key = `${log.channel || 'CANAL'}_${log.status || 'STATUS'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [notificationLogs]);

  async function handleGenerate(dryRun) {
    setRunning(true);
    setError('');
    setSuccess('');
    setGenerationResult(null);

    try {
      if (!dryRun) {
        const ok = window.confirm('Confirmar geração real das mensalidades? O sistema não duplica meses já existentes.');
        if (!ok) return;
      }

      const payload = {
        year: Number(form.year || 2026),
        monthlyAmount: Number(form.monthlyAmount || 0),
        dueDay: Number(form.dueDay || 10),
        months: selectedMonths,
        dryRun,
      };

      const result = await generateMonthlyCharges(payload);
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
      setSuccess('Automação de notificações executada. Confira o resumo e os logs abaixo.');
      await load();
    } catch (err) {
      setError(readError(err, 'Falha ao executar notificações.'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-7rem] left-1/3 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <ShieldCheck size={14} />
              Operações institucionais
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Central operacional da DCR</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/80 sm:text-base">
              Gere mensalidades do novo ciclo académico, rode notificações financeiras, acompanhe logs, auditoria e conciliação em uma única área.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={loading || running} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
              Atualizar
            </button>
            <button onClick={handleRunNotifications} disabled={running} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-imetro-navy transition hover:bg-slate-50 disabled:opacity-60">
              {running ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
              Rodar notificações
            </button>
          </div>
        </div>
      </section>

      {error ? <Notice tone="red" icon={AlertTriangle} text={error} /> : null}
      {success ? <Notice tone="green" icon={CheckCircle2} text={success} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} label="API institucional" value={readiness?.status || (loading ? '...' : 'Verificar')} helper="Readiness operacional" tone="blue" />
        <Metric icon={CalendarClock} label="Meses letivos" value="10" helper="Jan-Jul, Set-Nov" tone="amber" />
        <Metric icon={Mail} label="Notificações" value={notificationLogs.length} helper="Últimos logs" tone="emerald" />
        <Metric icon={CreditCard} label="Conciliação" value={transactions.length} helper="Transações registradas" tone="violet" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Gerar mensalidades académicas" subtitle="Cria cobranças para todos os estudantes ativos, sem duplicar mês já existente.">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Ano letivo">
              <input type="number" value={form.year} onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))} className="input" />
            </Field>
            <Field label="Valor mensal Kz">
              <input type="number" value={form.monthlyAmount} onChange={(event) => setForm((prev) => ({ ...prev, monthlyAmount: event.target.value }))} className="input" />
            </Field>
            <Field label="Dia vencimento">
              <input type="number" min="1" max="28" value={form.dueDay} onChange={(event) => setForm((prev) => ({ ...prev, dueDay: event.target.value }))} className="input" />
            </Field>
            <Field label="Escopo">
              <select value={form.scope} onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))} className="input">
                <option value="trimester">Novo trimestre</option>
                <option value="full">Ano letivo completo</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm font-semibold leading-6 text-blue-900">
            <p className="font-black">Meses que serão considerados:</p>
            <p className="mt-1">{monthlyPreview}</p>
            <p className="mt-2 text-xs text-blue-700">Agosto e Dezembro ficam fora por regra operacional. O vencimento será no dia {form.dueDay || 10}.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => handleGenerate(true)} disabled={running} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
              {running ? <Loader2 className="animate-spin" size={17} /> : <PlayCircle size={17} />}
              Simular geração
            </button>
            <button onClick={() => handleGenerate(false)} disabled={running} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-imetro-navy px-4 py-3 text-sm font-black text-white shadow-[0_16px_44px_rgba(6,25,54,.18)] transition hover:bg-[#092755] disabled:opacity-60">
              {running ? <Loader2 className="animate-spin" size={17} /> : <WalletCards size={17} />}
              Gerar mensalidades
            </button>
          </div>
        </Panel>

        <Panel title="Resumo da última operação" subtitle="Resultado devolvido pela API institucional.">
          {generationResult ? (
            <div className="space-y-3">
              <ResultRow label="Status" value={generationResult.status} />
              <ResultRow label="Ano" value={generationResult.year} />
              <ResultRow label="Valor mensal" value={formatMoney(generationResult.monthlyAmount)} />
              <ResultRow label="Criadas/preparadas" value={generationResult.createdOrPrepared} />
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
        <Panel title="Logs de notificações" subtitle="Últimos envios por WhatsApp, e-mail e outros canais.">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <MiniStat label="WhatsApp sent" value={logSummary.WHATSAPP_SENT || 0} />
            <MiniStat label="Email sent" value={logSummary.EMAIL_SENT || 0} />
          </div>
          <LogList items={notificationLogs.slice(0, 8)} empty="Nenhuma notificação registrada." render={(log) => (
            <>
              <p className="font-black text-imetro-navy">{log.notificationType || 'Notificação'} · {log.channel}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{log.status} · {formatDateTime(log.sentAt || log.createdAt)}</p>
              {log.errorMessage ? <p className="mt-2 text-xs font-semibold text-red-600">{log.errorMessage}</p> : null}
            </>
          )} />
        </Panel>

        <Panel title="Auditoria institucional" subtitle="Ações recentes gravadas pela API.">
          <LogList items={auditLogs.slice(0, 8)} empty="Nenhuma auditoria registrada." render={(log) => (
            <>
              <p className="font-black text-imetro-navy">{log.action || 'Ação operacional'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{log.actor || 'SYSTEM'} · {formatDateTime(log.createdAt)}</p>
              <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600">{log.details || log.entityType || '-'}</p>
            </>
          )} />
        </Panel>

        <Panel title="Conciliação de pagamentos" subtitle="Transações registradas na retaguarda financeira.">
          <LogList items={transactions.slice(0, 8)} empty="Nenhuma transação registrada." render={(transaction) => (
            <>
              <p className="font-black text-imetro-navy">{transaction.provider || 'Pagamento'} · {transaction.status}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{transaction.paymentMethod || 'Método'} · {formatDateTime(transaction.paidAt || transaction.createdAt)}</p>
              <p className="mt-2 text-sm font-black text-emerald-700">{formatMoney(transaction.amount)} {transaction.currency || ''}</p>
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
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    red: 'border-red-200 bg-red-50 text-red-900',
  };
  return (
    <div className={`rounded-3xl border p-4 shadow-[0_16px_46px_rgba(15,23,42,.05)] ${tones[tone] || tones.green}`}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 shrink-0" size={20} />
        <p className="text-sm font-semibold leading-6">{text}</p>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className="rounded-3xl border border-white bg-white/92 p-5 shadow-[0_18px_60px_rgba(15,23,42,.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-imetro-navy">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone] || tones.blue}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white bg-white/92 p-5 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-black text-imetro-navy">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-sm font-black text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-imetro-navy">{String(value ?? '-')}</p>
    </div>
  );
}

function ResultTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-imetro-navy">{Number(value || 0)}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-imetro-navy">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <Icon className="mx-auto text-slate-400" size={34} />
      <p className="mt-3 font-black text-imetro-navy">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function LogList({ items, empty, render }) {
  if (!items.length) {
    return <EmptyState icon={FileClock} title="Sem registros" text={empty} />;
  }
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id || index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          {render(item)}
        </div>
      ))}
    </div>
  );
}

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
