import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  FileSearch,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import AdmissionEnrollmentDocumentsPanel from '../components/admissions/AdmissionEnrollmentDocumentsPanel.jsx';
import { env } from '../config/env.js';
import {
  approveAdmissionPaymentProof,
  confirmAdmissionInvoicePayment,
  createAdmissionApplication,
  getAdmissionsDashboard,
  getOfficialAdmissionsCatalog,
  issueAdmissionInvoice,
  listAdmissionApplications,
  rejectAdmissionPaymentProof,
} from '../services/admissionsService.js';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';

const STATUS_LABELS = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Submetida',
  DOCUMENTATION_PENDING: 'Documentação pendente',
  AWAITING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_UNDER_REVIEW: 'Pagamento em análise',
  CONFIRMED: 'Confirmada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

const STATUS_CLASS = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  DOCUMENTATION_PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  AWAITING_PAYMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200',
  PAYMENT_UNDER_REVIEW: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
};

const SHIFT_LABELS = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

const CHANNEL_LABELS = {
  FORM: 'Formulário',
  WHATSAPP: 'WhatsApp',
  INTERNAL: 'Interno',
  IMPORT: 'Importação',
};

const INVOICE_STATUS_LABELS = {
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

function money(value, currency = 'AOA') {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);
  return `${formatted} ${currency === 'AOA' ? 'Kz' : currency}`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
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

function datePlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function shiftLabel(value) {
  return SHIFT_LABELS[value] || value || '-';
}

export default function OfficialAdmissionsPage() {
  const { user } = useAuth();
  const canManageApplications = can(user, 'manageAdmissionApplications');
  const canManagePayments = can(user, 'manageAdmissionPayments');

  const [catalog, setCatalog] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    desiredCourseId: '',
    desiredShift: 'NOITE',
    academicYear: '2026/2027',
    fullName: '',
    documentType: 'BI',
    documentNumber: '',
    birthDate: '',
    phone: '',
    whatsapp: '',
    email: '',
    previousSchool: '',
    province: 'Luanda',
    municipality: '',
    documentsComplete: false,
    termsAccepted: true,
    notes: '',
  });
  const [dueDate, setDueDate] = useState(datePlusDays(3));
  const [reference, setReference] = useState('');
  const [reviewNote, setReviewNote] = useState('Pagamento da inscrição confirmado pela DCR.');

  const courses = useMemo(
    () => (catalog?.departments || []).flatMap((department) =>
      department.courses.map((course) => ({ ...course, departmentCode: department.departmentCode }))),
    [catalog],
  );

  const shifts = useMemo(() => {
    const unique = new Map();
    courses.forEach((course) => course.shifts.forEach((shift) => unique.set(shift.code, shift.label)));
    return [...unique.entries()].map(([code, label]) => ({ code, label }));
  }, [courses]);

  async function load(selectedId = null) {
    setLoading(true);
    setError('');
    try {
      const [catalogData, applicationRows, dashboardData] = await Promise.all([
        getOfficialAdmissionsCatalog(env.institutionId),
        listAdmissionApplications({ institutionId: env.institutionId }),
        getAdmissionsDashboard({ institutionId: env.institutionId }),
      ]);
      setCatalog(catalogData);
      setApplications(applicationRows);
      setDashboard(dashboardData);
      setForm((current) => ({ ...current, academicYear: catalogData.academicYear }));
      if (selectedId) {
        const refreshed = applicationRows.find((item) => item.id === selectedId);
        if (refreshed) setSelected(refreshed);
      }
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível carregar as inscrições oficiais.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => applications.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.applicationCode || ''} ${item.fullName || ''} ${item.documentNumber || ''} ${item.desiredCourseName || ''}`.toLowerCase();
    return (!term || searchable.includes(term))
      && (!courseFilter || item.desiredCourseId === courseFilter)
      && (!shiftFilter || item.desiredShift === shiftFilter)
      && (!statusFilter || item.status === statusFilter);
  }), [applications, query, courseFilter, shiftFilter, statusFilter]);

  async function runAction(name, action, message) {
    setBusy(name);
    setError('');
    setSuccess('');
    try {
      const updated = await action();
      setSelected(updated);
      setSuccess(message);
      await load(updated.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível concluir a operação.'));
    } finally {
      setBusy('');
    }
  }

  async function createApplication(event) {
    event.preventDefault();
    setBusy('create');
    setError('');
    setSuccess('');
    try {
      const created = await createAdmissionApplication({
        ...form,
        institutionId: env.institutionId,
        birthDate: form.birthDate || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
      });
      setCreateModal(false);
      setSelected(created);
      setSuccess('Candidatura interna registada na campanha oficial 2026/2027.');
      await load(created.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível criar a candidatura.'));
    } finally {
      setBusy('');
    }
  }

  function reviewerPayload(overrides = {}) {
    return {
      reviewedBy: user?.fullName || user?.name || user?.email || 'Utilizador institucional',
      reviewNote,
      paymentMethod: 'TRANSFERENCIA_BANCARIA',
      paymentReference: selected?.invoice?.paymentReference || null,
      provider: selected?.invoice?.provider || 'DCR_MANUAL',
      externalTransactionId: null,
      ...overrides,
    };
  }

  const showEnrollmentChecklist = Boolean(
    selected?.invoice?.status === 'PAID'
    || ['DOCUMENTATION_PENDING', 'CONFIRMED'].includes(selected?.status),
  );

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><GraduationCap size={14} /> Campanha oficial IMETRO</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[32px]">Inscrições 2026/2027</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Acompanhamento por curso e turno, cobrança oficial, validação financeira e conferência documental.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admissions-pilot" className="btn-light">Captação e leads</Link>
            <button onClick={() => load(selected?.id)} disabled={loading || Boolean(busy)} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
            </button>
            {canManageApplications ? (
              <button onClick={() => setCreateModal(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F4B400] px-4 py-2.5 text-xs font-extrabold text-[#10213A] shadow-lg">
                <UserPlus size={17} /> Nova candidatura
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <Notice tone="red" icon={XCircle}>{error}</Notice> : null}
      {success ? <Notice tone="green" icon={CheckCircle2}>{success}</Notice> : null}

      {catalog ? (
        <section className="premium-card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <Info label="Ano académico" value={catalog.academicYear} />
          <Info label="Período" value={`${formatDate(catalog.registrationStart)} a ${formatDate(catalog.registrationEnd)}`} />
          <Info label="Inscrição" value={money(catalog.registrationFee, catalog.currency)} />
          <Info label="Matrícula" value={money(catalog.enrollmentFee, catalog.currency)} />
          <Info label="Rematrícula" value={money(catalog.reenrollmentFee, catalog.currency)} />
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Candidaturas submetidas" value={dashboard?.submittedApplications || 0} icon={GraduationCap} />
        <Metric label="Aguardando pagamento" value={dashboard?.awaitingPayment || 0} icon={Clock3} />
        <Metric label="Inscrições confirmadas" value={dashboard?.confirmedApplications || 0} icon={BadgeCheck} />
        <Metric label="Receita recebida" value={money(dashboard?.totalPaid || 0)} icon={Banknote} />
      </section>

      <section className="premium-card overflow-hidden">
        <div className="grid gap-2 border-b border-slate-200 p-4 dark:border-white/10 md:grid-cols-4">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input-premium pl-10" placeholder="Buscar nome, BI ou código..." />
          </div>
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="input-premium">
            <option value="">Todos os cursos</option>
            {courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.departmentCode} · {course.courseName}</option>)}
          </select>
          <select value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value)} className="input-premium">
            <option value="">Todos os turnos</option>
            {shifts.map((shift) => <option key={shift.code} value={shift.code}>{shift.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-premium">
            <option value="">Todos os estados</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500 dark:bg-white/[.03] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Candidato</th>
                <th className="px-4 py-3">Curso/turno</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Financeiro</th>
                <th className="px-5 py-3 text-right">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">
              {filtered.map((item) => (
                <tr key={item.id} className="text-sm hover:bg-slate-50/80 dark:hover:bg-white/[.03]">
                  <td className="px-5 py-4">
                    <p className="text-xs font-extrabold text-[#3157D5]">{item.applicationCode}</p>
                    <p className="mt-1 font-extrabold text-slate-800 dark:text-white">{item.fullName}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{item.documentNumber}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{item.desiredCourseName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{shiftLabel(item.desiredShift)}</p>
                  </td>
                  <td className="px-4 py-4"><Status status={item.status} /></td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{INVOICE_STATUS_LABELS[item.invoice?.status] || 'Não emitida'}</p>
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
            <article key={item.id} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-white/10 dark:bg-white/[.03]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-extrabold uppercase tracking-[.08em] text-[#3157D5]">{item.applicationCode}</p>
                  <h3 className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">{item.fullName}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.documentNumber}</p>
                </div>
                <Status status={item.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CompactInfo label="Curso" value={item.desiredCourseName} />
                <CompactInfo label="Turno" value={shiftLabel(item.desiredShift)} />
                <CompactInfo label="Financeiro" value={INVOICE_STATUS_LABELS[item.invoice?.status] || 'Não emitida'} />
                <CompactInfo label="Valor" value={item.invoice ? money(item.invoice.amount, item.invoice.currency) : '-'} />
              </div>
              <div className="mt-4 flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                <button type="button" onClick={() => setSelected(item)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#3157D5]/30 bg-[#3157D5]/10 px-4 py-2 text-xs font-extrabold text-[#79A2FF] transition hover:bg-[#3157D5]/20">
                  Abrir detalhes
                </button>
              </div>
            </article>
          ))}
        </div>

        {loading ? <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Carregando...</div> : null}
        {!loading && filtered.length === 0 ? <div className="flex min-h-[180px] flex-col items-center justify-center text-center"><FileSearch className="text-slate-300" /><p className="mt-2 text-sm font-bold text-slate-500">Nenhuma candidatura encontrada.</p></div> : null}
      </section>

      {createModal ? (
        <Modal title="Nova candidatura interna" onClose={() => setCreateModal(false)}>
          <form onSubmit={createApplication} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo"><input required className="input-premium" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field>
              <Field label="BI/Passaporte"><input required className="input-premium" value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} /></Field>
              <Field label="Curso"><select required className="input-premium" value={form.desiredCourseId} onChange={(event) => setForm({ ...form, desiredCourseId: event.target.value })}><option value="">Selecione</option>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.departmentCode} · {course.courseName}</option>)}</select></Field>
              <Field label="Turno"><select className="input-premium" value={form.desiredShift} onChange={(event) => setForm({ ...form, desiredShift: event.target.value })}>{shifts.map((shift) => <option key={shift.code} value={shift.code}>{shift.label}</option>)}</select></Field>
              <Field label="Data de nascimento"><input type="date" className="input-premium" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></Field>
              <Field label="WhatsApp"><input className="input-premium" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} /></Field>
              <Field label="E-mail"><input type="email" className="input-premium" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
              <Field label="Escola anterior"><input className="input-premium" value={form.previousSchool} onChange={(event) => setForm({ ...form, previousSchool: event.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.documentsComplete} onChange={(event) => setForm({ ...form, documentsComplete: event.target.checked })} /> Documentação já conferida</label>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancelar</button><button disabled={busy === 'create'} className="btn-primary">{busy === 'create' ? <Loader2 className="animate-spin" size={17} /> : <UserPlus size={17} />} Registar</button></div>
          </form>
        </Modal>
      ) : null}

      {selected ? (
        <Drawer title={selected.fullName} subtitle={selected.applicationCode} onClose={() => setSelected(null)}>
          <Status status={selected.status} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Curso" value={selected.desiredCourseName} />
            <Info label="Turno" value={shiftLabel(selected.desiredShift)} />
            <Info label="Canal" value={CHANNEL_LABELS[selected.sourceChannel] || selected.sourceChannel} />
            <Info label="Documentação" value={selected.documentsComplete ? 'Completa' : 'Pendente'} />
          </div>

          <div className="premium-card mt-5 p-4">
            <h3 className="font-extrabold text-imetro-navy dark:text-white">Situação financeira</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info label="Cobrança" value={selected.invoice?.invoiceCode || 'Não emitida'} />
              <Info label="Valor" value={selected.invoice ? money(selected.invoice.amount, selected.invoice.currency) : money(catalog?.registrationFee || 0)} />
              <Info label="Estado" value={INVOICE_STATUS_LABELS[selected.invoice?.status] || '-'} />
              <Info label="Pago em" value={formatDateTime(selected.invoice?.paidAt)} />
              <Info label="Comprovativo" value={PROOF_STATUS_LABELS[selected.latestPaymentProof?.status] || 'Não enviado'} />
              <Info label="Inscrição confirmada em" value={formatDateTime(selected.confirmedAt)} />
            </div>
          </div>

          {!selected.invoice && canManagePayments ? (
            <div className="premium-card mt-5 p-4">
              <h3 className="font-extrabold text-imetro-navy dark:text-white">Emitir cobrança da inscrição</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Info label="Valor oficial" value={money(catalog?.registrationFee || 0)} />
                <Field label="Vencimento"><input type="date" className="input-premium" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
                <Field label="Referência"><input className="input-premium" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Opcional" /></Field>
              </div>
              <button className="btn-primary mt-4" disabled={busy === 'invoice'} onClick={() => runAction('invoice', () => issueAdmissionInvoice(selected.id, { amount: catalog.registrationFee, dueDate, paymentReference: reference || null, provider: reference ? 'APPY_PAY_REFERENCE' : 'MANUAL_DCR' }), 'Cobrança oficial de inscrição emitida.')}>{busy === 'invoice' ? <Loader2 className="animate-spin" size={17} /> : <Banknote size={17} />} Emitir cobrança</button>
            </div>
          ) : null}

          {selected.latestPaymentProof?.status === 'PENDING_REVIEW' && canManagePayments ? (
            <div className="premium-card mt-5 p-4">
              <h3 className="font-extrabold text-imetro-navy dark:text-white">Comprovativo em análise</h3>
              <a href={selected.latestPaymentProof.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-[#3157D5]"><FileSearch size={17} /> Abrir comprovativo</a>
              <Field label="Observação"><textarea rows={3} className="input-premium mt-3" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} /></Field>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button className="btn-secondary text-red-600" disabled={busy === 'reject'} onClick={() => runAction('reject', () => rejectAdmissionPaymentProof(selected.latestPaymentProof.id, reviewerPayload({ reviewNote: reviewNote || 'Comprovativo rejeitado.' })), 'Comprovativo rejeitado.')}>Rejeitar</button>
                <button className="btn-primary bg-emerald-600" disabled={busy === 'approve'} onClick={() => runAction('approve', () => approveAdmissionPaymentProof(selected.latestPaymentProof.id, reviewerPayload()), 'Pagamento aprovado.')}>Aprovar pagamento</button>
              </div>
            </div>
          ) : null}

          {selected.invoice && ['PENDING', 'UNDER_REVIEW'].includes(selected.invoice.status) && !selected.latestPaymentProof && canManagePayments ? (
            <button className="btn-primary mt-5 bg-emerald-600" disabled={busy === 'confirm'} onClick={() => runAction('confirm', () => confirmAdmissionInvoicePayment(selected.invoice.id, reviewerPayload({ paymentMethod: 'REFERENCIA_OU_CONCILIACAO' })), 'Pagamento confirmado.')}>Confirmar pagamento</button>
          ) : null}

          {showEnrollmentChecklist ? (
            <AdmissionEnrollmentDocumentsPanel
              application={selected}
              user={user}
              canManage={canManageApplications}
              onApplicationChanged={load}
            />
          ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}

function Status({ status }) {
  return <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${STATUS_CLASS[status] || STATUS_CLASS.DRAFT}`}>{STATUS_LABELS[status] || status}</span>;
}

