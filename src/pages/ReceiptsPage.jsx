import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, ReceiptText, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { listReceipts, receiptPdfUrl } from '../services/receiptsService.js';
import {
  formatMoney,
  normalizeDateTime,
  normalizeReceipt,
  normalizeReceiptStatus,
  normalizeText,
} from '../utils/formatters.js';

export default function ReceiptsPage() {
  const [rawReceipts, setRawReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selected, setSelected] = useState(null);

  const receipts = useMemo(() => rawReceipts.map(normalizeReceipt), [rawReceipts]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReceipts();
      setRawReceipts(data);
      if (data.length > 0 && !selected) setSelected(normalizeReceipt(data[0]));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar recibos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return receipts.filter((receipt) => {
      const text = normalizeText([
        receipt.receiptCode,
        receipt.chargeCode,
        receipt.studentName,
        receipt.studentNumber,
        receipt.paymentMethod,
        receipt.status,
      ].join(' '));
      const matchesSearch = !term || text.includes(term);
      const matchesStatus = status === 'ALL' || String(receipt.status).toUpperCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [receipts, search, status]);

  const stats = useMemo(() => {
    const issued = receipts.filter((item) => ['ISSUED', 'ACTIVE', 'SENT'].includes(String(item.status).toUpperCase()));
    const cancelled = receipts.filter((item) => ['CANCELLED', 'CANCELED'].includes(String(item.status).toUpperCase()));
    return {
      total: receipts.length,
      issued: issued.length,
      cancelled: cancelled.length,
      issuedAmount: issued.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [receipts]);

  if (loading) return <LoadingState message="Carregando recibos institucionais..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <ReceiptText size={14} />
              Documentos financeiros
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Recibos institucionais</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Recibos emitidos após validação manual da DCR e confirmação do pagamento.
            </p>
          </div>
          <button className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15" onClick={load}>
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de recibos" value={stats.total} description="Registos emitidos" icon={ReceiptText} />
        <StatCard title="Emitidos" value={stats.issued} description="Válidos/ativos" icon={ShieldCheck} tone="success" />
        <StatCard title="Valor emitido" value={formatMoney(stats.issuedAmount)} description="Total validado" icon={FileText} tone="gold" />
        <StatCard title="Cancelados" value={stats.cancelled} description="Anulados pela DCR" icon={FileText} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <div className="card-premium min-w-0 overflow-hidden">
          <div className="border-b border-slate-100/80 bg-white/80 p-4 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-w-0">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input className="input-premium pl-11" placeholder="Buscar por recibo, estudante, matrícula, cobrança ou método..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <select className="input-premium" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos estados</option>
                <option value="ISSUED">Emitido</option>
                <option value="SENT">Enviado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {filtered.length === 0 ? (
              <EmptyState title="Nenhum recibo encontrado" description="Os recibos aprovados pela DCR aparecerão aqui para consulta e download." />
            ) : (
              <div className="space-y-3">
                {filtered.map((receipt) => (
                  <ReceiptCard key={receipt.id || receipt.receiptCode} receipt={receipt} active={selected?.id === receipt.id} onClick={() => setSelected(receipt)} />
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
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Recibo selecionado</p>
                    <h2 className="mt-2 break-words text-base font-black text-slate-950">{selected.receiptCode}</h2>
                  </div>
                  <StatusBadge status={selected.status} label={normalizeReceiptStatus(selected.status)} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-[0_14px_38px_rgba(15,23,42,.04)]">
                <Line label="Estudante" value={selected.studentName} />
                <Line label="Matrícula" value={selected.studentNumber} />
                <Line label="Cobrança" value={selected.chargeCode} />
                <Line label="Valor" value={formatMoney(selected.amount, selected.currency)} />
                <Line label="Método" value={selected.paymentMethod} />
                <Line label="Emitido em" value={normalizeDateTime(selected.issuedAt)} />
              </div>

              <div className="flex flex-wrap gap-2">
                {receiptPdfUrl(selected) && (
                  <a className="btn-primary" href={receiptPdfUrl(selected)} target="_blank" rel="noreferrer">
                    <Download size={16} className="mr-2" />
                    Baixar PDF
                  </a>
                )}
                {receiptPdfUrl(selected) && (
                  <a className="btn-secondary" href={receiptPdfUrl(selected)} target="_blank" rel="noreferrer">
                    <Eye size={16} className="mr-2" />
                    Ver recibo
                  </a>
                )}
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 text-sm text-emerald-800">
                <p className="font-semibold leading-6">Recibo institucional emitido após validação da DCR. Este registo serve para consulta administrativa e suporte ao atendimento do estudante.</p>
              </div>
            </div>
          ) : (
            <EmptyState title="Selecione um recibo" description="Escolha um item da lista para visualizar os detalhes e baixar o PDF." icon={ReceiptText} />
          )}
        </aside>
      </section>
    </div>
  );
}

function ReceiptCard({ receipt, active, onClick }) {
  return (
    <button
      type="button"
      className={`w-full rounded-3xl border bg-white p-4 text-left shadow-[0_14px_38px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,.09)] ${active ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
      onClick={onClick}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_150px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-black text-slate-950">{receipt.receiptCode}</p>
            <StatusBadge status={receipt.status} label={normalizeReceiptStatus(receipt.status)} />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">Cobrança: {receipt.chargeCode}</p>
          <p className="mt-2 text-sm font-black text-slate-800">{receipt.studentName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{receipt.studentNumber}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Valor</p>
          <p className="mt-1 text-sm font-black text-slate-950">{formatMoney(receipt.amount, receipt.currency)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">{receipt.paymentMethod}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Emissão</p>
          <p className="mt-1 text-xs font-black text-slate-950">{normalizeDateTime(receipt.issuedAt)}</p>
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
