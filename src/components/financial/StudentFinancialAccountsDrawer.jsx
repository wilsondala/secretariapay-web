import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Loader2,
  ReceiptText,
  WalletCards,
  X,
} from 'lucide-react';
import EmptyState from '../ui/EmptyState.jsx';
import StudentMonthlyLedger from './StudentMonthlyLedger.jsx';
import { listChargesByStudent } from '../../services/chargesService.js';
import { listPaymentProofs } from '../../services/proofsService.js';
import { listReceipts, receiptPdfUrl } from '../../services/receiptsService.js';
import {
  academicServiceLabel,
  chargeIsOpen,
  formatDate,
  formatMoney,
  getStudentName,
  getStudentNumber,
  isAcademicServiceCharge,
  isTuitionCharge,
  normalizeCharge,
  normalizeChargeStatus,
  normalizeDateTime,
  normalizePaymentProof,
  normalizeReceipt,
} from '../../utils/formatters.js';
import { buildSeparatedSummary, matchesStudentNumber } from '../../utils/financialSeparation.js';

const TABS = [
  ['SUMMARY', 'Resumo', WalletCards],
  ['TUITION', 'Propinas', GraduationCap],
  ['SERVICES', 'Serviços', BookOpenCheck],
  ['PROOFS', 'Comprovativos', FileCheck2],
  ['DOCUMENTS', 'Documentos', ReceiptText],
];

