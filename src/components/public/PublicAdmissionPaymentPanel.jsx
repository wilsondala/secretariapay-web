import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  Copy,
  FileCheck2,
  FileDown,
  FileUp,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  downloadPublicAdmissionPaymentGuide,
  getPublicAdmissionPaymentStatus,
  issuePublicAdmissionPayment,
  uploadPublicAdmissionPaymentProof,
} from '../../services/admissionsService.js';

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function readError(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'Não foi possível consultar o pagamento da inscrição.';
}

function formatMoney(value, currency = 'AOA') {
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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

function formatFileSize(value) {
  if (!value) return '0 KB';
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function statusLabel(value) {
  const labels = {
    SUBMITTED: 'Submetida',
    AWAITING_PAYMENT: 'Aguardando pagamento',
    PAYMENT_UNDER_REVIEW: 'Pagamento em análise',
    DOCUMENTATION_PENDING: 'Documentação pendente',
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendente',
    UNDER_REVIEW: 'Em análise pela DCR',
    PAID: 'Pago',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    PENDING_REVIEW: 'Pendente de validação DCR',
    CANCELLED: 'Cancelada',
    EXPIRED: 'Desistência por falta de pagamento',
  };
  return labels[String(value || '').toUpperCase()] || value || '-';
}

function guideIssuedStorageKey(invoiceCode) {
  return `secretariapay:admission-guide-issued:${invoiceCode}`;
}

export default function PublicAdmissionPaymentPanel({ application, documentNumber }) {
  const proofInputRef = useRef(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [guideIssued, setGuideIssued] = useState(false);

  const applicationCode = application?.applicationCode;

  async function load() {
    if (!applicationCode || !documentNumber) return;
    setLoading(true);
    setError('');
    try {
      setPayment(await getPublicAdmissionPaymentStatus(applicationCode, documentNumber));
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [applicationCode, documentNumber]);

  useEffect(() => {
    const invoiceCode = payment?.invoice?.invoiceCode;
    if (!invoiceCode) {
      setGuideIssued(false);
      return;
    }
    setGuideIssued(window.sessionStorage.getItem(guideIssuedStorageKey(invoiceCode)) === 'true');
  }, [payment?.invoice?.invoiceCode]);

  async function issuePayment() {
    setWorking(true);
    setError('');
    setMessage('');
    try {
      const response = await issuePublicAdmissionPayment(applicationCode, documentNumber);
      setPayment(response);
      setGuideIssued(false);
      setMessage('Cobrança preparada. Emita a guia para continuar.');
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setWorking(false);
    }
  }

  async function downloadGuide() {
    setDownloading(true);
    setError('');
    setMessage('');
    try {
      const blob = await downloadPublicAdmissionPaymentGuide(applicationCode, documentNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Guia_Inscricao_IMETRO_${applicationCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      const invoiceCode = payment?.invoice?.invoiceCode;
      if (invoiceCode) {
        window.sessionStorage.setItem(guideIssuedStorageKey(invoiceCode), 'true');
      }
      setGuideIssued(true);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setDownloading(false);
    }
  }

  function clearProofFile() {
    setProofFile(null);
    if (proofInputRef.current) proofInputRef.current.value = '';
  }

  function selectProof(event) {
    const selected = event.target.files?.[0] || null;
    setError('');
    setMessage('');

    if (!selected) {
      clearProofFile();
      return;
    }
    if (!ALLOWED_PROOF_TYPES.has(selected.type)) {
      clearProofFile();
      setError('Formato inválido. Selecione um comprovativo em PDF, JPG ou PNG.');
      return;
    }
    if (selected.size > MAX_PROOF_SIZE) {
      clearProofFile();
      setError('O comprovativo não pode ultrapassar 5 MB.');
      return;
    }

    setProofFile(selected);
  }

  async function submitProof() {
    if (!proofFile) {
      setError('Selecione o ficheiro do comprovativo antes de enviar.');
      return;
    }

    setWorking(true);
    setError('');
    setMessage('');
    try {
      const response = await uploadPublicAdmissionPaymentProof(
        applicationCode,
        documentNumber,
        proofFile,
      );
      setPayment(response);
      clearProofFile();
      setMessage('Comprovativo enviado com sucesso para validação da DCR.');
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setWorking(false);
    }
  }

  async function copy(value, label) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setMessage(`${label} copiado.`);
  }

  if (loading) {
    return (
      <div className="mt-6 flex min-h-32 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-500">
        <Loader2 className="animate-spin" size={20} /> A consultar pagamento...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error || 'O pagamento não está disponível.'}
      </div>
    );
  }

  const instructions = payment.paymentInstructions || {};
  const invoice = payment.invoice;
  const proof = payment.latestPaymentProof;
  const expired = payment.applicationStatus === 'EXPIRED' || invoice?.status === 'EXPIRED';
  const cancelled = invoice?.status === 'CANCELLED';
  const canDownloadGuide = Boolean(invoice && !expired && !cancelled);
  const canSubmitProof = Boolean(invoice && !proof && !expired && !cancelled && invoice.status === 'PENDING');

  return (
    <section
      id="pagamento-inscricao-publico"
      className="mt-6 space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(7,26,53,.10)] sm:p-6"
    >
      <div className="public-payment-heading flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071A35] text-[#F4B400] shadow-lg">
            <Banknote size={24} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#1194DD]">Pagamento da inscrição</p>
            <h3 className="mt-1 text-xl font-black text-[#071A35]">Cobrança, guia e comprovativo</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Candidatura {payment.applicationCode} · {statusLabel(payment.applicationStatus)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={working || downloading}
          className="public-payment-refresh inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-[#071A35] shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {!instructions.enabled ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-sm font-black">Pagamento indisponível</p>
            <p className="mt-1 text-sm font-semibold leading-6">
              Aguarde a disponibilização das instruções financeiras pela instituição.
            </p>
          </div>
        </div>
      ) : null}

      {expired ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-sm font-black">Candidatura marcada como desistência</p>
            <p className="mt-1 text-sm font-semibold leading-6">
              O prazo terminou sem pagamento ou comprovativo válido.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-semibold leading-6">{error}</p>
        </div>
      ) : null}

      {message ? (
        <div className="public-payment-success flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-semibold leading-6">{message}</p>
        </div>
      ) : null}

      {instructions.enabled && !invoice ? (
        <div className="public-payment-prepare flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#071A35]">Taxa oficial de inscrição</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Prepare a cobrança para emitir a guia.</p>
          </div>
          <button type="button" onClick={issuePayment} disabled={working} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F4B400] px-6 py-3 text-sm font-black text-[#071A35] shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
            {working ? <Loader2 className="animate-spin" size={18} /> : <Banknote size={18} />}
            {working ? 'A preparar...' : 'Preparar cobrança'}
          </button>
        </div>
      ) : null}

      {invoice ? (
        <>
          <div className="public-payment-summary-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Cobrança" value={invoice.invoiceCode} />
            <InfoCard label="Valor" value={formatMoney(invoice.amount, invoice.currency)} featured />
            <InfoCard
              label="Vencimento"
              value={formatDate(invoice.dueDate)}
              helper={guideIssued && !proof ? 'Validade: 72 horas (3 dias)' : ''}
            />
            <InfoCard label="Estado" value={statusLabel(invoice.status)} />
          </div>

          {!expired && !proof && canDownloadGuide ? (
            <div className="flex justify-end">
              <button type="button" onClick={downloadGuide} disabled={downloading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#071A35] px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50">
                {downloading ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                {downloading ? 'A emitir...' : guideIssued ? 'Emitir guia novamente' : 'Emitir guia de pagamento'}
              </button>
            </div>
          ) : null}

          {!expired && !proof && guideIssued ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <Clock3 className="mt-0.5 shrink-0 text-emerald-700" size={21} />
              <div>
                <p className="text-sm font-black">Guia de pagamento emitida</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">
                  Pague até {formatDate(invoice.dueDate)} e envie o comprovativo.
                </p>
              </div>
            </div>
          ) : null}

          <div className="public-payment-bank rounded-3xl bg-[#071A35] p-5 text-white shadow-[0_18px_45px_rgba(3,15,30,.22)] sm:p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4B400]/12 text-[#F4B400]">
                <Banknote size={22} />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-white/55">Dados para pagamento</p>
                <h4 className="mt-1 text-lg font-black text-white">Transferência bancária / Multicaixa Express</h4>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CopyRow label="Banco" value={instructions.bankName} onCopy={copy} />
              <CopyRow label="Beneficiário" value={instructions.accountHolder} onCopy={copy} />
              <CopyRow label="Conta AKZ" value={instructions.accountNumber} onCopy={copy} />
              <CopyRow label="IBAN" value={instructions.iban} onCopy={copy} />
              <CopyRow label="Referência" value={invoice.paymentReference || invoice.invoiceCode} onCopy={copy} />
              <div className="public-payment-guidance rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-white/50">Orientação</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/90">{instructions.multicaixaReference}</p>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {invoice && proof ? (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <Clock3 className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-sm font-black">Comprovativo: {statusLabel(proof.status)}</p>
            <p className="mt-1 text-sm font-semibold leading-6">A DCR fará a validação do pagamento.</p>
          </div>
        </div>
      ) : null}

      {canSubmitProof && instructions.enabled && guideIssued ? (
        <div className="public-payment-proof-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#1194DD]">
              <FileUp size={22} />
            </span>
            <div>
              <p className="text-sm font-black text-[#071A35]">Enviar comprovativo</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">PDF, JPG ou PNG de até 5 MB.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <input
                ref={proofInputRef}
                id={`proof-file-${invoice.id}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={selectProof}
                className="sr-only"
              />

              {proofFile ? (
                <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileCheck2 className="shrink-0 text-emerald-700" size={21} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#071A35]">{proofFile.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-500">{formatFileSize(proofFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearProofFile}
                    disabled={working}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-red-600 disabled:opacity-50"
                    aria-label="Remover comprovativo selecionado"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`proof-file-${invoice.id}`}
                  className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-sm font-black text-[#075C9F] transition hover:border-[#1194DD] hover:bg-sky-100"
                >
                  <FileUp size={19} /> Selecionar comprovativo
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={submitProof}
              disabled={working || !proofFile}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#1194DD] px-6 py-3 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-45"
            >
              {working ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
              {working ? 'A enviar...' : 'Enviar para DCR'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function InfoCard({ label, value, helper = '', featured = false }) {
  return (
    <div className={`public-payment-summary-card rounded-2xl border p-4 ${featured ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">{label}</p>
      <p className={`mt-2 break-words font-black text-[#071A35] ${featured ? 'text-base' : 'text-sm'}`}>{value || '-'}</p>
      {helper ? <p className="mt-2 text-xs font-extrabold text-blue-700">{helper}</p> : null}
    </div>
  );
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div className="public-payment-copy-row flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-white/50">{label}</p>
        <p className="mt-2 break-all text-sm font-black leading-6 text-white">{value || '-'}</p>
      </div>
      {value ? (
        <button type="button" onClick={() => onCopy(value, label)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10" aria-label={`Copiar ${label}`}>
          <Copy size={16} />
        </button>
      ) : null}
    </div>
  );
}
