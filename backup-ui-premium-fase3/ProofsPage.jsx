import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, FileCheck2, FileText, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
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
  safeText,
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
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="page-title">Comprovativos e validação DCR</h1>
          <p className="page-subtitle">Análise manual dos comprovativos recebidos antes da emissão do recibo institucional.</p>
        </div>
        <button className="btn-secondary" onClick={load} disabled={working}>
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </button>
      </div>

      {actionMessage && (
        <div className={`rounded-xl border p-4 text-sm font-semibold ${actionMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {actionMessage.text}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Comprovativos" value={stats.total} description="Recebidos no sistema" icon={FileCheck2} />
        <StatCard title="Pendentes DCR" value={stats.pending} description={formatMoney(stats.pendingAmount)} icon={ShieldCheck} tone="gold" />
        <StatCard title="Aprovados" value={stats.approved} description="Prontos para recibo" icon={CheckCircle2} tone="success" />
        <StatCard title="Rejeitados" value={stats.rejected} description="Precisam correção" icon={XCircle} tone="danger" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input className="input pl-10" placeholder="Buscar por estudante, matrícula, cobrança, referência ou método..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <select className="input lg:w-56" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos estados</option>
                <option value="PENDING_REVIEW">Pendente DCR</option>
                <option value="UNDER_REVIEW">Em análise</option>
                <option value="APPROVED">Aprovado</option>
                <option value="REJECTED">Rejeitado</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Nenhum comprovativo encontrado" description="Quando os estudantes enviarem comprovativos pelo WhatsApp, eles aparecerão aqui para validação manual." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Estudante</th>
                    <th className="px-5 py-3">Cobrança</th>
                    <th className="px-5 py-3">Valor</th>
                    <th className="px-5 py-3">Método</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((proof) => {
                    const active = selected?.id === proof.id;
                    return (
                      <tr key={proof.id || proof.proofCode} className={`cursor-pointer transition hover:bg-imetro-gold/5 ${active ? 'bg-imetro-gold/10' : ''}`} onClick={() => setSelected(proof)}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{proof.studentName}</p>
                          <p className="text-xs text-slate-500">{proof.studentNumber}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">{proof.chargeCode}</p>
                          <p className="text-xs text-slate-500">{normalizeDateTime(proof.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">{formatMoney(proof.amount, proof.currency)}</td>
                        <td className="px-5 py-4 text-slate-600">{proof.paymentMethod}</td>
                        <td className="px-5 py-4"><StatusBadge status={proof.status} label={normalizeProofStatus(proof.status)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="card p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Comprovativo selecionado</p>
                  <h2 className="mt-1 text-base font-black text-slate-900">{selected.proofCode}</h2>
                </div>
                <StatusBadge status={selected.status} label={normalizeProofStatus(selected.status)} />
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-bold text-slate-900">{selected.studentName}</p>
                <p className="text-slate-500">Matrícula: {selected.studentNumber}</p>
                <p className="mt-2 text-slate-600">Cobrança: <b>{selected.chargeCode}</b></p>
                <p className="text-slate-600">Valor informado: <b>{formatMoney(selected.amount, selected.currency)}</b></p>
                <p className="text-slate-600">Método: <b>{selected.paymentMethod}</b></p>
                <p className="text-slate-600">Referência: <b>{selected.transactionReference}</b></p>
                <p className="text-slate-600">Recebido em: <b>{normalizeDateTime(selected.createdAt)}</b></p>
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

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                A aprovação deve representar validação manual da DCR. O recibo institucional só deve ser emitido após confirmação do pagamento.
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
