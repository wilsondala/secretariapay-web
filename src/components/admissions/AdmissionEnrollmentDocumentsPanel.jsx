import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileImage,
  FileText,
  GraduationCap,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  deleteAdmissionEnrollmentDocumentFile,
  downloadAdmissionEnrollmentDocumentFile,
  getAdmissionEnrollmentDocuments,
  listAdmissionEnrollmentDocumentFiles,
  reviewAdmissionEnrollmentDocuments,
  uploadAdmissionEnrollmentDocumentFile,
} from '../../services/admissionsService.js';

const EMPTY_FORM = {
  twoPassportPhotos: false,
  authenticatedCertificateCopy: false,
  identityDocumentCopy: false,
  studiedAbroad: false,
  educationEquivalenceCopy: false,
  secondaryEducationCompleted: false,
  originalsPresented: false,
  originalsVerified: false,
  notes: '',
  originalsVerificationNotes: '',
};

const DOCUMENT_TYPES = {
  PASSPORT_PHOTO: 'PASSPORT_PHOTO',
  AUTHENTICATED_CERTIFICATE: 'AUTHENTICATED_CERTIFICATE',
  IDENTITY_DOCUMENT: 'IDENTITY_DOCUMENT',
  EDUCATION_EQUIVALENCE: 'EDUCATION_EQUIVALENCE',
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

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
    originalsPresented: Boolean(checklist.originalsPresented),
    originalsVerified: Boolean(checklist.originalsVerified),
    notes: checklist.notes || '',
    originalsVerificationNotes: checklist.originalsVerificationNotes || '',
  };
}

