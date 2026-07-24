import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileSearch,
  GraduationCap,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { env } from '../config/env.js';
import { fetchCourses } from '../services/academicCatalogService.js';
import {
  approveAdmissionPaymentProof,
  confirmAdmissionInvoicePayment,
  createAdmissionApplication,
  createAdmissionLead,
  getAdmissionsDashboard,
  issueAdmissionInvoice,
  listAdmissionApplications,
  listAdmissionLeads,
  rejectAdmissionPaymentProof,
  updateAdmissionApplicationStatus,
  updateAdmissionLeadStatus,
} from '../services/admissionsService.js';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';

const LEAD_STATUSES = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  APPLICATION_STARTED: 'Ficha iniciada',
  APPLICATION_SUBMITTED: 'Ficha submetida',
  CONVERTED_TO_APPLICANT: 'Convertido em candidato',
  NO_RESPONSE: 'Sem resposta',
  WITHDREW: 'Desistiu',
  NOT_ELIGIBLE: 'Não elegível',
  OPTED_OUT: 'Não deseja mensagens',
};

const APPLICATION_STATUSES = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Submetida',
  DOCUMENTATION_PENDING: 'Documentação pendente',
  AWAITING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_UNDER_REVIEW: 'Pagamento em análise',
  PAID: 'Paga',
  CONFIRMED: 'Confirmada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

const STATUS_TONES = {
  NEW: 'slate',
  CONTACTED: 'blue',
  APPLICATION_STARTED: 'violet',
  APPLICATION_SUBMITTED: 'indigo',
  CONVERTED_TO_APPLICANT: 'emerald',
  NO_RESPONSE: 'amber',
  WITHDREW: 'red',
  NOT_ELIGIBLE: 'red',
  OPTED_OUT: 'slate',
  DRAFT: 'slate',
  SUBMITTED: 'blue',
  DOCUMENTATION_PENDING: 'amber',
  AWAITING_PAYMENT: 'orange',
  PAYMENT_UNDER_REVIEW: 'violet',
  PAID: 'emerald',
  CONFIRMED: 'green',
  REJECTED: 'red',
  CANCELLED: 'slate',
  EXPIRED: 'red',
};

const SHIFTS = [
  ['MORNING', 'Manhã'],
  ['AFTERNOON', 'Tarde'],
  ['EVENING', 'Fim da tarde'],
  ['NIGHT', 'Noite'],
  ['WEEKEND', 'Fim de semana'],
];

const EMPTY_LEAD = {
  fullName: '', phone: '', whatsapp: '', email: '', documentNumber: '', desiredCourseId: '', desiredShift: 'NIGHT', province: '', municipality: '', leadSource: 'WHATSAPP', consentGiven: true, notes: '',
};

const EMPTY_APPLICATION = {
  leadId: '', desiredCourseId: '', desiredShift: 'NIGHT', academicYear: '2026/2027', fullName: '', documentType: 'BI', documentNumber: '', birthDate: '', phone: '', whatsapp: '', email: '', previousSchool: '', province: '', municipality: '', documentsComplete: false, termsAccepted: true, notes: '',
};

