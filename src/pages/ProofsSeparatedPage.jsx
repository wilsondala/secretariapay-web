import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, FileCheck2, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { approvePaymentProof, listPaymentProofs, openPaymentProofAttachment, rejectPaymentProof } from '../services/proofsService.js';
import usePermissions from '../shared/auth/usePermissions.js';
import { chargeCategoryLabel, formatMoney, normalizeDateTime, normalizePaymentProof, normalizeProofStatus, normalizeText } from '../utils/formatters.js';

const REVIEWABLE = ['PENDING', 'PENDING_REVIEW', 'UNDER_REVIEW'];
const APPROVED = ['APPROVED', 'VALIDATED'];

export default function ProofsSeparatedPage() {
  const { can } = usePermissions();
  const canValidate = can('validateProofs');
  const [proofs, setProofs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load(preferredId = selected?.id) {
    setLoading(true);
    setError('');
    try {
      const data = (await listPaymentProofs()).map(normalizePaymentProof);
      setProofs(data);
      setSelected(data.find((item) => item.id === preferredId) || data[0] || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Falha ao carregar comprovativos.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(null); }, []);

  const filtered = useMemo(() => proofs.filter((proof) => {
    const text = normalizeText(`${proof.proofCode} ${proof.chargeCode} ${proof.studentName} ${proof.studentNumber} ${proof.chargeDescription} ${proof.referenceMonth}`);
    return (!search || text.includes(normalizeText(search)))
      && (category === 'ALL' || proof.chargeCategory === category)
      && (status === 'ALL' || String(proof.status).toUpperCase() === status);
  }), [proofs, search, category, status]);

  const stats = useMemo(() => ({
    total: proofs.length,
    tuition: proofs.filter((item) => item.chargeCategory === 'TUITION').length,
    services: proofs.filter((item) => item.chargeCategory === 'ACADEMIC_SERVICE').length,
    pending: proofs.filter((item) => REVIEWABLE.includes(String(item.status).toUpperCase())).length,
  }), [proofs]);

  const selectedStatus = String(selected?.status || '').toUpperCase();
  const selectedIsReviewable = REVIEWABLE.includes(selectedStatus);
  const selectedIsApproved = APPROVED.includes(selectedStatus);
  const selectedIsRejected = selectedStatus === 'REJECTED';

  function applyReviewResult(result, action) {
    const fallbackStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const reviewed = normalizePaymentProof({
      ...selected,
      ...result,
      status: result?.status || fallbackStatus,
    });

    setProofs((current) => current.map((proof) => (proof.id === reviewed.id ? reviewed : proof)));
    setSelected(reviewed);
  }

  async function review(action) {
    if (!selected?.id || !canValidate) return;
    if (!selectedIsReviewable) { setMessage('Este comprovativo já foi processado.'); return; }
    if (action === 'reject' && !notes.trim()) { setMessage('Informe o motivo da rejeição.'); return; }
    setWorking(true); setReviewAction(action); setMessage('');
    try {
      const result = action === 'approve'
        ? await approvePaymentProof(selected.id, { notes: notes.trim() || 'Aprovado pela DCR no painel.' })
        : await rejectPaymentProof(selected.id, { reason: notes.trim() });
      applyReviewResult(result, action);
      setMessage(action === 'approve' ? `Comprovativo aprovado${result?.receiptCode ? `; recibo ${result.receiptCode} emitido` : ''}.` : 'Comprovativo rejeitado.');
      setNotes('');
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || requestError.message || 'Falha ao processar comprovativo.');
    } finally { setWorking(false); setReviewAction(''); }
  }

  if (loading) return <LoadingState message="Carregando comprovativos separados por categoria..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return <div className="space-y-5">
    <section className="premium-hero"><div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="premium-pill"><FileCheck2 size={14} /> Validação manual DCR</div><h1 className="mt-4 text-2xl font-black text-white sm:text-4xl">Comprovativos de pagamento</h1><p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80">Cada comprovativo identifica se pertence a uma propina ou a um serviço académico.</p></div><button onClick={() => load()} className="btn-light"><RefreshCw size={17} /> Atualizar</button></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total" value={stats.total} icon={FileCheck2} /><Stat label="Propinas" value={stats.tuition} icon={ShieldCheck} tone="blue" /><Stat label="Serviços académicos" value={stats.services} icon={CheckCircle2} tone="violet" /><Stat label="Pendentes DCR" value={stats.pending} icon={AlertTriangle} tone="amber" /></section>
    {message ? <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">{message}</div> : null}

    <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="card-premium overflow-hidden"><div className="grid gap-3 border-b border-slate-200 p-4 dark:border-white/10 md:grid-cols-[1fr_190px_190px]"><div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input-premium pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudante, cobrança ou referência..." /></div><select className="input-premium" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">Todas categorias</option><option value="TUITION">Propinas</option><option value="ACADEMIC_SERVICE">Serviços académicos</option><option value="OTHER">Outros</option></select><select className="input-premium" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Todos estados</option><option value="PENDING_REVIEW">Pendente DCR</option><option value="APPROVED">Aprovado</option><option value="REJECTED">Rejeitado</option></select></div><div className="space-y-3 p-4">{filtered.length ? filtered.map((proof) => <button key={proof.id} onClick={() => { setSelected(proof); setNotes(''); setMessage(''); }} className={`w-full rounded-2xl border p-4 text-left ${selected?.id === proof.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.03]'}`}><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${proof.chargeCategory === 'TUITION' ? 'bg-blue-100 text-blue-800' : 'bg-violet-100 text-violet-800'}`}>{chargeCategoryLabel(proof.chargeCategory)}</span><p className="mt-3 text-sm font-black text-slate-950 dark:text-white">{proof.studentName}</p><p className="mt-1 text-xs font-semibold text-slate-500">{proof.studentNumber} · {proof.chargeDescription || proof.referenceMonth}</p></div><div className="text-right"><p className="text-sm font-black text-slate-950 dark:text-white">{formatMoney(proof.amount, proof.currency)}</p><p className="mt-1 text-xs font-bold text-slate-500">{normalizeProofStatus(proof.status)}</p></div></div></button>) : <EmptyState title="Nenhum comprovativo" description="Ajuste os filtros ou aguarde novos envios." />}</div></div>

      <aside className="card-premium p-5 xl:sticky xl:top-24 xl:self-start">
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">{chargeCategoryLabel(selected.chargeCategory)}</p>
              <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{selected.proofCode}</h2>
            </div>
            <Details item={selected} />
            <button onClick={() => openPaymentProofAttachment(selected.id)} className="btn-secondary w-full justify-center" disabled={working}>
              <Eye size={16} /> Abrir anexo
            </button>
            <textarea
              className="input-premium min-h-28 resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={selectedIsReviewable ? 'Observação da DCR ou motivo da rejeição...' : 'Este comprovativo já foi processado.'}
              disabled={!canValidate || !selectedIsReviewable || working}
            />
            {canValidate ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => review('approve')}
                  disabled={working || !selectedIsReviewable}
                  className={`justify-center ${selectedIsApproved ? 'inline-flex items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-3 font-black text-white disabled:cursor-default disabled:opacity-100' : 'btn-primary'}`}
                >
                  {working && reviewAction === 'approve' ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  {selectedIsApproved ? 'Aprovado' : working && reviewAction === 'approve' ? 'Aprovando...' : 'Aprovar'}
                </button>
                <button
                  onClick={() => review('reject')}
                  disabled={working || !selectedIsReviewable}
                  className={`justify-center ${selectedIsRejected ? 'inline-flex items-center gap-2 rounded-xl border border-red-600 bg-red-600 px-4 py-3 font-black text-white disabled:cursor-default disabled:opacity-100' : 'btn-secondary text-red-700'}`}
                >
                  {working && reviewAction === 'reject' ? <RefreshCw className="animate-spin" size={16} /> : <XCircle size={16} />}
                  {selectedIsRejected ? 'Rejeitado' : working && reviewAction === 'reject' ? 'Rejeitando...' : 'Rejeitar'}
                </button>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500">Perfil em modo de consulta.</p>
            )}
            {!selectedIsReviewable ? (
              <p className={`rounded-xl border p-3 text-xs font-bold ${selectedIsRejected ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {selectedIsRejected ? 'Comprovativo rejeitado. As ações foram bloqueadas.' : 'Comprovativo aprovado. As ações foram bloqueadas para evitar duplicidade.'}
              </p>
            ) : null}
          </div>
        ) : (
          <EmptyState title="Selecione um comprovativo" description="Consulte a categoria e os dados da cobrança." />
        )}
      </aside>
    </section>
  </div>;
}

function Details({ item }) { const rows = [['Estudante', item.studentName], ['Matrícula', item.studentNumber], ['Categoria', chargeCategoryLabel(item.chargeCategory)], ['Referência', item.chargeDescription || item.referenceMonth], ['Cobrança', item.chargeCode], ['Valor', formatMoney(item.amount, item.currency)], ['Estado', normalizeProofStatus(item.status)], ['Recebido', normalizeDateTime(item.createdAt)]]; return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/[.03]">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-white/10"><span className="font-semibold text-slate-500">{label}</span><strong className="text-right text-slate-950 dark:text-white">{value || '-'}</strong></div>)}</div>; }
function Stat({ icon: Icon, label, value, tone = 'navy' }) { const colors = { navy: 'bg-slate-50 text-slate-950', blue: 'bg-blue-50 text-blue-950', violet: 'bg-violet-50 text-violet-950', amber: 'bg-amber-50 text-amber-950' }; return <div className={`rounded-2xl p-4 ${colors[tone]}`}><div className="flex justify-between"><div><p className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div><Icon size={20} /></div></div>; }