export default function AdmissionEnrollmentDocumentsPanel({
  application,
  user,
  canManage,
  onApplicationChanged,
}) {
  const [checklist, setChecklist] = useState(null);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ageEligiblePreview = useMemo(
    () => calculateAgeEligible(application?.birthDate),
    [application?.birthDate],
  );

  const groupedFiles = useMemo(() => files.reduce((groups, file) => {
    const key = file.documentType;
    groups[key] = [...(groups[key] || []), file];
    return groups;
  }, {}), [files]);

  const photoFiles = groupedFiles[DOCUMENT_TYPES.PASSPORT_PHOTO] || [];
  const certificateFiles = groupedFiles[DOCUMENT_TYPES.AUTHENTICATED_CERTIFICATE] || [];
  const identityFiles = groupedFiles[DOCUMENT_TYPES.IDENTITY_DOCUMENT] || [];
  const equivalenceFiles = groupedFiles[DOCUMENT_TYPES.EDUCATION_EQUIVALENCE] || [];

  const effectiveAgeEligible = checklist?.ageEligible ?? ageEligiblePreview;
  const equivalenceSatisfied = !form.studiedAbroad || form.educationEquivalenceCopy;
  const requiredFilesPresent = photoFiles.length >= 2
    && certificateFiles.length >= 1
    && identityFiles.length >= 1
    && (!form.studiedAbroad || equivalenceFiles.length >= 1);
  const digitalReviewComplete = form.twoPassportPhotos
    && form.authenticatedCertificateCopy
    && form.identityDocumentCopy
    && form.secondaryEducationCompleted
    && effectiveAgeEligible
    && equivalenceSatisfied
    && requiredFilesPresent;
  const completePreview = digitalReviewComplete
    && form.originalsPresented
    && form.originalsVerified;
  const locked = Boolean(checklist?.enrollmentRequestId);

  async function loadFiles() {
    const response = await listAdmissionEnrollmentDocumentFiles(application.id);
    setFiles(response);
    return response;
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!application?.id) return;
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const [checklistResult, filesResult] = await Promise.allSettled([
          getAdmissionEnrollmentDocuments(application.id),
          listAdmissionEnrollmentDocumentFiles(application.id),
        ]);
        if (!active) return;

        if (checklistResult.status === 'fulfilled') {
          setChecklist(checklistResult.value);
          setForm(mapResponseToForm(checklistResult.value));
        } else if (checklistResult.reason?.response?.status === 404) {
          setChecklist(null);
          setForm(EMPTY_FORM);
        } else {
          throw checklistResult.reason;
        }

        if (filesResult.status === 'fulfilled') {
          setFiles(filesResult.value);
        } else {
          throw filesResult.reason;
        }
      } catch (requestError) {
        if (active) setError(readError(requestError, 'Não foi possível carregar a documentação da matrícula.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [application?.id]);

  useEffect(() => () => {
    if (preview?.url) window.URL.revokeObjectURL(preview.url);
  }, [preview?.url]);

  function setField(name, value) {
    if (locked) return;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'studiedAbroad' && !value) next.educationEquivalenceCopy = false;
      if (name === 'originalsPresented' && !value) next.originalsVerified = false;
      return next;
    });
    setError('');
    setSuccess('');
  }

  async function uploadFile(documentType, file) {
    if (!file || !application?.id || !canManage || locked) return;
    setUploadingType(documentType);
    setError('');
    setSuccess('');
    try {
      await uploadAdmissionEnrollmentDocumentFile(application.id, documentType, file);
      await loadFiles();
      setSuccess('Documento anexado. Abra a pré-visualização e confira a legibilidade antes de validar o checklist.');
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível anexar o documento.'));
    } finally {
      setUploadingType('');
    }
  }

  async function removeFile(file) {
    if (!file?.id || !canManage || locked) return;
    setDeletingId(file.id);
    setError('');
    setSuccess('');
    try {
      await deleteAdmissionEnrollmentDocumentFile(file.id);
      await loadFiles();
      setSuccess('Documento removido.');
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível remover o documento.'));
    } finally {
      setDeletingId('');
    }
  }

  async function openPreview(file) {
    setPreviewLoadingId(file.id);
    setError('');
    try {
      const blob = await downloadAdmissionEnrollmentDocumentFile(file.id);
      if (preview?.url) window.URL.revokeObjectURL(preview.url);
      setPreview({
        url: window.URL.createObjectURL(blob),
        mimeType: file.mimeType,
        name: file.originalFileName,
      });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível abrir a pré-visualização do documento.'));
    } finally {
      setPreviewLoadingId('');
    }
  }

  function closePreview() {
    if (preview?.url) window.URL.revokeObjectURL(preview.url);
    setPreview(null);
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
        originalsPresented: form.originalsPresented,
        originalsVerified: form.originalsVerified,
        reviewedBy: user?.fullName || user?.name || user?.email || 'Secretaria / Admissões',
        notes: form.notes.trim() || null,
        originalsVerificationNotes: form.originalsVerificationNotes.trim() || null,
      });
      setChecklist(response);
      setForm(mapResponseToForm(response));
      if (response.documentsComplete) {
        setSuccess('Documentação e originais aprovados. A cobrança da matrícula de 23.500,00 Kz foi criada automaticamente.');
      } else if (digitalReviewComplete && !response.originalsVerified) {
        setSuccess('Análise digital guardada. Oriente o candidato a apresentar presencialmente os documentos originais.');
      } else {
        setSuccess('Checklist guardado. A candidatura permanece com documentação pendente.');
      }
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
        <Loader2 className="animate-spin" size={19} /> A carregar os documentos da matrícula...
      </div>
    );
  }

  return (
    <>
      <section className="premium-card mt-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="text-[#3157D5]" size={20} />
              <h3 className="font-extrabold text-imetro-navy dark:text-white">Checklist oficial da matrícula</h3>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Abra cada imagem ou PDF, confirme a legibilidade e depois confronte as cópias com os documentos originais apresentados presencialmente.
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

        {error ? <Notice tone="red"><AlertCircle className="mt-0.5 shrink-0" size={18} /> {error}</Notice> : null}
        {success ? <Notice tone="green"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /> {success}</Notice> : null}

        {!canManage ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold leading-6 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            <ShieldCheck className="mt-0.5 shrink-0" size={18} />
            A DCR pode abrir e conferir os anexos, mas a validação das cópias e dos originais pertence à Secretaria/Admissões.
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          <ChecklistItem
            checked={form.twoPassportPhotos}
            disabled={!canManage || locked}
            onChange={(checked) => setField('twoPassportPhotos', checked)}
            title="2 fotografias do tipo passe"
            description="As duas fotografias devem estar anexadas e legíveis."
            warning={photoFiles.length < 2}
          >
            <DocumentAttachments
              files={photoFiles}
              requiredCount={2}
              documentType={DOCUMENT_TYPES.PASSPORT_PHOTO}
              canManage={canManage}
              locked={locked}
              uploading={uploadingType === DOCUMENT_TYPES.PASSPORT_PHOTO}
              deletingId={deletingId}
              previewLoadingId={previewLoadingId}
              onUpload={uploadFile}
              onDelete={removeFile}
              onPreview={openPreview}
              accept="image/jpeg,image/png"
            />
          </ChecklistItem>

          <ChecklistItem
            checked={form.authenticatedCertificateCopy}
            disabled={!canManage || locked}
            onChange={(checked) => setField('authenticatedCertificateCopy', checked)}
            title="Fotocópia autenticada do certificado de habilitações"
            description="Confira autenticação, nome, escola e conclusão do ensino médio."
            warning={certificateFiles.length < 1}
          >
            <DocumentAttachments
              files={certificateFiles}
              requiredCount={1}
              documentType={DOCUMENT_TYPES.AUTHENTICATED_CERTIFICATE}
              canManage={canManage}
              locked={locked}
              uploading={uploadingType === DOCUMENT_TYPES.AUTHENTICATED_CERTIFICATE}
              deletingId={deletingId}
              previewLoadingId={previewLoadingId}
              onUpload={uploadFile}
              onDelete={removeFile}
              onPreview={openPreview}
            />
          </ChecklistItem>

          <ChecklistItem
            checked={form.identityDocumentCopy}
            disabled={!canManage || locked}
            onChange={(checked) => setField('identityDocumentCopy', checked)}
            title="Fotocópia do Bilhete de Identidade"
            description="Compare nome, número, fotografia e validade com a candidatura."
            warning={identityFiles.length < 1}
          >
            <DocumentAttachments
              files={identityFiles}
              requiredCount={1}
              documentType={DOCUMENT_TYPES.IDENTITY_DOCUMENT}
              canManage={canManage}
              locked={locked}
              uploading={uploadingType === DOCUMENT_TYPES.IDENTITY_DOCUMENT}
              deletingId={deletingId}
              previewLoadingId={previewLoadingId}
              onUpload={uploadFile}
              onDelete={removeFile}
              onPreview={openPreview}
            />
          </ChecklistItem>

          <ChecklistItem
            checked={form.secondaryEducationCompleted}
            disabled={!canManage || locked}
            onChange={(checked) => setField('secondaryEducationCompleted', checked)}
            title="Ensino médio concluído"
            description="Critério obrigatório comprovado pelo certificado anexado."
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
              description="Obrigatória para candidatos que estudaram no estrangeiro."
              warning={equivalenceFiles.length < 1 || !form.educationEquivalenceCopy}
            >
              <DocumentAttachments
                files={equivalenceFiles}
                requiredCount={1}
                documentType={DOCUMENT_TYPES.EDUCATION_EQUIVALENCE}
                canManage={canManage}
                locked={locked}
                uploading={uploadingType === DOCUMENT_TYPES.EDUCATION_EQUIVALENCE}
                deletingId={deletingId}
                previewLoadingId={previewLoadingId}
                onUpload={uploadFile}
                onDelete={removeFile}
                onPreview={openPreview}
              />
            </ChecklistItem>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="text-sm font-extrabold">Conferência presencial obrigatória</p>
              <p className="mt-1 text-xs font-semibold leading-5">
                Os anexos digitais servem para pré-análise. Antes de liberar a cobrança da matrícula, a Secretaria deve confrontar as cópias com o certificado original, o Bilhete de Identidade original e, quando aplicável, a equivalência original.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <ChecklistItem
            checked={form.originalsPresented}
            disabled={!canManage || locked || !requiredFilesPresent}
            onChange={(checked) => setField('originalsPresented', checked)}
            title="Documentos originais apresentados presencialmente"
            description="Confirmar que o candidato compareceu à Secretaria com os documentos originais exigidos."
            warning={digitalReviewComplete && !form.originalsPresented}
          />
          <ChecklistItem
            checked={form.originalsVerified}
            disabled={!canManage || locked || !form.originalsPresented}
            onChange={(checked) => setField('originalsVerified', checked)}
            title="Autenticidade confrontada e confirmada"
            description="Confirmar que nomes, números, fotografias, autenticações e demais dados correspondem às cópias digitais."
            warning={form.originalsPresented && !form.originalsVerified}
          />
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

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-extrabold text-slate-600 dark:text-slate-300">Observação da conferência presencial</span>
          <textarea
            rows={3}
            className="input-premium"
            value={form.originalsVerificationNotes}
            disabled={!canManage || locked}
            onChange={(event) => setField('originalsVerificationNotes', event.target.value)}
            placeholder="Registe documentos apresentados, divergências encontradas ou confirmação da autenticidade."
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="Anexos obrigatórios" value={requiredFilesPresent ? 'Completos' : 'Incompletos'} positive={requiredFilesPresent} />
          <SummaryItem label="Análise digital" value={digitalReviewComplete ? 'Concluída' : 'Pendente'} positive={digitalReviewComplete} />
          <SummaryItem label="Originais" value={form.originalsVerified ? 'Conferidos' : 'Aguardando conferência'} positive={form.originalsVerified} />
          <SummaryItem label="Resultado previsto" value={completePreview ? 'Aprovar e gerar matrícula' : 'Manter pendente'} positive={completePreview} />
        </div>

        {checklist?.reviewedAt ? (
          <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Última análise: {formatDateTime(checklist.reviewedAt)} por {checklist.reviewedBy || 'utilizador institucional'}.
          </p>
        ) : null}

        {checklist?.originalsVerifiedAt ? (
          <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
            Originais conferidos em {formatDateTime(checklist.originalsVerifiedAt)} por {checklist.originalsVerifiedBy || 'Secretaria Académica'}.
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
                ? 'Aprovar documentos, originais e gerar matrícula'
                : digitalReviewComplete
                  ? 'Guardar e aguardar conferência presencial'
                  : 'Guardar checklist pendente'}
          </button>
        ) : null}
      </section>

      {preview ? <PreviewModal preview={preview} onClose={closePreview} /> : null}
    </>
  );
}