function datePlusDays(days) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function money(value, currency = 'AOA') {
  if (value === null || value === undefined) return '-';
  const formatted = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
  return `${formatted} ${currency === 'AOA' ? 'Kz' : currency}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function shiftLabel(value) {
  return SHIFTS.find(([key]) => key === value)?.[1] || value || '-';
}

export default function AdmissionsPage() {
  const { user } = useAuth();
  const canManageLeads = can(user, 'manageAdmissionLeads');
  const canManageApplications = can(user, 'manageAdmissionApplications');
  const canManagePayments = can(user, 'manageAdmissionPayments');

  const [tab, setTab] = useState('APPLICATIONS');
  const [leads, setLeads] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [leadModal, setLeadModal] = useState(false);
  const [applicationModal, setApplicationModal] = useState(false);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD);
  const [applicationForm, setApplicationForm] = useState(EMPTY_APPLICATION);
  const [invoiceAmount, setInvoiceAmount] = useState('5000');
  const [invoiceDueDate, setInvoiceDueDate] = useState(datePlusDays(3));
  const [invoiceReference, setInvoiceReference] = useState('');
  const [reviewNote, setReviewNote] = useState('Pagamento da inscrição confirmado pela DCR.');

  async function load({ selectedId = null } = {}) {
    setLoading(true);
    setError('');
    try {
      const [leadRows, applicationRows, courseRows, dashboardData] = await Promise.all([
        listAdmissionLeads({ institutionId: env.institutionId }),
        listAdmissionApplications({ institutionId: env.institutionId }),
        fetchCourses(env.institutionId),
        getAdmissionsDashboard({ institutionId: env.institutionId }),
      ]);
      setLeads(leadRows);
      setApplications(applicationRows);
      setCourses(courseRows.filter((item) => item.active !== false));
      setDashboard(dashboardData);
      if (selectedId) {
        const refreshed = [...applicationRows, ...leadRows].find((item) => item.id === selectedId);
        if (refreshed) setSelected(refreshed);
      }
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível carregar o módulo de admissões.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelected(null);
        setLeadModal(false);
        setApplicationModal(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const filteredLeads = useMemo(() => leads.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.fullName || ''} ${item.whatsapp || ''} ${item.phone || ''} ${item.email || ''} ${item.documentNumber || ''} ${item.desiredCourseName || ''}`.toLowerCase();
    return (!term || searchable.includes(term))
      && (statusFilter === 'ALL' || item.status === statusFilter)
      && (!courseFilter || item.desiredCourseId === courseFilter)
      && (!shiftFilter || item.desiredShift === shiftFilter);
  }), [leads, query, statusFilter, courseFilter, shiftFilter]);

  const filteredApplications = useMemo(() => applications.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.applicationCode || ''} ${item.fullName || ''} ${item.documentNumber || ''} ${item.whatsapp || ''} ${item.phone || ''} ${item.desiredCourseName || ''}`.toLowerCase();
    return (!term || searchable.includes(term))
      && (statusFilter === 'ALL' || item.status === statusFilter)
      && (!courseFilter || item.desiredCourseId === courseFilter)
      && (!shiftFilter || item.desiredShift === shiftFilter);
  }), [applications, query, statusFilter, courseFilter, shiftFilter]);

  async function createLead(event) {
    event.preventDefault();
    if (!canManageLeads) return;
    setBusy('create-lead'); setError(''); setSuccess('');
    try {
      const created = await createAdmissionLead({
        ...leadForm,
        institutionId: env.institutionId,
        desiredCourseId: leadForm.desiredCourseId || null,
        phone: leadForm.phone || null,
        whatsapp: leadForm.whatsapp || null,
        email: leadForm.email || null,
        documentNumber: leadForm.documentNumber || null,
      });
      setLeadModal(false);
      setLeadForm(EMPTY_LEAD);
      setSelected(created);
      setTab('LEADS');
      setSuccess('Lead registado. A equipa de captação pode iniciar o acompanhamento.');
      await load({ selectedId: created.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível registar o lead.'));
    } finally { setBusy(''); }
  }

  function openApplicationFromLead(lead) {
    setApplicationForm({
      ...EMPTY_APPLICATION,
      leadId: lead.id,
      desiredCourseId: lead.desiredCourseId || '',
      desiredShift: lead.desiredShift || 'NIGHT',
      fullName: lead.fullName || '',
      documentNumber: lead.documentNumber || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || '',
      email: lead.email || '',
      province: lead.province || '',
      municipality: lead.municipality || '',
    });
    setApplicationModal(true);
  }

  async function createApplication(event) {
    event.preventDefault();
    if (!canManageApplications) return;
    setBusy('create-application'); setError(''); setSuccess('');
    try {
      const created = await createAdmissionApplication({
        ...applicationForm,
        institutionId: env.institutionId,
        leadId: applicationForm.leadId || null,
        birthDate: applicationForm.birthDate || null,
        phone: applicationForm.phone || null,
        whatsapp: applicationForm.whatsapp || null,
        email: applicationForm.email || null,
      });
      setApplicationModal(false);
      setApplicationForm(EMPTY_APPLICATION);
      setSelected(created);
      setTab('APPLICATIONS');
      setSuccess('Ficha de inscrição submetida. A cobrança da inscrição já pode ser emitida.');
      await load({ selectedId: created.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível criar a candidatura.'));
    } finally { setBusy(''); }
  }

  async function runAction(name, action, message) {
    if (!selected?.id) return;
    setBusy(name); setError(''); setSuccess('');
    try {
      const updated = await action();
      setSelected(updated);
      setSuccess(message);
      await load({ selectedId: updated.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível concluir a operação.'));
    } finally { setBusy(''); }
  }

  async function issueInvoice() {
    if (!selected?.id || !canManagePayments) return;
    await runAction(
      'invoice',
      () => issueAdmissionInvoice(selected.id, {
        amount: Number(invoiceAmount),
        dueDate: invoiceDueDate,
        paymentReference: invoiceReference || null,
        provider: invoiceReference ? 'APPY_PAY_REFERENCE' : 'MANUAL_DCR',
      }),
      'Cobrança da inscrição emitida. A candidatura aguarda pagamento.',
    );
  }

  function reviewerPayload(overrides = {}) {
    return {
      reviewedBy: user?.fullName || user?.name || user?.email || 'Utilizador institucional',
      reviewNote: reviewNote || null,
      paymentMethod: 'TRANSFERENCIA_BANCARIA',
      paymentReference: selected?.invoice?.paymentReference || null,
      provider: selected?.invoice?.provider || 'DCR_MANUAL',
      externalTransactionId: null,
      ...overrides,
    };
  }

  const visibleRows = tab === 'LEADS' ? filteredLeads : filteredApplications;
  const statusOptions = tab === 'LEADS' ? LEAD_STATUSES : APPLICATION_STATUSES;

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><GraduationCap size={14} /> Admissões e captação 2026/2027</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[32px]">Inscrições, candidatos e pagamentos</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Acompanhe os leads, a ficha de inscrição recebida pelo WhatsApp, a cobrança, a validação do pagamento e a confirmação por curso e turno.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => load()} disabled={loading || Boolean(busy)} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
            </button>
            {canManageLeads ? <button onClick={() => setLeadModal(true)} className="btn-light"><UserPlus size={17} /> Novo lead</button> : null}
            {canManageApplications ? <button onClick={() => setApplicationModal(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F4B400] px-4 py-2.5 text-xs font-extrabold text-[#10213A] shadow-lg"><Plus size={17} /> Nova inscrição</button> : null}
          </div>
        </div>
      </section>

      {error ? <Notice tone="red" icon={XCircle} text={error} /> : null}
      {success ? <Notice tone="green" icon={CheckCircle2} text={success} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Leads" value={dashboard?.totalLeads || leads.length} helper="Captação registada" icon={Megaphone} />
        <Metric label="Fichas submetidas" value={dashboard?.submittedApplications || 0} helper="Candidaturas recebidas" icon={ClipboardCheck} />
        <Metric label="Aguardando pagamento" value={dashboard?.awaitingPayment || 0} helper="Responsabilidade DCR" icon={Clock3} />
        <Metric label="Inscrições confirmadas" value={dashboard?.confirmedApplications || 0} helper={money(dashboard?.totalPaid || 0)} icon={BadgeCheck} />
      </section>

      <section className="premium-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[.04]">
            <TabButton active={tab === 'APPLICATIONS'} onClick={() => { setTab('APPLICATIONS'); setStatusFilter('ALL'); }} icon={GraduationCap} label="Candidaturas" />
            <TabButton active={tab === 'LEADS'} onClick={() => { setTab('LEADS'); setStatusFilter('ALL'); }} icon={Users} label="Leads" />
          </div>
          <div className="grid flex-1 gap-2 md:grid-cols-4 xl:max-w-[900px]">
            <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-premium pl-10" placeholder="Buscar nome, BI, telefone ou código..." /></div>
            <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="input-premium"><option value="">Todos os cursos</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
            <select value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value)} className="input-premium"><option value="">Todos os turnos</option>{SHIFTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-premium"><option value="ALL">Todos os estados</option>{Object.entries(statusOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500 dark:bg-white/[.03] dark:text-slate-400">
              <tr><th className="px-5 py-3">Candidato</th><th className="px-4 py-3">Curso e turno</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Pagamento</th><th className="px-4 py-3">Atualização</th><th className="px-5 py-3 text-right">Detalhe</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">
              {visibleRows.map((item) => <AdmissionRow key={item.id} item={item} lead={tab === 'LEADS'} onOpen={() => setSelected(item)} />)}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-4 lg:hidden">{visibleRows.map((item) => <AdmissionCard key={item.id} item={item} lead={tab === 'LEADS'} onOpen={() => setSelected(item)} />)}</div>
        {loading ? <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Carregando admissões...</div> : null}
        {!loading && visibleRows.length === 0 ? <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center"><FileSearch size={30} className="text-slate-300" /><h3 className="mt-3 text-base font-extrabold text-slate-700 dark:text-white">Nenhum registo encontrado</h3><p className="mt-1 text-sm font-semibold text-slate-400">Ajuste os filtros ou registe um novo lead/candidato.</p></div> : null}
      </section>

      {leadModal ? <LeadModal form={leadForm} setForm={setLeadForm} courses={courses} busy={busy} onClose={() => setLeadModal(false)} onSubmit={createLead} /> : null}
      {applicationModal ? <ApplicationModal form={applicationForm} setForm={setApplicationForm} courses={courses} busy={busy} onClose={() => setApplicationModal(false)} onSubmit={createApplication} /> : null}

      {selected ? (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button type="button" onClick={() => setSelected(null)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fechar detalhe" />
          <aside className="relative h-full w-full max-w-[720px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#081321]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#081321]/95">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#3157D5] dark:text-[#8EA9FF]">{selected.applicationCode || 'Lead de captação'}</p><h2 className="mt-1 text-xl font-extrabold text-imetro-navy dark:text-white">{selected.fullName}</h2><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{selected.documentNumber || selected.whatsapp || selected.phone || 'Contacto por completar'}</p></div><button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><X size={20} /></button></div>
            </div>
            <div className="space-y-5 p-5">
              <StatusBanner status={selected.status} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Curso" value={selected.desiredCourseName || 'A definir'} />
                <Info label="Turno" value={shiftLabel(selected.desiredShift)} />
                <Info label="WhatsApp" value={selected.whatsapp || '-'} />
                <Info label="E-mail" value={selected.email || '-'} />
                <Info label="Província" value={selected.province || '-'} />
                <Info label="Origem" value={selected.leadSource || 'Ficha de inscrição'} />
              </div>

              {!selected.applicationCode ? (
                <div className="premium-card p-4">
                  <h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Acompanhamento do lead</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Registe o contacto e converta o interesse numa ficha de inscrição.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {canManageLeads ? <button onClick={() => runAction('contact-lead', () => updateAdmissionLeadStatus(selected.id, 'CONTACTED', 'Contacto registado no painel de admissões.'), 'Lead marcado como contactado.')} className="btn-secondary" disabled={busy === 'contact-lead'}>{busy === 'contact-lead' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Marcar como contactado</button> : null}
                    {canManageApplications ? <button onClick={() => openApplicationFromLead(selected)} className="btn-primary"><GraduationCap size={16} /> Criar ficha de inscrição</button> : null}
                  </div>
                </div>
              ) : (
                <ApplicationActions
                  selected={selected}
                  busy={busy}
                  canManageApplications={canManageApplications}
                  canManagePayments={canManagePayments}
                  invoiceAmount={invoiceAmount}
                  setInvoiceAmount={setInvoiceAmount}
                  invoiceDueDate={invoiceDueDate}
                  setInvoiceDueDate={setInvoiceDueDate}
                  invoiceReference={invoiceReference}
                  setInvoiceReference={setInvoiceReference}
                  reviewNote={reviewNote}
                  setReviewNote={setReviewNote}
                  issueInvoice={issueInvoice}
                  runAction={runAction}
                  reviewerPayload={reviewerPayload}
                />
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationActions({ selected, busy, canManageApplications, canManagePayments, invoiceAmount, setInvoiceAmount, invoiceDueDate, setInvoiceDueDate, invoiceReference, setInvoiceReference, reviewNote, setReviewNote, issueInvoice, runAction, reviewerPayload }) {
  const proof = selected.latestPaymentProof;
  return <>
    <div className="premium-card p-4">
      <h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Situação financeira da inscrição</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Cobrança" value={selected.invoice?.invoiceCode || 'Ainda não emitida'} />
        <Info label="Valor" value={selected.invoice ? money(selected.invoice.amount, selected.invoice.currency) : '-'} />
        <Info label="Estado" value={selected.invoice?.status || 'Pendente de emissão'} />
        <Info label="Vencimento" value={selected.invoice?.dueDate || '-'} />
        <Info label="Referência" value={selected.invoice?.paymentReference || '-'} />
        <Info label="Pago em" value={formatDateTime(selected.invoice?.paidAt)} />
      </div>
    </div>

    {['SUBMITTED', 'DOCUMENTATION_PENDING'].includes(selected.status) && !selected.invoice && canManagePayments ? <div className="premium-card p-4"><h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Emitir cobrança da inscrição</h3><div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Valor (Kz)"><input type="number" min="1" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} className="input-premium" /></Field><Field label="Vencimento"><input type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} className="input-premium" /></Field><Field label="Referência AppyPay"><input value={invoiceReference} onChange={(event) => setInvoiceReference(event.target.value)} className="input-premium" placeholder="Opcional nesta fase" /></Field></div><button onClick={issueInvoice} disabled={busy === 'invoice'} className="btn-primary mt-4">{busy === 'invoice' ? <Loader2 className="animate-spin" size={17} /> : <Banknote size={17} />} Emitir cobrança</button></div> : null}

    {proof?.status === 'PENDING_REVIEW' && canManagePayments ? <div className="premium-card p-4"><h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Comprovativo aguardando análise</h3><a href={proof.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#3157D5]"><FileSearch size={17} /> Abrir comprovativo</a><Field label="Observação da DCR"><textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="input-premium mt-3 resize-y" /></Field><div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={() => runAction('reject-proof', () => rejectAdmissionPaymentProof(proof.id, reviewerPayload({ reviewNote: reviewNote || 'Comprovativo rejeitado pela DCR.' })), 'Comprovativo rejeitado. A candidatura voltou a aguardar pagamento.')} disabled={busy === 'reject-proof'} className="btn-secondary border-red-200 text-red-600 dark:border-red-500/20 dark:text-red-300">{busy === 'reject-proof' ? <Loader2 className="animate-spin" size={17} /> : <XCircle size={17} />} Rejeitar</button><button onClick={() => runAction('approve-proof', () => approveAdmissionPaymentProof(proof.id, reviewerPayload()), 'Pagamento aprovado. A inscrição foi atualizada conforme a situação documental.')} disabled={busy === 'approve-proof'} className="btn-primary bg-emerald-600">{busy === 'approve-proof' ? <Loader2 className="animate-spin" size={17} /> : <BadgeCheck size={17} />} Aprovar pagamento</button></div></div> : null}

    {selected.invoice && ['PENDING', 'UNDER_REVIEW'].includes(selected.invoice.status) && !proof && canManagePayments ? <div className="premium-card p-4"><h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Confirmação por referência ou reconciliação</h3><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Use quando o pagamento chegar por referência/callback ou for conciliado diretamente pela DCR.</p><Field label="Observação"><textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="input-premium mt-3 resize-y" /></Field><button onClick={() => runAction('confirm-payment', () => confirmAdmissionInvoicePayment(selected.invoice.id, reviewerPayload({ paymentMethod: 'REFERENCIA_OU_CONCILIACAO' })), 'Pagamento confirmado e candidatura atualizada.')} disabled={busy === 'confirm-payment'} className="btn-primary mt-4 bg-emerald-600">{busy === 'confirm-payment' ? <Loader2 className="animate-spin" size={17} /> : <BadgeCheck size={17} />} Confirmar pagamento</button></div> : null}

    {selected.status === 'DOCUMENTATION_PENDING' && canManageApplications ? <div className="premium-card p-4"><h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Documentação pendente</h3><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">O pagamento já está confirmado, mas a equipa de Admissões deve validar os documentos antes da confirmação final.</p><button onClick={() => runAction('confirm-application', () => updateAdmissionApplicationStatus(selected.id, { status: 'CONFIRMED', notes: 'Documentação validada pela equipa de Admissões.' }), 'Inscrição confirmada e pronta para a próxima etapa institucional.')} disabled={busy === 'confirm-application'} className="btn-primary mt-4">{busy === 'confirm-application' ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />} Confirmar inscrição</button></div> : null}
  </>;
}

function LeadModal({ form, setForm, courses, busy, onClose, onSubmit }) {
  return <Modal title="Novo lead" subtitle="Captação por WhatsApp, campanha ou atendimento" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome completo"><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="input-premium" /></Field><Field label="WhatsApp"><input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="input-premium" placeholder="+244..." /></Field><Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-premium" /></Field><Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-premium" /></Field><Field label="BI/Passaporte"><input value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} className="input-premium" /></Field><Field label="Curso pretendido"><select value={form.desiredCourseId} onChange={(event) => setForm({ ...form, desiredCourseId: event.target.value })} className="input-premium"><option value="">A definir</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></Field><Field label="Turno"><select value={form.desiredShift} onChange={(event) => setForm({ ...form, desiredShift: event.target.value })} className="input-premium">{SHIFTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Origem"><select value={form.leadSource} onChange={(event) => setForm({ ...form, leadSource: event.target.value })} className="input-premium"><option value="WHATSAPP">WhatsApp</option><option value="CAMPAIGN">Campanha</option><option value="WEBSITE">Site</option><option value="REFERRAL">Indicação</option><option value="IN_PERSON">Presencial</option></select></Field><Field label="Província"><input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="input-premium" /></Field><Field label="Município"><input value={form.municipality} onChange={(event) => setForm({ ...form, municipality: event.target.value })} className="input-premium" /></Field></div><Field label="Observações"><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="input-premium resize-y" /></Field><label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.consentGiven} onChange={(event) => setForm({ ...form, consentGiven: event.target.checked })} /> Consentimento para contacto registado</label><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button disabled={busy === 'create-lead'} className="btn-primary">{busy === 'create-lead' ? <Loader2 className="animate-spin" size={17} /> : <UserPlus size={17} />} Registar lead</button></div></form></Modal>;
}

function ApplicationModal({ form, setForm, courses, busy, onClose, onSubmit }) {
  return <Modal title="Ficha de inscrição" subtitle="Candidato ainda não é criado como estudante definitivo" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome completo"><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="input-premium" /></Field><Field label="BI/Passaporte"><input required value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} className="input-premium" /></Field><Field label="Curso"><select required value={form.desiredCourseId} onChange={(event) => setForm({ ...form, desiredCourseId: event.target.value })} className="input-premium"><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></Field><Field label="Turno"><select value={form.desiredShift} onChange={(event) => setForm({ ...form, desiredShift: event.target.value })} className="input-premium">{SHIFTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Ano académico"><input required value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} className="input-premium" /></Field><Field label="Data de nascimento"><input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} className="input-premium" /></Field><Field label="WhatsApp"><input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="input-premium" /></Field><Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-premium" /></Field><Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-premium" /></Field><Field label="Escola anterior"><input value={form.previousSchool} onChange={(event) => setForm({ ...form, previousSchool: event.target.value })} className="input-premium" /></Field><Field label="Província"><input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="input-premium" /></Field><Field label="Município"><input value={form.municipality} onChange={(event) => setForm({ ...form, municipality: event.target.value })} className="input-premium" /></Field></div><Field label="Observações"><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="input-premium resize-y" /></Field><div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.documentsComplete} onChange={(event) => setForm({ ...form, documentsComplete: event.target.checked })} /> Documentos completos</label><label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => setForm({ ...form, termsAccepted: event.target.checked })} /> Termos aceites</label></div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button disabled={busy === 'create-application'} className="btn-primary">{busy === 'create-application' ? <Loader2 className="animate-spin" size={17} /> : <GraduationCap size={17} />} Submeter ficha</button></div></form></Modal>;
}

function AdmissionRow({ item, lead, onOpen }) {
  return <tr className="text-sm hover:bg-slate-50/80 dark:hover:bg-white/[.03]"><td className="px-5 py-4"><p className="text-xs font-extrabold text-[#3157D5]">{item.applicationCode || 'LEAD'}</p><p className="mt-1 font-extrabold text-slate-800 dark:text-white">{item.fullName}</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{item.documentNumber || item.whatsapp || item.phone || '-'}</p></td><td className="px-4 py-4"><p className="font-bold text-slate-700 dark:text-slate-200">{item.desiredCourseName || 'A definir'}</p><p className="mt-1 text-xs font-semibold text-slate-400">{shiftLabel(item.desiredShift)}</p></td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4"><p className="font-bold text-slate-700 dark:text-slate-200">{lead ? 'Ainda sem cobrança' : item.invoice?.status || 'Não emitida'}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.invoice ? money(item.invoice.amount, item.invoice.currency) : '-'}</p></td><td className="px-4 py-4 text-xs font-semibold text-slate-500">{formatDateTime(item.updatedAt)}</td><td className="px-5 py-4 text-right"><button onClick={onOpen} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-[#3157D5] dark:border-white/10">Abrir</button></td></tr>;
}

function AdmissionCard({ item, lead, onOpen }) {
  return <button onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-white/10 dark:bg-[#0D1B2E]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-[#3157D5]">{item.applicationCode || 'LEAD'}</p><h3 className="mt-1 font-extrabold text-slate-900 dark:text-white">{item.fullName}</h3><p className="mt-1 text-xs font-semibold text-slate-400">{item.desiredCourseName || 'Curso a definir'} · {shiftLabel(item.desiredShift)}</p></div><StatusBadge status={item.status} /></div><p className="mt-3 text-xs font-bold text-slate-500">{lead ? 'Captação' : item.invoice?.status || 'Cobrança não emitida'}</p></button>;
}

function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || 'slate';
  const label = LEAD_STATUSES[status] || APPLICATION_STATUSES[status] || status || 'Sem estado';
  const classes = { slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300', emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', green: 'bg-green-500/10 text-green-700 dark:text-green-300', amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', red: 'bg-red-500/10 text-red-700 dark:text-red-300' };
  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${classes[tone]}`}>{label}</span>;
}

function StatusBanner({ status }) {
  return <div className="rounded-2xl border border-[#3157D5]/20 bg-[#3157D5]/5 p-4 dark:bg-[#3157D5]/10"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3157D5] text-white"><ClipboardCheck size={19} /></div><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#3157D5]">Estado atual</p><p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-white">{LEAD_STATUSES[status] || APPLICATION_STATUSES[status] || status}</p></div></div></div>;
}

function Metric({ label, value, helper, icon: Icon }) { return <div className="premium-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3157D5] dark:bg-blue-500/10 dark:text-blue-300"><Icon size={22} /></div></div></div>; }
function Notice({ tone, icon: Icon, text }) { return <div className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${tone === 'green' ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200' : 'border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-200'}`}><Icon size={18} />{text}</div>; }
function TabButton({ active, onClick, icon: Icon, label }) { return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold ${active ? 'bg-white text-[#3157D5] shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><Icon size={15} />{label}</button>; }
function Field({ label, children }) { return <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>{children}</label>; }
function Info({ label, value }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[.04]"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-bold text-slate-700 dark:text-slate-200">{value}</p></div>; }
function Modal({ title, subtitle, onClose, children }) { return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2E]"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p></div><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X size={18} /></button></div>{children}</div></div>; }
