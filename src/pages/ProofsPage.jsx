import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { approvePaymentProof, listPaymentProofs, rejectPaymentProof } from '../services/proofsService.js';
import {
  formatMoney,
  normalizeDateTime,
  normalizePaymentProof,
  normalizeProofStatus,
  normalizeText,
} from '../utils/formatters.js';

export default function ProofsPage() {
  const [rawProofs, setRawProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [working, setWorking] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [notes, setNotes] = useState('');

  const proofs = useMemo(() => rawProofs.map(normalizePaymentProof), [rawProofs]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPaymentProofs();
      setRawProofs(data);
      if (data.length > 0 && !selected) setSelected(normalizePaymentProof(data[0]));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar comprovativos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return proofs.filter((proof) => {
      const text = normalizeText([
        proof.proofCode,
        proof.chargeCode,
        proof.receiptCode,
        proof.studentName,
        proof.studentNumber,
        proof.paymentMethod,
        proof.transactionReference,
        proof.status,
      ].join(' '));
      const matchesSearch = !term || text.includes(term);
      const matchesStatus = status === 'ALL' || String(proof.status).toUpperCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [proofs, search, status]);

  const stats = useMemo(() => {
    const pending = proofs.filter((item) => ['PENDING', 'PENDING_REVIEW', 'UNDER_REVIEW'].includes(String(item.status).toUpperCase()));
    const approved = proofs.filter((item) => ['APPROVED', 'VALIDATED'].includes(String(item.status).toUpperCase()));
    const rejected = proofs.filter((item) => String(item.status).toUpperCase() === 'REJECTED');
    return {
      total: proofs.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      pendingAmount: pending.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [proofs]);

  const handleApprove = async () => {
    if (!selected?.id) return;
    setWorking(true);
    setActionMessage(null);
    try {
      const result = await approvePaymentProof(selected.id, { notes: notes || 'Aprovado pela DCR no painel.' });
      setActionMessage({ type: 'success', text: `Comprovativo aprovado. ${result?.receiptCode ? `Recibo: ${result.receiptCode}` : 'Aguardando retorno do backend.'}` });
      setNotes('');
      await load();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Falha ao aprovar comprovativo.' });
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!selected?.id) return;
    setWorking(true);
    setActionMessage(null);
    try {
      await rejectPaymentProof(selected.id, { reason: notes || 'Comprovativo rejeitado pela DCR.' });
      setActionMessage({ type: 'success', text: 'Comprovativo rejeitado e registado para correção.' });
      setNotes('');
      await load();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Falha ao rejeitar comprovativo.' });
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <LoadingState message="Carregando comprovativos enviados pelos estudantes..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <FileCheck2 size={14} />
              Validação manual DCR
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Comprovativos e validação DCR</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Análise manual dos comprovativos recebidos antes da emissão do recibo institucional.
            </p>
          </div>
          <button className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15" onClick={load} disabled={working}>
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </section>

      {actionMessage && (
        <div className={`rounded-2xl border p-4 text-sm font-black ${actionMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {actionMessage.text}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Comprovativos" value={stats.total} description="Recebidos no sistema" icon={FileCheck2} />
        <StatCard title="Pendentes DCR" value={stats.pending} description={formatMoney(stats.pendingAmount)} icon={ShieldCheck} tone="gold" />
        <StatCard title="Aprovados" value={stats.approved} description="Prontos para recibo" icon={CheckCircle2} tone="success" />
        <StatCard title="Rejeitados" value={stats.rejected} description="Precisam correção" icon={XCircle} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <div className="card-premium min-w-0 overflow-hidden">
          <div className="border-b border-slate-100/80 bg-white/80 p-4 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-w-0">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input className="input-premium pl-11" placeholder="Buscar por estudante, matrícula, cobrança, referência ou método..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <select className="input-premium" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos estados</option>
                <option value="PENDING_REVIEW">Pendente DCR</option>
                <option value="UNDER_REVIEW">Em análise</option>
                <option value="APPROVED">Aprovado</option>
                <option value="REJECTED">Rejeitado</option>
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {filtered.length === 0 ? (
              <EmptyState title="Nenhum comprovativo encontrado" description="Quando os estudantes enviarem comprovativos pelo WhatsApp, eles aparecerão aqui para validação manual." />
            ) : (
              <div className="space-y-3">
                {filtered.map((proof) => (
                  <ProofCard key={proof.id || proof.proofCode} proof={proof} active={selected?.id === proof.id} onClick={() => setSelected(proof)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="card-premium min-w-0 p-4 xl:sticky xl:top-24 xl:self-start">
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Comprovativo selecionado</p>
                    <h2 className="mt-2 break-words text-base font-black text-slate-950">{selected.proofCode}</h2>
                  </div>
                  <StatusBadge status={selected.status} label={normalizeProofStatus(selected.status)} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-[0_14px_38px_rgba(15,23,42,.04)]">
                <Line label="Estudante" value={selected.studentName} />
                <Line label="Matrícula" value={selected.studentNumber} />
                <Line label="Cobrança" value={selected.chargeCode} />
                <Line label="Valor informado" value={formatMoney(selected.amount, selected.currency)} />
                <Line label="Método" value={selected.paymentMethod} />
                <Line label="Referência" value={selected.transactionReference} />
                <Line label="Recebido em" value={normalizeDateTime(selected.createdAt)} />
              </div>

              <div>
                <label className="label">Observação da DCR</label>
                <textarea className="input min-h-28" placeholder="Ex.: valor confirmado no extrato, referência bancária validada, ou motivo da rejeição..." value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.fileUrl && (
                  <a className="btn-secondary" href={selected.fileUrl} target="_blank" rel="noreferrer">
                    <Eye size={16} className="mr-2" />
                    Ver anexo
                  </a>
                )}
                <button className="btn-primary" onClick={handleApprove} disabled={working}>
                  <CheckCircle2 size={16} className="mr-2" />
                  Aprovar
                </button>
                <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={handleReject} disabled={working}>
                  <XCircle size={16} className="mr-2" />
                  Rejeitar
                </button>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-sm text-amber-900">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} />
                  <p className="font-semibold leading-6">A aprovação deve representar validação manual da DCR. O recibo institucional só deve ser emitido após confirmação do pagamento.</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Selecione um comprovativo" description="Escolha um item da lista para analisar e validar." icon={FileText} />
          )}
        </aside>
      </section>
    </div>
  );
}

function ProofCard({ proof, active, onClick }) {
  return (
    <button
      type="button"
      className={`w-full rounded-3xl border bg-white p-4 text-left shadow-[0_14px_38px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,.09)] ${active ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
      onClick={onClick}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_150px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-black text-slate-950">{proof.studentName}</p>
            <StatusBadge status={proof.status} label={normalizeProofStatus(proof.status)} />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{proof.studentNumber} · {proof.proofCode}</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">Cobrança: <span className="font-black text-imetro-navy">{proof.chargeCode}</span></p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Valor</p>
          <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(proof.amount, proof.currency)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">{proof.paymentMethod}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Recebido</p>
          <p className="mt-1 text-xs font-black text-slate-950">{normalizeDateTime(proof.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}