function DocumentAttachments({
  files,
  requiredCount,
  documentType,
  canManage,
  locked,
  uploading,
  deletingId,
  previewLoadingId,
  onUpload,
  onDelete,
  onPreview,
  accept = 'application/pdf,image/jpeg,image/png',
}) {
  const canAdd = canManage && !locked && files.length < requiredCount;
  return (
    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#071A35]/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {file.mimeType === 'application/pdf' ? <FileText className="shrink-0 text-red-500" size={18} /> : <FileImage className="shrink-0 text-[#1194DD]" size={18} />}
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-slate-800 dark:text-white">{file.originalFileName}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{formatFileSize(file.fileSize)} · {formatDateTime(file.uploadedAt)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => onPreview(file)} disabled={previewLoadingId === file.id} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#3157D5]/30 bg-[#3157D5]/10 px-3 text-xs font-extrabold text-[#79A2FF] disabled:opacity-50">
                {previewLoadingId === file.id ? <Loader2 className="animate-spin" size={15} /> : <Eye size={15} />} Visualizar
              </button>
              {canManage && !locked ? (
                <button type="button" onClick={() => onDelete(file)} disabled={deletingId === file.id} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-red-400 disabled:opacity-50" aria-label={`Remover ${file.originalFileName}`}>
                  {deletingId === file.id ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {canAdd ? (
        <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#3157D5]/50 bg-[#3157D5]/5 px-4 text-xs font-extrabold text-[#79A2FF] hover:bg-[#3157D5]/10">
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
          {uploading ? 'A anexar...' : files.length ? 'Anexar outro ficheiro' : 'Anexar ficheiro para conferência'}
          <input
            type="file"
            className="hidden"
            accept={accept}
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onUpload(documentType, file);
            }}
          />
        </label>
      ) : null}

      <p className={`mt-2 text-[10px] font-bold ${files.length >= requiredCount ? 'text-emerald-500' : 'text-amber-500'}`}>
        {files.length}/{requiredCount} ficheiro(s) obrigatório(s) anexado(s).
      </p>
    </div>
  );
}

function ChecklistItem({ checked, disabled, onChange, title, description, warning = false, children }) {
  return (
    <div className={`rounded-2xl border p-3 transition ${
      checked
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
        : warning
          ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
          : 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[.03]'
    }`}>
      <label className={`flex items-start gap-3 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
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
      {children}
    </div>
  );
}

function Notice({ tone, children }) {
  const style = tone === 'red'
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200';
  return <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-3 text-sm font-bold ${style}`}>{children}</div>;
}

function PreviewModal({ preview, onClose }) {
  const isPdf = preview.mimeType === 'application/pdf';
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6">
      <section className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#081321] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#1194DD]">Pré-visualização protegida</p>
            <h4 className="truncate text-sm font-extrabold text-white">{preview.name}</h4>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10" aria-label="Fechar pré-visualização"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-950/50 p-3">
          {isPdf ? (
            <iframe title={preview.name} src={preview.url} className="h-[78vh] w-full rounded-xl bg-white" />
          ) : (
            <img src={preview.url} alt={preview.name} className="mx-auto max-h-[78vh] max-w-full rounded-xl object-contain" />
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value, positive = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]">
      <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${positive ? 'text-emerald-700 dark:text-emerald-200' : 'text-amber-700 dark:text-amber-200'}`}>{value || '-'}</p>
    </div>
  );
}
