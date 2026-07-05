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
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="page-title">Recibos institucionais</h1>
          <p className="page-subtitle">Recibos emitidos após validação manual da DCR e confirmação do pagamento.</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de recibos" value={stats.total} description="Registros emitidos" icon={ReceiptText} />
        <StatCard title="Emitidos" value={stats.issued} description="Válidos/ativos" icon={ShieldCheck} tone="success" />
        <StatCard title="Valor emitido" value={formatMoney(stats.issuedAmount)} description="Total validado" icon={FileText} tone="gold" />
        <StatCard title="Cancelados" value={stats.cancelled} description="Anulados pela DCR" icon={FileText} tone="danger" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input className="input pl-10" placeholder="Buscar por recibo, estudante, matrícula, cobrança ou método..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <select className="input lg:w-52" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos estados</option>
                <option value="ISSUED">Emitido</option>
                <option value="SENT">Enviado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Nenhum recibo encontrado" description="Os recibos aprovados pela DCR aparecerão aqui para consulta e download." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Recibo</th>
                    <th className="px-5 py-3">Estudante</th>
                    <th className="px-5 py-3">Valor</th>
                    <th className="px-5 py-3">Emissão</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((receipt) => {
                    const active = selected?.id === receipt.id;
                    return (
                      <tr key={receipt.id || receipt.receiptCode} className={`cursor-pointer transition hover:bg-imetro-gold/5 ${active ? 'bg-imetro-gold/10' : ''}`} onClick={() => setSelected(receipt)}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{receipt.receiptCode}</p>
                          <p className="text-xs text-slate-500">Cobrança: {receipt.chargeCode}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">{receipt.studentName}</p>
                          <p className="text-xs text-slate-500">{receipt.studentNumber}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">{formatMoney(receipt.amount, receipt.currency)}</td>
                        <td className="px-5 py-4 text-slate-600">{normalizeDateTime(receipt.issuedAt)}</td>
                        <td className="px-5 py-4"><StatusBadge status={receipt.status} label={normalizeReceiptStatus(receipt.status)} /></td>
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
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recibo selecionado</p>
                  <h2 className="mt-1 text-base font-black text-slate-900">{selected.receiptCode}</h2>
                </div>
                <StatusBadge status={selected.status} label={normalizeReceiptStatus(selected.status)} />
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-bold text-slate-900">{selected.studentName}</p>
                <p className="text-slate-500">Matrícula: {selected.studentNumber}</p>
                <p className="mt-2 text-slate-600">Cobrança: <b>{selected.chargeCode}</b></p>
                <p className="text-slate-600">Valor: <b>{formatMoney(selected.amount, selected.currency)}</b></p>
                <p className="text-slate-600">Método: <b>{selected.paymentMethod}</b></p>
                <p className="text-slate-600">Emitido em: <b>{normalizeDateTime(selected.issuedAt)}</b></p>
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

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Recibo institucional emitido após validação da DCR. Este registro serve para consulta administrativa e suporte ao atendimento do estudante.
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
