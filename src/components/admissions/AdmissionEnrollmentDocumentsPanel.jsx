import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  getAdmissionEnrollmentDocuments,
  reviewAdmissionEnrollmentDocuments,
} from '../../services/admissionsService.js';

const EMPTY_FORM = {
  twoPassportPhotos: false,
  authenticatedCertificateCopy: false,
  identityDocumentCopy: false,
  studiedAbroad: false,
  educationEquivalenceCopy: false,
  secondaryEducationCompleted: false,
  notes: '',
};

function readError(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;
}

function calculateAgeEligible(birthDate) {
  if (!birthDate) return false;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > new Date()) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 18;
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

function mapResponseToForm(checklist) {
  if (!checklist) return EMPTY_FORM;
  return {
    twoPassportPhotos: Boolean(checklist.twoPassportPhotos),
    authenticatedCertificateCopy: Boolean(checklist.authenticatedCertificateCopy),
    identityDocumentCopy: Boolean(checklist.identityDocumentCopy),
    studiedAbroad: Boolean(checklist.studiedAbroad),
    educationEquivalenceCopy: Boolean(checklist.educationEquivalenceCopy),
    secondaryEducationCompleted: Boolean(checklist.secondaryEducationCompleted),
    notes: checklist.notes || '',
  };
}

export default function AdmissionEnrollmentDocumentsPanel({
  application,
  user,
  canManage,
  onApplicationChanged,
}) {
  const [checklist, setChecklist] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ageEligiblePreview = useMemo(
    () => calculateAgeEligible(application?.birthDate),
    [application?.birthDate],
  );

  const effectiveAgeEligible = checklist?.ageEligible ?? ageEligiblePreview;
  const equivalenceSatisfied = !form.studiedAbroad || form.educationEquivalenceCopy;
  const completePreview = form.twoPassportPhotos
    && form.authenticatedCertificateCopy
    && form.identityDocumentCopy
    && form.secondaryEducationCompleted
    && effectiveAgeEligible
    && equivalenceSatisfied;
  const locked = Boolean(checklist?.enrollmentRequestId);

  useEffect(() => {
    let active = true;

    async function loadChecklist() {
      if (!application?.id) return;
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const response = await getAdmissionEnrollmentDocuments(application.id);
        if (!active) return;
        setChecklist(response);
        setForm(mapResponseToForm(response));
      } catch (requestError) {
        if (!active) return;
        if (requestError?.response?.status === 404) {
          setChecklist(null);
          setForm(EMPTY_FORM);
        } else {
          setError(readError(requestError, 'Não foi possível carregar o checklist documental.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadChecklist();
    return () => {
      active = false;
    };
  }, [application?.id]);

  function setField(name, value) {
    if (locked) return;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'studiedAbroad' && !value) {
        next.educationEquivalenceCopy = false;
      }
      return next;
    });
    setError('');
    setSuccess('');
  }

  async function saveChecklist() {
    if (!application?.id || !canManage || locked) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await reviewAdmissionEnrollmentDocuments(application.id, {
        twoPassportPhotos: form.twoPassportPhotos,
        authenticatedCertificateCopy: form.authenticatedCertificateCopy,
        identityDocumentCopy: form.identityDocumentCopy,
        studiedAbroad: form.studiedAbroad,
        educationEquivalenceCopy: form.educationEquivalenceCopy,
        secondaryEducationCompleted: form.secondaryEducationCompleted,
        reviewedBy: user?.fullName || user?.name || user?.email || 'Secretaria / Admissões',
        notes: form.notes.trim() || null,
      });
      setChecklist(response);
      setForm(mapResponseToForm(response));
      setSuccess(response.documentsComplete
        ? 'Documentação aprovada. A cobrança da matrícula de 23.500,00 Kz foi criada automaticamente.'
        : 'Checklist guardado. A candidatura permanece com documentação pendente.');
      await onApplicationChanged?.(application.id);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível guardar o checklist documental.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="premium-card mt-5 flex min-h-28 items-center justify-center gap-2 p-4 text-sm font-bold text-slate-500">
        <Loader2 className="animate-spin" size={19} /> A carregar o checklist da matrícula...
      </div>
    );
  }

  return (
    <section className="premium-card mt-5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="text-[#3157D5]" size={20} />
            <h3 className="font-extrabold text-imetro-navy dark:text-white">Checklist oficial da matrícula</h3>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            Validação da Secretaria/Admissões após a confirmação do pagamento da inscrição pela DCR.
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${
          checklist?.documentsComplete
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
        }`}>
          {checklist?.documentsComplete ? 'Documentação aprovada' : 'Documentação pendente'}
        </span>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} /> {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {success}
        </div>
      ) : null}

      {!canManage ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold leading-6 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
          <ShieldCheck className="mt-0.5 shrink-0" size={18} />
          A DCR pode acompanhar este checklist, mas a validação dos documentos pertence à Secretaria/Admissões.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <ChecklistItem
          checked={form.twoPassportPhotos}
          disabled={!canManage || locked}
          onChange={(checked) => setField('twoPassportPhotos', checked)}
          title="2 fotografias do tipo passe"
          description="Confirmar receção e legibilidade das duas fotografias exigidas."
        />
        <ChecklistItem
          checked={form.authenticatedCertificateCopy}
          disabled={!canManage || locked}
          onChange={(checked) => setField('authenticatedCertificateCopy', checked)}
          title="Fotocópia autenticada do certificado de habilitações"
          description="Documento obrigatório para comprovar a conclusão do ensino médio."
        />
        <ChecklistItem
          checked={form.identityDocumentCopy}
          disabled={!canManage || locked}
          onChange={(checked) => setField('identityDocumentCopy', checked)}
          title="Fotocópia do Bilhete de Identidade"
          description="Validar correspondência com os dados da candidatura."
        />
        <ChecklistItem
          checked={form.secondaryEducationCompleted}
          disabled={!canManage || locked}
          onChange={(checked) => setField('secondaryEducationCompleted', checked)}
          title="Ensino médio concluído"
          description="Critério obrigatório de elegibilidade académica."
        />
        <ChecklistItem
          checked={effectiveAgeEligible}
          disabled
          title="Idade mínima de 18 anos"
          description={application?.birthDate
            ? `Validação automática com base na data de nascimento informada: ${formatDate(application.birthDate)}.`
            : 'A candidatura não possui data de nascimento válida.'}
          warning={!effectiveAgeEligible}
        />
        <ChecklistItem
          checked={form.studiedAbroad}
          disabled={!canManage || locked}
          onChange={(checked) => setField('studiedAbroad', checked)}
          title="Candidato estudou no estrangeiro"
          description="Ativa a exigência da equivalência do Ministério da Educação."
        />
        {form.studiedAbroad ? (
          <ChecklistItem
            checked={form.educationEquivalenceCopy}
            disabled={!canManage || locked}
            onChange={(checked) => setField('educationEquivalenceCopy', checked)}
            title="Cópia da equivalência do Ministério da Educação"
            description="Obrigatória somente para candidatos que estudaram no estrangeiro."
            warning={!form.educationEquivalenceCopy}
          />
        ) : null}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-extrabold text-slate-600 dark:text-slate-300">Observação da análise documental</span>
        <textarea
          rows={3}
          className="input-premium"
          value={form.notes}
          disabled={!canManage || locked}
          onChange={(event) => setField('notes', event.target.value)}
          placeholder="Registe pendências, documentos ilegíveis ou observações relevantes."
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SummaryItem
          label="Elegibilidade por idade"
          value={effectiveAgeEligible ? 'Elegível' : 'Não elegível'}
          positive={effectiveAgeEligible}
        />
        <SummaryItem
          label="Resultado previsto"
          value={completePreview ? 'Aprovar e gerar matrícula' : 'Manter documentação pendente'}
          positive={completePreview}
        />
      </div>

      {checklist?.reviewedAt ? (
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Última análise: {formatDateTime(checklist.reviewedAt)} por {checklist.reviewedBy || 'utilizador institucional'}.
        </p>
      ) : null}

      {checklist?.enrollmentRequestId ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-200">
            <GraduationCap size={19} />
            <p className="font-extrabold">Processo de matrícula criado</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SummaryItem label="Pedido" value={checklist.enrollmentRequestCode || '-'} positive />
            <SummaryItem label="Estado" value={checklist.enrollmentStatus || '-'} positive />
            <SummaryItem label="Valor" value={money(checklist.enrollmentAmount, checklist.enrollmentCurrency)} positive />
            <SummaryItem label="Vencimento" value={formatDate(checklist.enrollmentDueDate)} positive />
          </div>
          <p className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-200">
            O estudante definitivo ainda não foi criado. A criação ocorrerá somente após a DCR confirmar o pagamento da matrícula.
          </p>
        </div>
      ) : null}

      {canManage && !locked ? (
        <button
          type="button"
          onClick={saveChecklist}
          disabled={saving}
          className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
            completePreview ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#3157D5] hover:bg-[#2448bd]'
          }`}
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : completePreview ? <FileCheck2 size={18} /> : <Save size={18} />}
          {saving
            ? 'A guardar...'
            : completePreview
              ? 'Aprovar documentação e gerar matrícula'
              : 'Guardar checklist pendente'}
        </button>
      ) : null}
    </section>
  );
}

function ChecklistItem({ checked, disabled, onChange, title, description, warning = false }) {
  return (
    <label className={`flex items-start gap-3 rounded-2xl border p-3 transition ${
      checked
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
        : warning
          ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
          : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[.03]'
    } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-70"
      />
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-slate-800 dark:text-white">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{description}</span>
      </span>
    </label>
  );
}

function SummaryItem({ label, value, positive = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]">
      <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${positive ? 'text-emerald-700 dark:text-emerald-200' : 'text-amber-700 dark:text-amber-200'}`}>
        {value || '-'}
      </p>
    </div>
  );
}
