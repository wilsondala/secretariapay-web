import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Banknote,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { env } from '../config/env.js';
import {
  approveEnrollmentPaymentProof,
  confirmEnrollmentPayment,
  getEnrollmentDashboard,
  listEnrollments,
  rejectEnrollmentPaymentProof,
} from '../services/enrollmentService.js';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';

const REQUEST_TYPE_LABELS = {
  ENROLLMENT: 'Matrícula',
  REENROLLMENT: 'Rematrícula',
};

const STATUS_LABELS = {
  AWAITING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_UNDER_REVIEW: 'Pagamento em análise',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const STATUS_CLASS = {
  AWAITING_PAYMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200',
  PAYMENT_UNDER_REVIEW: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
};

const PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendente',
  UNDER_REVIEW: 'Em análise',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
};

const PROOF_STATUS_LABELS = {
  PENDING_REVIEW: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

const PAYMENT_METHOD_LABELS = {
  REFERENCIA_OU_CONCILIACAO: 'Referência ou conciliação bancária',
  REFERENCIA_BANCARIA: 'Referência bancária',
  TRANSFERENCIA_BANCARIA: 'Transferência bancária',
  TRANSFERENCIA_MESMO_BANCO: 'Transferência no mesmo banco',
  MULTICAIXA_EXPRESS: 'Multicaixa Express',
  DEPOSITO: 'Depósito bancário',
  DEPOSITO_BANCARIO: 'Depósito bancário',
  CASH: 'Numerário',
  DINHEIRO: 'Numerário',
};

const SHIFT_LABELS = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noite',
};