export default function StudentFinancialAccountsDrawer({ student, cachedCharges = [], onClose, onChargesUpdated }) {
  const [tab, setTab] = useState('SUMMARY');
  const [charges, setCharges] = useState(cachedCharges);
  const [proofs, setProofs] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', close); };
  }, [onClose]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [chargeData, proofData, receiptData] = await Promise.all([
          listChargesByStudent(student.id),
          listPaymentProofs().catch(() => []),
          listReceipts().catch(() => []),
        ]);
        if (!mounted) return;
        const normalizedCharges = chargeData.map(normalizeCharge);
        setCharges(normalizedCharges);
        setProofs(proofData.map(normalizePaymentProof).filter((item) => matchesStudentNumber(item.studentNumber, student)));
        setReceipts(receiptData.map(normalizeReceipt).filter((item) => matchesStudentNumber(item.studentNumber, student)));
        onChargesUpdated?.(normalizedCharges);
      } catch (requestError) {
        if (mounted) setError(requestError?.response?.data?.message || requestError.message || 'Falha ao carregar o detalhe financeiro.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [student.id]);

  const active = charges.filter((item) => !['CANCELLED', 'CANCELED', 'RENEGOTIATED'].includes(String(item.status).toUpperCase()));
  const tuition = active.filter(isTuitionCharge);
  const services = active.filter(isAcademicServiceCharge);
  const summary = buildSeparatedSummary(active);
  const tuitionProofs = proofs.filter((item) => item.chargeCategory === 'TUITION');
  const serviceProofs = proofs.filter((item) => item.chargeCategory === 'ACADEMIC_SERVICE');
  const tuitionReceipts = receipts.filter((item) => item.chargeCategory === 'TUITION');
  const serviceReceipts = receipts.filter((item) => item.chargeCategory === 'ACADEMIC_SERVICE');

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" aria-label="Fechar detalhe" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl dark:border-white/10 dark:bg-[#08111F]">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#0F172A] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[.14em] text-blue-700 dark:text-blue-300">Contas financeiras separadas</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{getStudentName(student)}</h2><p className="mt-1 text-sm font-bold text-slate-500">Matrícula {getStudentNumber(student)}</p></div>
            <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><X size={20} /></button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{TABS.map(([value, label, Icon]) => <button key={value} onClick={() => setTab(value)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${tab === value ? 'bg-[#3157D5] text-white' : 'border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}><Icon size={15} />{label}</button>)}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error ? <div className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertTriangle size={18} />{error}</div> : null}
          {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} />Carregando contas...</div> : null}
          {!loading && tab === 'SUMMARY' ? <Summary summary={summary} /> : null}
          {!loading && tab === 'TUITION' ? <Tuition student={student} charges={tuition} receipts={tuitionReceipts} /> : null}
          {!loading && tab === 'SERVICES' ? <Services charges={services} receipts={serviceReceipts} /> : null}
          {!loading && tab === 'PROOFS' ? <Proofs tuition={tuitionProofs} services={serviceProofs} /> : null}
          {!loading && tab === 'DOCUMENTS' ? <Documents tuition={tuitionReceipts} services={serviceReceipts} /> : null}
        </div>
      </aside>
    </div>
  );
}

function Summary({ summary }) {
  return <div className="space-y-5">
    <AccountSummary title="Conta de propinas" values={summary.tuition} />
    <AccountSummary title="Conta de serviços académicos" values={summary.services} />
    <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-400/20 dark:bg-blue-500/10"><p className="text-xs font-black uppercase tracking-wide text-blue-600">Saldo financeiro total</p><p className="mt-2 text-3xl font-black text-blue-950 dark:text-white">{formatMoney(summary.totalOpen)}</p><p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-200">O total é informativo. Cada conta mantém os próprios comprovativos e documentos.</p></div>
  </div>;
}

function AccountSummary({ title, values }) {
  return <section><h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Pagos" value={values.paidCount} tone="green" /><Metric label="Em aberto" value={values.openCount} tone="amber" /><Metric label="Total pago" value={formatMoney(values.paidAmount)} /><Metric label="Saldo" value={formatMoney(values.openAmount)} tone={values.openAmount ? 'red' : 'green'} /></div></section>;
}

function Tuition({ student, charges, receipts }) {
  const document = receipts[0];
  return <div className="space-y-4"><div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-blue-950 dark:text-white">Conta exclusiva de propinas</p><p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-200">Matrícula e demais serviços não aparecem no borderô.</p></div>{document && receiptPdfUrl(document) ? <a className="btn-primary" href={receiptPdfUrl(document)} target="_blank" rel="noreferrer"><Download size={16} /> Borderô de propinas</a> : null}</div><StudentMonthlyLedger student={student} charges={charges} loading={false} /></div>;
}

function Services({ charges, receipts }) {
  if (!charges.length) return <EmptyState title="Nenhum serviço académico" description="Matrícula, declarações, exames, certificado e diploma aparecerão aqui." icon={BookOpenCheck} />;
  const receiptMap = new Map(receipts.map((item) => [String(item.chargeId || ''), item]));
  return <div className="space-y-3">{charges.map((charge) => { const receipt = receiptMap.get(String(charge.id)); return <div key={charge.id || charge.chargeCode} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.04]"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black text-violet-700">SERVIÇO ACADÉMICO</span><h3 className="mt-3 text-sm font-black text-slate-950 dark:text-white">{academicServiceLabel(charge.serviceCode, charge.description)}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{charge.referenceMonth} · {formatDate(charge.dueDate)}</p></div><div className="sm:text-right"><p className={`text-lg font-black ${chargeIsOpen(charge) ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(charge.totalAmount)}</p><p className="text-xs font-bold text-slate-500">{normalizeChargeStatus(charge.status)}</p></div></div>{receipt && receiptPdfUrl(receipt) ? <a className="mt-3 inline-flex items-center gap-2 text-xs font-black text-blue-700" href={receiptPdfUrl(receipt)} target="_blank" rel="noreferrer"><ReceiptText size={15} /> Abrir recibo</a> : null}</div>; })}</div>;
}

function Proofs({ tuition, services }) {
  return <div className="space-y-6"><ProofGroup title="Comprovativos de propinas" items={tuition} /><ProofGroup title="Comprovativos de serviços académicos" items={services} /></div>;
}
function ProofGroup({ title, items }) { return <section><h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>{items.length ? <div className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.04]"><div className="flex justify-between gap-3"><div><p className="text-sm font-black text-slate-950 dark:text-white">{item.chargeDescription || item.referenceMonth}</p><p className="mt-1 text-xs font-semibold text-slate-500">{item.proofCode} · {item.chargeCode}</p></div><div className="text-right"><p className="text-sm font-black text-slate-950 dark:text-white">{formatMoney(item.amount, item.currency)}</p><p className="text-xs font-bold text-slate-500">{item.status}</p></div></div></div>)}</div> : <p className="mt-3 rounded-2xl bg-slate-100 p-4 text-xs font-semibold text-slate-500 dark:bg-white/5">Nenhum comprovativo encontrado.</p>}</section>; }

function Documents({ tuition, services }) {
  return <div className="space-y-6"><DocumentGroup title="Recibos e borderô de propinas" items={tuition} label="Abrir borderô de propinas" /><DocumentGroup title="Recibos e histórico de serviços" items={services} label="Abrir histórico de serviços" /></div>;
}
function DocumentGroup({ title, items, label }) { const document = items[0]; return <section><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>{document && receiptPdfUrl(document) ? <a className="btn-secondary" href={receiptPdfUrl(document)} target="_blank" rel="noreferrer"><Download size={16} /> {label}</a> : null}</div>{items.length ? <div className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.04]"><div><p className="text-sm font-black text-slate-950 dark:text-white">{item.chargeDescription || item.referenceMonth}</p><p className="mt-1 text-xs font-semibold text-slate-500">{item.receiptCode} · {normalizeDateTime(item.issuedAt)}</p></div>{receiptPdfUrl(item) ? <a href={receiptPdfUrl(item)} target="_blank" rel="noreferrer" className="text-blue-700"><FileText size={18} /></a> : null}</div>)}</div> : <p className="mt-3 rounded-2xl bg-slate-100 p-4 text-xs font-semibold text-slate-500 dark:bg-white/5">Nenhum documento emitido.</p>}</section>; }

function Metric({ label, value, tone = 'blue' }) { const colors = { blue: 'bg-blue-50 text-blue-950', green: 'bg-emerald-50 text-emerald-950', amber: 'bg-amber-50 text-amber-950', red: 'bg-red-50 text-red-900' }; return <div className={`rounded-2xl p-3 ${colors[tone]}`}><p className="text-[9px] font-black uppercase tracking-wide opacity-70">{label}</p><p className="mt-1 break-words text-sm font-black">{value}</p></div>; }