function Metric({ label, value, icon: Icon }) {
  return (
    <article className="premium-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.1em] text-slate-400">{label}</p>
          <p className="mt-2 break-words text-2xl font-extrabold text-imetro-navy dark:text-white">{value}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-[#0A8BD9] p-2.5 text-white shadow-sm ring-1 ring-white/10">
          <Icon size={20} strokeWidth={2.4} aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[.03]"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-extrabold text-slate-700 dark:text-white">{value || '-'}</p></div>;
}

function CompactInfo({ label, value }) {
  return <div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-0.5 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{value || '-'}</p></div>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-600 dark:text-slate-300">{label}</span>{children}</label>;
}

function Notice({ tone, icon: Icon, children }) {
  const style = tone === 'red'
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';
  return <div className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${style}`}><Icon size={18} />{children}</div>;
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4"><button className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label="Fechar" /><section className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl dark:bg-[#081321] sm:p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-extrabold text-imetro-navy dark:text-white">{title}</h2><button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X size={20} /></button></div>{children}</section></div>;
}

function Drawer({ title, subtitle, onClose, children }) {
  return <div className="fixed inset-0 z-[80] flex justify-end"><button className="absolute inset-0 bg-slate-950/55" onClick={onClose} aria-label="Fechar" /><aside className="relative h-full w-full overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#081321] sm:max-w-[720px] sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-extrabold uppercase tracking-[.14em] text-[#3157D5]">{subtitle}</p><h2 className="mt-1 truncate text-xl font-extrabold text-imetro-navy dark:text-white">{title}</h2></div><button onClick={onClose} className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X size={20} /></button></div><div className="mt-5">{children}</div></aside></div>;
}
