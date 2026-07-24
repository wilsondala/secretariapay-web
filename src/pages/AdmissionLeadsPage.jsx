import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Megaphone,
  PhoneCall,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { env } from '../config/env.js';
import {
  createAdmissionApplication,
  createAdmissionLead,
  getAdmissionsDashboard,
  getOfficialAdmissionsCatalog,
  listAdmissionLeads,
  updateAdmissionLeadStatus,
} from '../services/admissionsService.js';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';

const LEAD_STATUS_LABELS = {
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

const LEAD_STATUS_CLASS = {
  NEW: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  CONTACTED: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  APPLICATION_STARTED: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  APPLICATION_SUBMITTED: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  CONVERTED_TO_APPLICANT: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  NO_RESPONSE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  WITHDREW: 'bg-red-500/10 text-red-700 dark:text-red-300',
  NOT_ELIGIBLE: 'bg-red-500/10 text-red-700 dark:text-red-300',
  OPTED_OUT: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

const EMPTY_LEAD = {
  fullName: '',
  phone: '',
  whatsapp: '',
  email: '',
  documentNumber: '',
  desiredCourseId: '',
  desiredShift: '',
  province: 'Luanda',
  municipality: '',
  leadSource: 'WHATSAPP',
  consentGiven: true,
  notes: '',
};

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
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

function money(value, currency = 'AOA') {
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  return `${formatted} ${currency === 'AOA' ? 'Kz' : currency}`;
}

export default function AdmissionLeadsPage() {
  const { user } = useAuth();
  const canManageLeads = can(user, 'manageAdmissionLeads');
  const canManageApplications = can(user, 'manageAdmissionApplications');

  const [catalog, setCatalog] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [leadModal, setLeadModal] = useState(false);
  const [conversionModal, setConversionModal] = useState(false);
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD);
  const [applicationForm, setApplicationForm] = useState(null);

  const courses = useMemo(
    () => (catalog?.departments || []).flatMap((department) =>
      department.courses.map((course) => ({
        id: course.courseId,
        code: course.courseCode,
        name: course.courseName,
        shifts: course.shifts || [],
      }))),
    [catalog],
  );

  const shifts = useMemo(() => {
    const values = new Map();
    courses.forEach((course) => course.shifts.forEach((shift) => values.set(shift.code, shift.label)));
    return [...values.entries()].map(([code, label]) => ({ code, label }));
  }, [courses]);

  async function load(selectedId = null) {
    setLoading(true);
    setError('');
    try {
      const [catalogData, leadRows, dashboardData] = await Promise.all([
        getOfficialAdmissionsCatalog(env.institutionId),
        listAdmissionLeads({ institutionId: env.institutionId }),
        getAdmissionsDashboard({ institutionId: env.institutionId }),
      ]);
      setCatalog(catalogData);
      setLeads(leadRows);
      setDashboard(dashboardData);
      if (selectedId) {
        const refreshed = leadRows.find((item) => item.id === selectedId);
        if (refreshed) setSelected(refreshed);
      }
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível carregar a captação e os leads.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => leads.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.fullName || ''} ${item.whatsapp || ''} ${item.phone || ''} ${item.email || ''} ${item.documentNumber || ''} ${item.desiredCourseName || ''}`.toLowerCase();
    return (!term || searchable.includes(term))
      && (!statusFilter || item.status === statusFilter)
      && (!courseFilter || item.desiredCourseId === courseFilter)
      && (!shiftFilter || item.desiredShift === shiftFilter);
  }), [leads, query, statusFilter, courseFilter, shiftFilter]);

  async function submitLead(event) {
    event.preventDefault();
    if (!canManageLeads) return;
    setBusy('create-lead');
    setError('');
    setSuccess('');
    try {
      const created = await createAdmissionLead({
        ...leadForm,
        institutionId: env.institutionId,
        desiredCourseId: leadForm.desiredCourseId || null,
        desiredShift: leadForm.desiredCourseId ? leadForm.desiredShift || null : null,
        phone: leadForm.phone || null,
        whatsapp: leadForm.whatsapp || null,
        email: leadForm.email || null,
        documentNumber: leadForm.documentNumber || null,
      });
      setLeadModal(false);
      setLeadForm(EMPTY_LEAD);
      setSelected(created);
      setSuccess('Lead registado na campanha oficial 2026/2027.');
      await load(created.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível registar o lead.'));
    } finally {
      setBusy('');
    }
  }

  async function changeStatus(status, notes, message) {
    if (!selected?.id || !canManageLeads) return;
    setBusy(`status-${status}`);
    setError('');
    setSuccess('');
    try {
      const updated = await updateAdmissionLeadStatus(selected.id, status, notes);
      setSelected(updated);
      setSuccess(message);
      await load(updated.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível atualizar o lead.'));
    } finally {
      setBusy('');
    }
  }

  function openConversion(lead) {
    const course = courses.find((item) => item.id === lead.desiredCourseId) || courses[0];
    const desiredShift = lead.desiredShift || course?.shifts?.[0]?.code || '';
    setApplicationForm({
      leadId: lead.id,
      desiredCourseId: lead.desiredCourseId || course?.id || '',
      desiredShift,
      academicYear: catalog?.academicYear || '2026/2027',
      fullName: lead.fullName || '',
      documentType: 'BI',
      documentNumber: lead.documentNumber || '',
      birthDate: '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || '',
      email: lead.email || '',
      previousSchool: '',
      province: lead.province || 'Luanda',
      municipality: lead.municipality || '',
      documentsComplete: false,
      termsAccepted: true,
      notes: lead.notes || '',
    });
    setConversionModal(true);
  }

  async function convertLead(event) {
    event.preventDefault();
    if (!canManageApplications || !applicationForm) return;
    setBusy('convert-lead');
    setError('');
    setSuccess('');
    try {
      await createAdmissionApplication({
        ...applicationForm,
        institutionId: env.institutionId,
        birthDate: applicationForm.birthDate || null,
        phone: applicationForm.phone || null,
        whatsapp: applicationForm.whatsapp || null,
        email: applicationForm.email || null,
      });
      setConversionModal(false);
      setApplicationForm(null);
      setSuccess('Lead convertido em candidatura oficial. A ficha já aparece em Inscrições 2026/2027.');
      await load(selected?.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível converter o lead em candidatura.'));
    } finally {
      setBusy('');
    }
  }

  const newLeads = leads.filter((item) => item.status === 'NEW').length;
  const contactedLeads = Number(dashboard?.contactedLeads || leads.filter((item) => item.status === 'CONTACTED').length);
  const convertedLeads = leads.filter((item) => item.status === 'CONVERTED_TO_APPLICANT').length;

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><Megaphone size={14} /> Captação oficial IMETRO</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[32px]">Captação e leads 2026/2027</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Registo de interessados, acompanhamento de contacto e conversão controlada em candidatura oficial.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admissions" className="btn-light"><ArrowLeft size={17} /> Inscrições oficiais</Link>
            <button onClick={() => load(selected?.id)} disabled={loading || Boolean(busy)} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
            </button>
            {canManageLeads ? <button onClick={() => setLeadModal(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F4B400] px-4 py-2.5 text-xs font-extrabold text-[#10213A] shadow-lg"><UserPlus size={17} /> Novo lead</button> : null}
          </div>
        </div>
      </section>

      {error ? <Notice tone="red" icon={XCircle}>{error}</Notice> : null}
      {success ? <Notice tone="green" icon={CheckCircle2}>{success}</Notice> : null}

      {catalog ? (
        <section className="premium-card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Info label="Ano académico" value={catalog.academicYear} />
          <Info label="Período" value={`${formatDate(catalog.registrationStart)} a ${formatDate(catalog.registrationEnd)}`} />
          <Info label="Taxa de inscrição" value={money(catalog.registrationFee, catalog.currency)} />
          <Info label="Cursos/turnos" value={`${courses.length} cursos · ${shifts.length} turnos`} />
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total de leads" value={dashboard?.totalLeads ?? leads.length} helper="Captação registada" icon={Users} />
        <Metric label="Novos" value={newLeads} helper="Aguardando primeiro contacto" icon={Clock3} />
        <Metric label="Contactados" value={contactedLeads} helper="Acompanhamento iniciado" icon={PhoneCall} />
        <Metric label="Convertidos" value={convertedLeads} helper="Candidaturas criadas" icon={UserCheck} />
      </section>

      <section className="premium-card overflow-hidden">
        <div className="grid gap-2 border-b border-slate-200 p-4 dark:border-white/10 md:grid-cols-4">
          <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-premium pl-10" placeholder="Buscar nome, BI ou contacto..." /></div>
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="input-premium"><option value="">Todos os cursos</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
          <select value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value)} className="input-premium"><option value="">Todos os turnos</option>{shifts.map((shift) => <option key={shift.code} value={shift.code}>{shift.label}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-premium"><option value="">Todos os estados</option>{Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500 dark:bg-white/[.03] dark:text-slate-400">
              <tr><th className="px-5 py-3">Interessado</th><th className="px-4 py-3">Curso e turno</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Atualização</th><th className="px-5 py-3 text-right">Detalhe</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">
              {filtered.map((lead) => <LeadRow key={lead.id} lead={lead} onOpen={() => setSelected(lead)} />)}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {filtered.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={() => setSelected(lead)} />)}
        </div>

        {loading ? <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Carregando leads...</div> : null}
        {!loading && filtered.length === 0 ? <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center"><Megaphone size={30} className="text-slate-300" /><h3 className="mt-3 text-base font-extrabold text-slate-700 dark:text-white">Nenhum lead encontrado</h3><p className="mt-1 text-sm font-semibold text-slate-400">Ajuste os filtros ou registe um novo interessado.</p></div> : null}
      </section>

      {leadModal ? <LeadModal form={leadForm} setForm={setLeadForm} courses={courses} busy={busy} onClose={() => setLeadModal(false)} onSubmit={submitLead} /> : null}
      {conversionModal && applicationForm ? <ConversionModal form={applicationForm} setForm={setApplicationForm} courses={courses} busy={busy} onClose={() => setConversionModal(false)} onSubmit={convertLead} /> : null}

      {selected ? (
        <Drawer title={selected.fullName} subtitle="Lead de captação" onClose={() => setSelected(null)}>
          <div className="flex flex-wrap items-center gap-2"><Status status={selected.status} /><span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300">{selected.leadSource || 'Origem não informada'}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="WhatsApp" value={selected.whatsapp || '-'} />
            <Info label="Telefone" value={selected.phone || '-'} />
            <Info label="E-mail" value={selected.email || '-'} />
            <Info label="BI/Passaporte" value={selected.documentNumber || '-'} />
            <Info label="Curso pretendido" value={selected.desiredCourseName || 'A definir'} />
            <Info label="Turno" value={shifts.find((shift) => shift.code === selected.desiredShift)?.label || selected.desiredShift || 'A definir'} />
            <Info label="Último contacto" value={formatDateTime(selected.lastContactAt)} />
            <Info label="Criado em" value={formatDateTime(selected.createdAt)} />
          </div>
          {selected.notes ? <div className="premium-card mt-4 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Observações</p><p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{selected.notes}</p></div> : null}
          {canManageLeads && selected.status !== 'CONVERTED_TO_APPLICANT' ? (
            <div className="premium-card mt-5 p-4">
              <h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Acompanhamento da captação</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button onClick={() => changeStatus('CONTACTED', 'Contacto registado pela equipa de captação.', 'Lead marcado como contactado.')} disabled={Boolean(busy)} className="btn-primary"><PhoneCall size={16} /> Marcar contactado</button>
                <button onClick={() => changeStatus('NO_RESPONSE', 'Tentativa de contacto sem resposta.', 'Lead marcado como sem resposta.')} disabled={Boolean(busy)} className="btn-secondary"><Clock3 size={16} /> Sem resposta</button>
                <button onClick={() => changeStatus('WITHDREW', 'Interessado desistiu do processo.', 'Lead marcado como desistente.')} disabled={Boolean(busy)} className="btn-secondary border-red-200 text-red-600 dark:border-red-500/20 dark:text-red-300"><XCircle size={16} /> Registar desistência</button>
                {canManageApplications ? <button onClick={() => openConversion(selected)} disabled={Boolean(busy)} className="btn-primary bg-emerald-600"><GraduationCap size={16} /> Criar candidatura</button> : null}
              </div>
            </div>
          ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}

function LeadRow({ lead, onOpen }) {
  return <tr className="text-sm hover:bg-slate-50/80 dark:hover:bg-white/[.03]"><td className="px-5 py-4"><p className="font-extrabold text-slate-800 dark:text-white">{lead.fullName}</p><p className="mt-1 text-xs font-semibold text-slate-400">{lead.documentNumber || lead.whatsapp || lead.phone || '-'}</p></td><td className="px-4 py-4"><p className="font-bold text-slate-700 dark:text-slate-200">{lead.desiredCourseName || 'A definir'}</p><p className="mt-1 text-xs font-semibold text-slate-400">{lead.desiredShift || 'Turno a definir'}</p></td><td className="px-4 py-4 text-xs font-bold text-slate-500">{lead.leadSource || '-'}</td><td className="px-4 py-4"><Status status={lead.status} /></td><td className="px-4 py-4 text-xs font-semibold text-slate-500">{formatDateTime(lead.updatedAt)}</td><td className="px-5 py-4 text-right"><button onClick={onOpen} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-[#3157D5] dark:border-white/10">Abrir</button></td></tr>;
}

function LeadCard({ lead, onOpen }) {
  return <button type="button" onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{lead.fullName}</h3><p className="mt-1 truncate text-xs font-semibold text-slate-400">{lead.desiredCourseName || 'Curso a definir'} · {lead.desiredShift || 'Turno a definir'}</p></div><Status status={lead.status} /></div><p className="mt-3 text-xs font-bold text-slate-500">{lead.whatsapp || lead.phone || lead.email || 'Contacto por completar'}</p></button>;
}

function Status({ status }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${LEAD_STATUS_CLASS[status] || LEAD_STATUS_CLASS.NEW}`}>{LEAD_STATUS_LABELS[status] || status || '-'}</span>;
}

function Metric({ label, value, helper, icon: Icon }) {
  return <div className="premium-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3157D5] dark:bg-blue-500/10 dark:text-blue-300"><Icon size={22} /></div></div></div>;
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[.04]"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-bold text-slate-700 dark:text-slate-200">{value || '-'}</p></div>;
}

function Notice({ tone, icon: Icon, children }) {
  return <div className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${tone === 'green' ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200' : 'border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-200'}`}><Icon size={18} />{children}</div>;
}

function Field({ label, children }) {
  return <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>{children}</label>;
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2E]"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p></div><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X size={18} /></button></div>{children}</div></div>;
}

function Drawer({ title, subtitle, onClose, children }) {
  return <div className="fixed inset-0 z-[90] flex justify-end"><button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Fechar detalhes" /><aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#081321] sm:p-6"><div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10"><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#3157D5]">{subtitle}</p><h2 className="mt-1 text-xl font-extrabold text-imetro-navy dark:text-white">{title}</h2></div><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 dark:border-white/10"><X size={18} /></button></div><div className="pt-5">{children}</div></aside></div>;
}

function LeadModal({ form, setForm, courses, busy, onClose, onSubmit }) {
  const selectedCourse = courses.find((course) => course.id === form.desiredCourseId);
  return <Modal title="Novo lead" subtitle="Captação por WhatsApp, campanha, site ou atendimento presencial" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome completo"><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="input-premium" /></Field><Field label="WhatsApp"><input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="input-premium" placeholder="+244..." /></Field><Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-premium" /></Field><Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-premium" /></Field><Field label="BI/Passaporte"><input value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} className="input-premium" /></Field><Field label="Curso pretendido"><select value={form.desiredCourseId} onChange={(event) => { const course = courses.find((item) => item.id === event.target.value); setForm({ ...form, desiredCourseId: event.target.value, desiredShift: course?.shifts?.[0]?.code || '' }); }} className="input-premium"><option value="">A definir</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></Field><Field label="Turno"><select disabled={!selectedCourse} value={form.desiredShift} onChange={(event) => setForm({ ...form, desiredShift: event.target.value })} className="input-premium"><option value="">A definir</option>{(selectedCourse?.shifts || []).map((shift) => <option key={shift.code} value={shift.code}>{shift.label}</option>)}</select></Field><Field label="Origem"><select value={form.leadSource} onChange={(event) => setForm({ ...form, leadSource: event.target.value })} className="input-premium"><option value="WHATSAPP">WhatsApp</option><option value="CAMPAIGN">Campanha</option><option value="WEBSITE">Site</option><option value="REFERRAL">Indicação</option><option value="IN_PERSON">Presencial</option></select></Field><Field label="Província"><input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="input-premium" /></Field><Field label="Município"><input value={form.municipality} onChange={(event) => setForm({ ...form, municipality: event.target.value })} className="input-premium" /></Field></div><Field label="Observações"><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="input-premium resize-y" /></Field><label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.consentGiven} onChange={(event) => setForm({ ...form, consentGiven: event.target.checked })} /> Consentimento para contacto registado</label><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button disabled={busy === 'create-lead'} className="btn-primary">{busy === 'create-lead' ? <Loader2 className="animate-spin" size={17} /> : <UserPlus size={17} />} Registar lead</button></div></form></Modal>;
}

function ConversionModal({ form, setForm, courses, busy, onClose, onSubmit }) {
  const selectedCourse = courses.find((course) => course.id === form.desiredCourseId);
  return <Modal title="Converter em candidatura" subtitle="A candidatura será criada na campanha oficial e continuará sem estudante definitivo até ao pagamento da matrícula" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome completo"><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="input-premium" /></Field><Field label="BI/Passaporte"><input required value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} className="input-premium" /></Field><Field label="Curso"><select required value={form.desiredCourseId} onChange={(event) => { const course = courses.find((item) => item.id === event.target.value); setForm({ ...form, desiredCourseId: event.target.value, desiredShift: course?.shifts?.[0]?.code || '' }); }} className="input-premium"><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></Field><Field label="Turno"><select required value={form.desiredShift} onChange={(event) => setForm({ ...form, desiredShift: event.target.value })} className="input-premium"><option value="">Selecione</option>{(selectedCourse?.shifts || []).map((shift) => <option key={shift.code} value={shift.code}>{shift.label}</option>)}</select></Field><Field label="Ano académico"><input readOnly value={form.academicYear} className="input-premium" /></Field><Field label="Data de nascimento"><input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} className="input-premium" /></Field><Field label="WhatsApp"><input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="input-premium" /></Field><Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-premium" /></Field><Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-premium" /></Field><Field label="Escola anterior"><input value={form.previousSchool} onChange={(event) => setForm({ ...form, previousSchool: event.target.value })} className="input-premium" /></Field></div><Field label="Observações"><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="input-premium resize-y" /></Field><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button disabled={busy === 'convert-lead'} className="btn-primary bg-emerald-600">{busy === 'convert-lead' ? <Loader2 className="animate-spin" size={17} /> : <GraduationCap size={17} />} Criar candidatura</button></div></form></Modal>;
}
