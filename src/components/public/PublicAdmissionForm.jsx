import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileCheck2,
  Loader2,
  Send,
  X,
} from 'lucide-react';
import { createPublicAdmissionApplication } from '../../services/admissionsService.js';
import PublicAdmissionPaymentPanel from './PublicAdmissionPaymentPanel.jsx';

const INITIAL_FORM = {
  fullName: '',
  documentType: 'BI',
  documentNumber: '',
  birthDate: '',
  phone: '',
  whatsapp: '',
  email: '',
  previousSchool: '',
  province: '',
  municipality: '',
  desiredCourseId: '',
  desiredShift: '',
  termsAccepted: false,
};

function readError(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'Não foi possível submeter a candidatura.';
}

const fieldClass = 'mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#071A35] outline-none transition placeholder:text-slate-400 focus:border-[#1194DD] focus:ring-4 focus:ring-[#1194DD]/10 disabled:cursor-not-allowed disabled:bg-slate-100';
const labelClass = 'text-xs font-extrabold uppercase tracking-[.1em] text-slate-500';

export default function PublicAdmissionForm({ catalog, courses, canSubmit, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.courseId === form.desiredCourseId),
    [courses, form.desiredCourseId],
  );

  const shifts = selectedCourse?.shifts || [];

  useEffect(() => {
    if (!application) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById('ficha-inscricao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [application]);

  function setField(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'desiredCourseId') next.desiredShift = '';
      return next;
    });
  }

  function fillTestForm() {
    const testCourse = courses.find((course) => /arquitectura/i.test(course.courseName || '')) || courses[0];
    const testShift = testCourse?.shifts?.find((shift) => ['MANHA', 'MANHÃ'].includes(String(shift.code || '').toUpperCase()))
      || testCourse?.shifts?.[0];
    const suffix = Date.now().toString().slice(-6);
    const phoneSuffix = suffix.slice(-3);

    setError('');
    setForm({
      fullName: `Candidato Teste ${suffix}`,
      documentType: 'BI',
      documentNumber: `TESTE-PORTAL-${suffix}`,
      birthDate: '2002-05-18',
      phone: `+244 923 100 ${phoneSuffix}`,
      whatsapp: `+244 923 200 ${phoneSuffix}`,
      email: `candidato.teste.${suffix}@example.com`,
      previousSchool: 'Complexo Escolar de Teste',
      province: 'Luanda',
      municipality: 'Talatona',
      desiredCourseId: testCourse?.courseId || '',
      desiredShift: testShift?.code || '',
      termsAccepted: true,
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('A candidatura pública só pode ser enviada durante o período oficial de inscrições.');
      return;
    }
    if (!form.termsAccepted) {
      setError('É necessário aceitar os termos de candidatura para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createPublicAdmissionApplication({
        institutionId: catalog.institutionId,
        leadId: null,
        desiredCourseId: form.desiredCourseId,
        desiredShift: form.desiredShift,
        academicYear: catalog.academicYear,
        fullName: form.fullName.trim(),
        documentType: form.documentType,
        documentNumber: form.documentNumber.trim(),
        birthDate: form.birthDate || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        previousSchool: form.previousSchool.trim() || null,
        province: form.province.trim() || null,
        municipality: form.municipality.trim() || null,
        documentsComplete: false,
        termsAccepted: true,
        notes: null,
      });
      setApplication(response);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyApplicationCode() {
    if (!application?.applicationCode) return;
    try {
      await navigator.clipboard.writeText(application.applicationCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2200);
    } catch {
      setCodeCopied(false);
    }
  }

  function goToPayment() {
    document.getElementById('pagamento-inscricao-publico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (application) {
    const candidateFirstName = form.fullName.trim().split(/\s+/)[0] || 'candidato(a)';

    return (
      <section
        id="ficha-inscricao"
        className="admission-success-shell rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-[0_24px_70px_rgba(7,26,53,.14)] sm:p-8"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <span className="admission-success-check flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_12px_35px_rgba(5,150,105,.35)]">
              <CheckCircle2 size={38} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-700">Candidatura recebida</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#071A35] sm:text-4xl">Parabéns, {candidateFirstName}!</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                Guarde o código abaixo para consultar a candidatura e acompanhar o pagamento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center self-end rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 md:self-start"
            aria-label="Fechar ficha"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admission-success-summary mt-7 grid gap-4 rounded-3xl bg-[#071A35] p-5 text-white sm:grid-cols-2 lg:grid-cols-4">
          <Result label="Código" value={application.applicationCode} />
          <Result label="Estado" value={application.status || 'SUBMITTED'} />
          <Result label="Curso" value={application.desiredCourseName} />
          <Result label="Turno" value={application.desiredShift} />
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#071A35]">Guia de pagamento da inscrição</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Emita a guia, efetue o pagamento e envie o comprovativo.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyApplicationCode}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#071A35] shadow-sm"
            >
              {codeCopied ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Copy size={18} />}
              {codeCopied ? 'Código copiado' : 'Copiar código'}
            </button>
            <button
              type="button"
              onClick={goToPayment}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#071A35] px-5 py-3 text-sm font-black text-white shadow-lg"
            >
              Emitir guia <ArrowDown size={18} />
            </button>
          </div>
        </div>

        <PublicAdmissionPaymentPanel
          application={application}
          documentNumber={form.documentNumber.trim()}
        />
      </section>
    );
  }

  return (
    <section id="ficha-inscricao" className="rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_24px_70px_rgba(7,26,53,.12)] sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#071A35] text-[#F4B400]">
            <FileCheck2 size={30} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#1194DD]">Ficha oficial de candidatura</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[#071A35] sm:text-3xl">Inscrição {catalog.academicYear}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Preencha os dados abaixo para submeter a candidatura.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center self-end rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 md:self-start" aria-label="Fechar ficha">
          <X size={20} />
        </button>
      </div>

      {import.meta.env.DEV ? (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={fillTestForm}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-800"
          >
            <FileCheck2 size={16} /> Preencher dados de teste
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-semibold leading-6">{error}</p>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-7 space-y-8">
        <fieldset className="space-y-5">
          <legend className="text-base font-black text-[#071A35]">1. Identificação do candidato</legend>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nome completo" required className="md:col-span-2">
              <input className={fieldClass} value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} placeholder="Nome conforme o documento" required />
            </Field>
            <Field label="Tipo de documento" required>
              <Select value={form.documentType} onChange={(event) => setField('documentType', event.target.value)} required>
                <option value="BI">Bilhete de Identidade</option>
                <option value="PASSAPORTE">Passaporte</option>
              </Select>
            </Field>
            <Field label="Número do documento" required>
              <input className={fieldClass} value={form.documentNumber} onChange={(event) => setField('documentNumber', event.target.value)} placeholder="Ex.: 000000000LA000" required />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className={fieldClass} value={form.birthDate} onChange={(event) => setField('birthDate', event.target.value)} />
            </Field>
            <Field label="Escola anterior">
              <input className={fieldClass} value={form.previousSchool} onChange={(event) => setField('previousSchool', event.target.value)} placeholder="Opcional" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-base font-black text-[#071A35]">2. Contactos e localização</legend>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="WhatsApp">
              <input className={fieldClass} value={form.whatsapp} onChange={(event) => setField('whatsapp', event.target.value)} placeholder="+244 9XX XXX XXX" />
            </Field>
            <Field label="Telefone">
              <input className={fieldClass} value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+244 9XX XXX XXX" />
            </Field>
            <Field label="E-mail" className="md:col-span-2">
              <input type="email" className={fieldClass} value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="nome@exemplo.com" />
            </Field>
            <Field label="Província">
              <input className={fieldClass} value={form.province} onChange={(event) => setField('province', event.target.value)} placeholder="Opcional" />
            </Field>
            <Field label="Município">
              <input className={fieldClass} value={form.municipality} onChange={(event) => setField('municipality', event.target.value)} placeholder="Opcional" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-base font-black text-[#071A35]">3. Curso e turno</legend>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Curso pretendido" required>
              <Select value={form.desiredCourseId} onChange={(event) => setField('desiredCourseId', event.target.value)} required>
                <option value="">Selecione o curso</option>
                {courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.courseName}</option>)}
              </Select>
            </Field>
            <Field label="Turno pretendido" required>
              <Select value={form.desiredShift} onChange={(event) => setField('desiredShift', event.target.value)} required disabled={!selectedCourse}>
                <option value="">Selecione o turno</option>
                {shifts.map((shift) => <option key={shift.code} value={shift.code}>{shift.label}</option>)}
              </Select>
            </Field>
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input type="checkbox" checked={form.termsAccepted} onChange={(event) => setField('termsAccepted', event.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-[#1194DD] focus:ring-[#1194DD]" />
          <span className="text-sm font-semibold leading-6 text-slate-600">
            Confirmo que os dados informados são verdadeiros e autorizo o tratamento das informações para o processo de admissão do IMETRO. <strong className="text-red-600">*</strong>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold leading-5 text-slate-500">Campos com * são obrigatórios.</p>
          <button type="submit" disabled={!canSubmit || submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F4B400] px-6 py-3 text-sm font-black text-[#071A35] shadow-lg transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">
            {submitting ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
            {submitting ? 'A enviar...' : canSubmit ? 'Submeter candidatura' : 'Envio indisponível'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, required = false, className = '', children }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}{required ? <strong className="ml-1 text-red-600">*</strong> : null}</span>
      {children}
    </label>
  );
}

function Select({ children, ...props }) {
  return (
    <span className="relative block">
      <select className={`${fieldClass} appearance-none pr-11`} {...props}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400" size={18} />
    </span>
  );
}

function Result({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-white/50">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-white">{value || '-'}</p>
    </div>
  );
}
