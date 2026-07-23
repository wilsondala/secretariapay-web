import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  Copy,
  FileDown,
  FileUp,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadPublicAdmissionPaymentGuide,
  getPublicAdmissionPaymentStatus,
  issuePublicAdmissionPayment,
  submitPublicAdmissionPaymentProof,
} from '../../services/admissionsService.js';

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

function deadlineLabel(value) {
  if (!value) return '';
  const dueDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  if (days < 0) return 'Prazo encerrado';
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Resta 1 dia para pagar';
  return `Restam ${days} dias para pagar`;
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

export default function PublicAdmissionPaymentPanel({ application, documentNumber }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [proofUrl, setProofUrl] = useState('');

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

  async function issuePayment() {
    setWorking(true);
    setError('');
    setMessage('');
    try {
      const response = await issuePublicAdmissionPayment(applicationCode, documentNumber);
      setPayment(response);
      setMessage('Cobrança preparada. Emita a guia, pague e envie o comprovativo dentro do prazo.');
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
      setMessage('Guia de pagamento emitida com sucesso.');
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setDownloading(false);
    }
  }

  async function submitProof() {
    if (!proofUrl.trim()) {
      setError('Informe a ligação do comprovativo para o teste de homologação.');
      return;
    }
    setWorking(true);
    setError('');
    setMessage('');
    try {
      const response = await submitPublicAdmissionPaymentProof(applicationCode, {
        documentNumber,
        fileUrl: proofUrl.trim(),
        fileName: 'comprovativo-inscricao-homologacao.pdf',
        mimeType: 'application/pdf',
      });
      setPayment(response);
      setProofUrl('');
      setMessage('Comprovativo enviado para validação da DCR.');
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
        <Loader2 className="animate-spin" size={20} /> A consultar a etapa financeira...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error || 'A etapa financeira não está disponível.'}
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
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#1194DD]">Etapa financeira da inscrição</p>
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
            <p className="text-sm font-black">Pagamento público ainda desativado</p>
            <p className="mt-1 text-sm font-semibold leading-6">
              A candidatura foi recebida. As instruções financeiras serão disponibilizadas somente após ativação institucional deste ambiente.
            </p>
          </div>
        </div>
      ) : null}

      {instructions.enabled ? (
        <div className="public-payment-environment rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="text-xs font-black uppercase tracking-[.12em]">{instructions.environmentLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6">{instructions.notice}</p>
        </div>
      ) : null}

      {expired ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-sm font-black">Candidatura marcada como desistência</p>
            <p className="mt-1 text-sm font-semibold leading-6">
              O prazo terminou sem pagamento ou comprovativo válido. A emissão da guia e o envio do comprovativo foram bloqueados.
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
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Prepare a cobrança para gerar uma guia com prazo de pagamento configurado pela instituição.
            </p>
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
            <InfoCard label="Vencimento" value={formatDate(invoice.dueDate)} helper={!proof ? deadlineLabel(invoice.dueDate) : ''} />
            <InfoCard label="Estado" value={statusLabel(invoice.status)} />
          </div>

          {!expired && !proof ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-950 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 shrink-0 text-blue-700" size={21} />
                <div>
                  <p className="text-sm font-black">{deadlineLabel(invoice.dueDate)}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-blue-800">
                    Emita a guia, efetue o pagamento e envie o comprovativo até {formatDate(invoice.dueDate)}.
                  </p>
                </div>
              </div>
              {canDownloadGuide ? (
                <button type="button" onClick={downloadGuide} disabled={downloading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#071A35] px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50">
                  {downloading ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                  {downloading ? 'A emitir...' : 'Emitir guia de pagamento'}
                </button>
              ) : null}
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
            <p className="mt-1 text-sm font-semibold leading-6">A DCR fará a validação antes da confirmação definitiva da inscrição.</p>
          </div>
        </div>
      ) : null}

      {canSubmitProof && instructions.enabled ? (
        <div className="public-payment-proof-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#1194DD]">
              <FileUp size={22} />
            </span>
            <div>
              <p className="text-sm font-black text-[#071A35]">Enviar comprovativo depois do pagamento</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                O comprovativo deve ser enviado até {formatDate(invoice.dueDate)}. Nesta fase de homologação, o envio técnico utiliza uma ligação de ficheiro.
              </p>
            </div>
          </div>
          {import.meta.env.DEV ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={proofUrl}
                onChange={(event) => setProofUrl(event.target.value)}
                className="min-h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#071A35] outline-none focus:border-[#1194DD] focus:ring-4 focus:ring-[#1194DD]/10"
                placeholder="https://.../comprovativo.pdf"
              />
              <button type="button" onClick={submitProof} disabled={working} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1194DD] px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                Enviar para DCR
              </button>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-600">
              Envie o comprovativo pelo WhatsApp oficial {instructions.supportWhatsapp} e informe o código {invoice.invoiceCode}.
            </p>
          )}
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
