import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Download, FileText, GraduationCap, ReceiptText, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import { listReceipts, receiptPdfUrl } from '../services/receiptsService.js';
import { chargeCategoryLabel, formatMoney, normalizeDateTime, normalizeReceipt, normalizeReceiptStatus, normalizeText } from '../utils/formatters.js';

export default function ReceiptsSeparatedPage() {
  const [receipts, setReceipts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(preferred = selected?.id) {
    setLoading(true); setError('');
    try {
      const data = (await listReceipts()).map(normalizeReceipt);
      setReceipts(data);
      setSelected(data.find((item) => item.id === preferred) || data[0] || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Falha ao carregar recibos.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(null); }, []);

  const filtered = useMemo(() => receipts.filter((item) => {
    const text = normalizeText(`${item.receiptCode} ${item.chargeCode} ${item.studentName} ${item.studentNumber} ${item.chargeDescription} ${item.referenceMonth}`);
    return (!search || text.includes(normalizeText(search)))
      && (category === 'ALL' || item.chargeCategory === category)
      && (status === 'ALL' || String(item.status).toUpperCase() === status);
  }), [receipts, search, category, status]);

  const tuition = receipts.filter((item) => item.chargeCategory === 'TUITION');
  const services = receipts.filter((item) => item.chargeCategory === 'ACADEMIC_SERVICE');
  const issued = receipts.filter((item) => ['VALID', 'ISSUED', 'ACTIVE', 'SENT'].includes(String(item.status).toUpperCase()));

  if (loading) return <LoadingState message="Carregando recibos e documentos separados..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return <div className="space-y-5">
    <section className="premium-hero"><div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="premium-pill"><ReceiptText size={14} /> Documentos financeiros separados</div><h1 className="mt-4 text-2xl font-black text-white sm:text-4xl">Recibos e documentos</h1><p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80">O borderô contém somente propinas. Matrícula, declarações e outros serviços aparecem no histórico de serviços académicos.</p></div><button onClick={() => load()} className="btn-light"><RefreshCw size={17} /> Atualizar</button></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={ReceiptText} label="Total de recibos" value={receipts.length} /><Stat icon={GraduationCap} label="Recibos de propinas" value={tuition.length} tone="blue" /><Stat icon={BookOpenCheck} label="Recibos de serviços" value={services.length} tone="violet" /><Stat icon={ShieldCheck} label="Valor validado" value={formatMoney(issued.reduce((sum, item) => sum + Number(item.amount || 0), 0))} tone="green" /></section>

    <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="card-premium overflow-hidden"><div className="grid gap-3 border-b border-slate-200 p-4 dark:border-white/10 md:grid-cols-[1fr_190px_190px]"><div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input-premium pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar recibo, estudante ou referência..." /></div><select className="input-premium" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">Todas categorias</option><option value="TUITION">Propinas</option><option value="ACADEMIC_SERVICE">Serviços académicos</option><option value="OTHER">Outros</option></select><select className="input-premium" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Todos estados</option><option value="VALID">Válido</option><option value="SENT">Enviado</option><option value="CANCELLED">Cancelado</option></select></div><div className="space-y-3 p-4">{filtered.length ? filtered.map((item) => <button key={item.id} onClick={() => setSelected(item)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.03]'}`}><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${item.chargeCategory === 'TUITION' ? 'bg-blue-100 text-blue-800' : 'bg-violet-100 text-violet-800'}`}>{chargeCategoryLabel(item.chargeCategory)}</span><p className="mt-3 text-sm font-black text-slate-950 dark:text-white">{item.receiptCode}</p><p className="mt-1 text-xs font-semibold text-slate-500">{item.studentName} · {item.studentNumber}</p><p className="mt-1 text-xs font-semibold text-slate-500">{item.chargeDescription || item.referenceMonth}</p></div><div className="text-right"><p className="text-sm font-black text-slate-950 dark:text-white">{formatMoney(item.amount, item.currency)}</p><p className="mt-1 text-xs font-bold text-slate-500">{normalizeReceiptStatus(item.status)}</p></div></div></button>) : <EmptyState title="Nenhum recibo" description="Ajuste os filtros ou aguarde novas validações." />}</div></div>

      <aside className="card-premium p-5 xl:sticky xl:top-24 xl:self-start">{selected ? <div className="space-y-4"><div><p className="text-xs font-black uppercase tracking-wide text-blue-700">{chargeCategoryLabel(selected.chargeCategory)}</p><h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{selected.receiptCode}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{selected.chargeCategory === 'TUITION' ? 'Este PDF funciona como borderô exclusivo de propinas.' : 'Este PDF apresenta somente o histórico de serviços académicos.'}</p></div><Details item={selected} />{receiptPdfUrl(selected) ? <a className="btn-primary w-full justify-center" href={receiptPdfUrl(selected)} target="_blank" rel="noreferrer"><Download size={16} /> {selected.chargeCategory === 'TUITION' ? 'Abrir borderô de propinas' : 'Abrir histórico de serviços'}</a> : null}<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><FileText size={18} className="mb-2" />Propinas e serviços académicos nunca são misturados no mesmo documento consolidado.</div></div> : <EmptyState title="Selecione um recibo" description="Consulte a categoria, a referência e o documento correspondente." />}</aside>
    </section>
  </div>;
}

function Details({ item }) { const rows = [['Estudante', item.studentName], ['Matrícula', item.studentNumber], ['Categoria', chargeCategoryLabel(item.chargeCategory)], ['Referência', item.chargeDescription || item.referenceMonth], ['Cobrança', item.chargeCode], ['Valor', formatMoney(item.amount, item.currency)], ['Método', item.paymentMethod], ['Estado', normalizeReceiptStatus(item.status)], ['Emitido', normalizeDateTime(item.issuedAt)]]; return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/[.03]">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-white/10"><span className="font-semibold text-slate-500">{label}</span><strong className="text-right text-slate-950 dark:text-white">{value || '-'}</strong></div>)}</div>; }
function Stat({ icon: Icon, label, value, tone = 'navy' }) { const colors = { navy: 'bg-slate-50 text-slate-950', blue: 'bg-blue-50 text-blue-950', violet: 'bg-violet-50 text-violet-950', green: 'bg-emerald-50 text-emerald-950' }; return <div className={`rounded-2xl p-4 ${colors[tone]}`}><div className="flex justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 break-words text-xl font-black">{value}</p></div><Icon size={20} /></div></div>; }