function money(value, currency = 'AOA') {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);
  return `${formatted} ${currency === 'AOA' ? 'Kz' : currency}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function shiftLabel(value) {
  return SHIFT_LABELS[value] || value || '-';
}

function paymentMethodLabel(value) {
  if (!value) return '-';
  if (PAYMENT_METHOD_LABELS[value]) return PAYMENT_METHOD_LABELS[value];

  const normalized = String(value).trim().toLowerCase().replaceAll('_', ' ');
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '-';
}

export default function EnrollmentsPage() {
  const { user } = useAuth();
  const canManagePayments = can(user, 'manageEnrollmentPayments');

  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState('Pagamento da matrícula confirmado pela DCR.');

  async function load(selectedId = null) {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, requestRows] = await Promise.all([
        getEnrollmentDashboard(env.institutionId),
        listEnrollments({ institutionId: env.institutionId }),
      ]);
      setDashboard(dashboardData);
      setRequests(requestRows);
      if (selectedId) {
        const refreshed = requestRows.find((item) => item.id === selectedId);
        if (refreshed) setSelected(refreshed);
      }
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível carregar as matrículas e rematrículas.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => requests.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.requestCode || ''} ${item.fullName || ''} ${item.studentNumber || ''} ${item.documentNumber || ''} ${item.targetCourseName || ''}`.toLowerCase();
    return (!term || searchable.includes(term))
      && (!typeFilter || item.requestType === typeFilter)
      && (!statusFilter || item.status === statusFilter)
      && (!paymentFilter || item.invoice?.status === paymentFilter);
  }), [requests, query, typeFilter, statusFilter, paymentFilter]);

  const completedTotal = Number(dashboard?.completedEnrollments || 0) + Number(dashboard?.completedReenrollments || 0);
  const underReviewTotal = Number(dashboard?.enrollmentPaymentUnderReview || 0) + Number(dashboard?.reenrollmentPaymentUnderReview || 0);

  async function runPaymentAction(name, action, message) {
    setBusy(name);
    setError('');
    setSuccess('');
    try {
      const updated = await action();
      setSelected(updated);
      setSuccess(message);
      await load(updated.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível concluir a validação financeira.'));
    } finally {
      setBusy('');
    }
  }

  function reviewerPayload(overrides = {}) {
    return {
      reviewedBy: user?.fullName || user?.name || user?.email || 'DCR',
      reviewNote: reviewNote.trim() || 'Pagamento da matrícula confirmado pela DCR.',
      paymentMethod: 'TRANSFERENCIA_BANCARIA',
      paymentReference: selected?.invoice?.paymentReference || null,
      provider: selected?.invoice?.provider || 'DCR_MANUAL',
      externalTransactionId: null,
      ...overrides,
    };
  }

  const pendingProof = selected?.latestPaymentProof?.status === 'PENDING_REVIEW';
  const canConfirmManually = Boolean(
    selected?.invoice
    && ['PENDING', 'UNDER_REVIEW'].includes(selected.invoice.status)
    && (!selected.latestPaymentProof || selected.latestPaymentProof.status === 'REJECTED'),
  );

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><GraduationCap size={14} /> Gestão académica e financeira</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[32px]">Matrículas e rematrículas</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Controlo separado de pedidos, pagamentos, receitas e progressão académica dos estudantes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admissions" className="btn-light">Ver inscrições</Link>
            <button onClick={() => load(selected?.id)} disabled={loading || Boolean(busy)} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
            </button>
          </div>
        </div>
      </section>

      {error ? <Notice tone="red">{error}</Notice> : null}
      {success ? <Notice tone="green">{success}</Notice> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Matrículas" value={dashboard?.totalEnrollments || 0} helper="Pedidos registados" icon={Users} />
        <Metric label="Rematrículas" value={dashboard?.totalReenrollments || 0} helper="Renovações registadas" icon={BookOpen} />
        <Metric label="Concluídas" value={completedTotal} helper="Pagamentos validados" icon={BadgeCheck} />
        <Metric label="Em análise" value={underReviewTotal} helper="Comprovativos pendentes" icon={Clock3} />
        <Metric label="Receita total" value={money(dashboard?.totalRevenue || 0)} helper="Matrícula + rematrícula" icon={Banknote} compact />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <RevenueCard
          title="Receita de matrículas"
          amount={dashboard?.enrollmentRevenue || 0}
          total={dashboard?.totalEnrollments || 0}
          completed={dashboard?.completedEnrollments || 0}
          waiting={dashboard?.awaitingEnrollmentPayment || 0}
        />
        <RevenueCard
          title="Receita de rematrículas"
          amount={dashboard?.reenrollmentRevenue || 0}
          total={dashboard?.totalReenrollments || 0}
          completed={dashboard?.completedReenrollments || 0}
          waiting={dashboard?.awaitingReenrollmentPayment || 0}
        />
      </section>

      <section className="premium-card overflow-hidden">
        <div className="grid gap-2 border-b border-slate-200 p-4 dark:border-white/10 md:grid-cols-4">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input-premium pl-10" placeholder="Buscar estudante, BI ou código..." />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="input-premium">
            <option value="">Todas as operações</option>
            {Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-premium">
            <option value="">Todos os estados</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="input-premium">
            <option value="">Todos os pagamentos</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500 dark:bg-white/[.03] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Estudante</th>
                <th className="px-4 py-3">Operação</th>
                <th className="px-4 py-3">Curso e turma</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Financeiro</th>
                <th className="px-5 py-3 text-right">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">
              {filtered.map((item) => (
                <tr key={item.id} className="text-sm hover:bg-slate-50/80 dark:hover:bg-white/[.03]">
                  <td className="px-5 py-4">
                    <p className="text-xs font-extrabold text-[#3157D5]">{item.studentNumber || item.applicationCode || 'Número pendente'}</p>
                    <p className="mt-1 font-extrabold text-slate-800 dark:text-white">{item.fullName}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{item.documentNumber || '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-extrabold text-slate-700 dark:text-slate-200">{REQUEST_TYPE_LABELS[item.requestType] || item.requestType}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{item.requestCode}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{item.targetCourseName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{item.targetYearLevel}.º Ano · {shiftLabel(item.targetShift)}</p>
                  </td>
                  <td className="px-4 py-4"><Status status={item.status} /></td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{PAYMENT_STATUS_LABELS[item.invoice?.status] || 'Sem cobrança'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{item.invoice ? money(item.invoice.amount, item.invoice.currency) : '-'}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setSelected(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-[#3157D5] dark:border-white/10">Abrir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-extrabold uppercase tracking-[.08em] text-[#3157D5]">{item.requestCode}</p>
                  <h3 className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">{item.fullName}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.studentNumber || 'Número pendente'}</p>
                </div>
                <Status status={item.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CompactInfo label="Operação" value={REQUEST_TYPE_LABELS[item.requestType] || item.requestType} />
                <CompactInfo label="Ano/turno" value={`${item.targetYearLevel}.º · ${shiftLabel(item.targetShift)}`} />
                <CompactInfo label="Pagamento" value={PAYMENT_STATUS_LABELS[item.invoice?.status] || 'Sem cobrança'} />
                <CompactInfo label="Valor" value={item.invoice ? money(item.invoice.amount, item.invoice.currency) : '-'} />
              </div>
              <div className="mt-4 flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                <button type="button" onClick={() => setSelected(item)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#3157D5]/30 bg-[#3157D5]/10 px-4 py-2 text-xs font-extrabold text-[#3157D5] transition hover:bg-[#3157D5]/20 dark:text-[#79A2FF]">
                  Abrir detalhes
                </button>
              </div>
            </article>
          ))}
        </div>

        {loading ? <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Carregando...</div> : null}
        {!loading && filtered.length === 0 ? <div className="flex min-h-[180px] flex-col items-center justify-center text-center"><FileSearch className="text-slate-300" /><p className="mt-2 text-sm font-bold text-slate-500">Nenhuma matrícula ou rematrícula encontrada.</p></div> : null}
      </section>

      {selected ? (
        <Drawer title={selected.fullName} subtitle={selected.requestCode} onClose={() => setSelected(null)}>
          <div className="flex flex-wrap items-center gap-2">
            <Status status={selected.status} />
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">{REQUEST_TYPE_LABELS[selected.requestType] || selected.requestType}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Número de estudante" value={selected.studentNumber || 'Será gerado após pagamento'} />
            <Info label="Documento" value={selected.documentNumber || '-'} />
            <Info label="Curso" value={selected.targetCourseName} />
            <Info label="Turma de destino" value={`${selected.targetYearLevel}.º Ano · ${shiftLabel(selected.targetShift)} · ${selected.academicYear}`} />
            <Info label="Concluída em" value={formatDateTime(selected.completedAt)} />
            <Info label="Criada em" value={formatDateTime(selected.createdAt)} />
          </div>

          <div className="premium-card mt-5 p-4">
            <div className="flex items-center gap-2"><Banknote size={18} className="text-[#3157D5]" /><h3 className="font-extrabold text-imetro-navy dark:text-white">Situação financeira</h3></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info label="Cobrança" value={selected.invoice?.invoiceCode || 'Não emitida'} />
              <Info label="Valor" value={selected.invoice ? money(selected.invoice.amount, selected.invoice.currency) : '-'} />
              <Info label="Estado" value={PAYMENT_STATUS_LABELS[selected.invoice?.status] || '-'} />
              <Info label="Referência" value={selected.invoice?.paymentReference || '-'} />
              <Info label="Método" value={paymentMethodLabel(selected.invoice?.paymentMethod)} />
              <Info label="Pago em" value={formatDateTime(selected.invoice?.paidAt)} />
            </div>
          </div>

          <div className="premium-card mt-5 p-4">
            <div className="flex items-center gap-2"><FileCheck2 size={18} className="text-[#3157D5]" /><h3 className="font-extrabold text-imetro-navy dark:text-white">Comprovativo</h3></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info label="Estado" value={PROOF_STATUS_LABELS[selected.latestPaymentProof?.status] || 'Não enviado'} />
              <Info label="Arquivo" value={selected.latestPaymentProof?.fileName || '-'} />
              <Info label="Analisado por" value={selected.latestPaymentProof?.reviewedBy || '-'} />
              <Info label="Analisado em" value={formatDateTime(selected.latestPaymentProof?.reviewedAt)} />
            </div>
          </div>

          {pendingProof && canManagePayments ? (
            <div className="premium-card mt-5 p-4">
              <h3 className="font-extrabold text-imetro-navy dark:text-white">Validação do comprovativo pela DCR</h3>
              {selected.latestPaymentProof?.fileUrl ? (
                <a href={selected.latestPaymentProof.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#3157D5] dark:text-[#79A2FF]">
                  <FileSearch size={17} /> Abrir comprovativo
                </a>
              ) : null}
              <Field label="Observação da análise">
                <textarea rows={3} className="input-premium" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
              </Field>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn-secondary text-red-600"
                  disabled={Boolean(busy)}
                  onClick={() => runPaymentAction(
                    'reject',
                    () => rejectEnrollmentPaymentProof(selected.latestPaymentProof.id, reviewerPayload({ reviewNote: reviewNote.trim() || 'Comprovativo da matrícula rejeitado pela DCR.' })),
                    'Comprovativo da matrícula rejeitado.',
                  )}
                >
                  {busy === 'reject' ? <Loader2 className="animate-spin" size={17} /> : null} Rejeitar
                </button>
                <button
                  type="button"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                  disabled={Boolean(busy)}
                  onClick={() => runPaymentAction(
                    'approve',
                    () => approveEnrollmentPaymentProof(selected.latestPaymentProof.id, reviewerPayload()),
                    'Pagamento da matrícula aprovado. O estudante e o número de matrícula foram criados.',
                  )}
                >
                  {busy === 'approve' ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />} Aprovar pagamento
                </button>
              </div>
            </div>
          ) : null}

          {canConfirmManually && canManagePayments ? (
            <div className="premium-card mt-5 p-4">
              <h3 className="font-extrabold text-imetro-navy dark:text-white">Confirmação manual da DCR</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                Utilize esta opção somente após confirmar o crédito por referência, conciliação bancária ou comprovativo recebido fora do portal.
              </p>
              <Field label="Observação da confirmação">
                <textarea rows={3} className="input-premium" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
              </Field>
              <button
                type="button"
                className="btn-primary mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={Boolean(busy)}
                onClick={() => runPaymentAction(
                  'confirm',
                  () => confirmEnrollmentPayment(selected.invoice.id, reviewerPayload({ paymentMethod: 'REFERENCIA_OU_CONCILIACAO' })),
                  'Pagamento da matrícula confirmado manualmente. O estudante e o número de matrícula foram criados.',
                )}
              >
                {busy === 'confirm' ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />} Confirmar pagamento manualmente
              </button>
            </div>
          ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}

function Metric({ label, value, helper, icon: Icon, compact = false }) {
  return (
    <div className="premium-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p>
          <p className={`${compact ? 'text-xl' : 'text-2xl'} mt-2 truncate font-extrabold tracking-[-.04em] text-imetro-navy dark:text-white`}>{value}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{helper}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#3157D5] dark:bg-blue-500/10 dark:text-[#79A2FF]"><Icon size={19} /></span>
      </div>
    </div>
  );
}

function RevenueCard({ title, amount, total, completed, waiting }) {
  return (
    <div className="premium-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-imetro-navy dark:text-white">{money(amount)}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><Banknote size={20} /></span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <CompactInfo label="Total" value={total} />
        <CompactInfo label="Concluídas" value={completed} />
        <CompactInfo label="Pendentes" value={waiting} />
      </div>
    </div>
  );
}

function Status({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_CLASS[status] || STATUS_CLASS.CANCELLED}`}>{STATUS_LABELS[status] || status || '-'}</span>;
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[.03]"><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-extrabold text-slate-700 dark:text-slate-200">{value || '-'}</p></div>;
}

function CompactInfo({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/[.04]"><p className="text-[9px] font-extrabold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-extrabold text-slate-700 dark:text-slate-200">{value ?? '-'}</p></div>;
}

function Field({ label, children }) {
  return <label className="mt-4 block"><span className="mb-1.5 block text-xs font-extrabold text-slate-600 dark:text-slate-300">{label}</span>{children}</label>;
}

function Notice({ tone, children }) {
  const style = tone === 'green'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200';
  return <div className={`rounded-2xl border p-4 text-sm font-bold ${style}`}>{children}</div>;
}

function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Fechar detalhes" />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#081321] sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
          <div className="min-w-0"><p className="truncate text-xs font-extrabold uppercase tracking-[.1em] text-[#3157D5]">{subtitle}</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-imetro-navy dark:text-white">{title}</h2></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="pt-5">{children}</div>
      </aside>
    </div>
  );
}
