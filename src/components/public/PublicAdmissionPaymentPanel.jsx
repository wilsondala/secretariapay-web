import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  Copy,
  FileUp,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
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
  };
  return labels[String(value || '').toUpperCase()] || value || '-';
}

export default function PublicAdmissionPaymentPanel({ application, documentNumber }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
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
      setMessage('Cobrança provisória preparada com o valor oficial da inscrição.');
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setWorking(false);
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

  return (
    <section className="mt-6 space-y-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071A35] text-[#F4B400]">
            <Banknote size={24} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#1194DD]">Etapa financeira da inscrição</p>
            <h3 className="mt-1 text-xl font-black text-[#071A35]">Cobrança e comprovativo</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Candidatura {payment.applicationCode} · {statusLabel(payment.applicationStatus)}
            </p>
          </div>
        </div>
        <button type="button" onClick={load} disabled={working} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-extrabold text-[#071A35] disabled:opacity-50">
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
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="text-xs font-black uppercase tracking-[.12em]">{instructions.environmentLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6">{instructions.notice}</p>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-semibold leading-6">{error}</p>
        </div>
      ) : null}

      {message ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-semibold leading-6">{message}</p>
        </div>
      ) : null}

      {instructions.enabled && !invoice ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#071A35]">Taxa oficial de inscrição</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">A cobrança será criada com o valor definido na campanha 2026/2027.</p>
          </div>
          <button type="button" onClick={issuePayment} disabled={working} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F4B400] px-6 py-3 text-sm font-black text-[#071A35] shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
            {working ? <Loader2 className="animate-spin" size={18} /> : <Banknote size={18} />}
            {working ? 'A preparar...' : 'Preparar cobrança'}
          </button>
        </div>
      ) : null}

      {invoice ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Cobrança" value={invoice.invoiceCode} />
            <InfoCard label="Valor" value={formatMoney(invoice.amount, invoice.currency)} />
            <InfoCard label="Vencimento" value={formatDate(invoice.dueDate)} />
            <InfoCard label="Estado" value={statusLabel(invoice.status)} />
          </div>

          <div className="rounded-3xl bg-[#071A35] p-5 text-white">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Banknote className="text-[#F4B400]" size={22} />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-white/55">Dados para pagamento</p>
                <h4 className="mt-1 text-lg font-black">Transferência bancária / Multicaixa Express</h4>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CopyRow label="Banco" value={instructions.bankName} onCopy={copy} />
              <CopyRow label="Beneficiário" value={instructions.accountHolder} onCopy={copy} />
              <CopyRow label="Conta AKZ" value={instructions.accountNumber} onCopy={copy} />
              <CopyRow label="IBAN" value={instructions.iban} onCopy={copy} />
              <CopyRow label="Referência" value={invoice.paymentReference || invoice.invoiceCode} onCopy={copy} />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-white/45">Orientação</p>
                <p className="mt-1 text-sm font-bold leading-6 text-white/85">{instructions.multicaixaReference}</p>
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

      {invoice && !proof && instructions.enabled ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <FileUp className="mt-0.5 shrink-0 text-[#1194DD]" size={22} />
            <div>
              <p className="text-sm font-black text-[#071A35]">Enviar comprovativo</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Nesta fase, o envio técnico utiliza uma ligação de ficheiro em homologação. O upload direto será ligado ao armazenamento institucional no próximo bloco.
              </p>
            </div>
          </div>
          {import.meta.env.DEV ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={proofUrl}
                onChange={(event) => setProofUrl(event.target.value)}
                className="min-h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#071A35] outline-none focus:border-[#1194DD]"
                placeholder="https://.../comprovativo.pdf"
              />
              <button type="button" onClick={submitProof} disabled={working} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1194DD] px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                {working ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                Enviar para DCR
              </button>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-600">
              Envie o comprovativo pelo WhatsApp institucional {instructions.supportWhatsapp} e informe o código {invoice.invoiceCode}.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-[#071A35]">{value || '-'}</p>
    </div>
  );
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 p-3">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-white/45">{label}</p>
        <p className="mt-1 break-all text-sm font-black text-white">{value || '-'}</p>
      </div>
      {value ? (
        <button type="button" onClick={() => onCopy(value, label)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75" aria-label={`Copiar ${label}`}>
          <Copy size={15} />
        </button>
      ) : null}
    </div>
  );
}
