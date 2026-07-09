import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import {
  generateTuitionCharges,
  listCharges,
  paymentGuidePdfUrl,
  sendIndividualGuide,
  sendTuitionGuides,
} from '../services/chargesService.js';
import {
  INSTITUTION_ID,
  chargeIsOpen,
  chargeIsOverdue,
  formatDate,
  formatMoney,
  normalizeCharge,
  normalizeText,
  safeText,
} from '../utils/formatters.js';

const DEFAULT_MONTH = '2026-07';

export default function ChargesPageV2() {
  const [rawCharges, setRawCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [month, setMonth] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [working, setWorking] = useState(false);

  const charges = useMemo(() => rawCharges.map(normalizeCharge), [rawCharges]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCharges();
      const normalized = data.map(normalizeCharge);
      setRawCharges(data);
      setSelected((current) => (current?.id ? normalized.find((item) => item.id === current.id) || normalized[0] || null : normalized[0] || null));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar cobranças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const months = useMemo(() => Array.from(new Set(charges.map((charge) => charge.referenceMonth).filter(Boolean))).sort().reverse(), [charges]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return charges.filter((charge) => {
      const text = normalizeText([charge.chargeCode, charge.description, charge.studentName, charge.studentNumber, charge.referenceMonth, charge.status].join(' '));
      const matchesSearch = !term || text.includes(term);
      const matchesStatus = status === 'ALL' || (status === 'OVERDUE' ? chargeIsOverdue(charge) : String(charge.status).toUpperCase() === status);
      const matchesMonth = month === 'ALL' || charge.referenceMonth === month;
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [charges, search, status, month]);

  const stats = useMemo(() => {
    const open = charges.filter(chargeIsOpen);
    const overdue = charges.filter(chargeIsOverdue);
    const pending = charges.filter((charge) => String(charge.status).toUpperCase() === 'PENDING');
    const paid = charges.filter((charge) => String(charge.status).toUpperCase() === 'PAID');
    const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
    return {
      total: charges.length,
      pending: pending.length,
      paid: paid.length,
      overdue: overdue.length,
      openAmount: sum(open, 'totalAmount'),
      overdueAmount: sum(overdue, 'totalAmount'),
      paidAmount: sum(paid, 'totalAmount'),
      paidInterestAmount: sum(paid, 'interestAmount'),
      paidFineAmount: sum(paid, 'fineAmount'),
      grossAmount: sum(charges, 'totalAmount'),
    };
  }, [charges]);

  const studentLedger = useMemo(() => {
    if (!selected) return [];
    return charges
      .filter((charge) => {
        const sameNumber = selected.studentNumber && selected.studentNumber !== '-' && charge.studentNumber === selected.studentNumber;
        const sameName = selected.studentName && selected.studentName !== '-' && charge.studentName === selected.studentName;
        return sameNumber || sameName;
      })
      .sort((a, b) => String(a.referenceMonth || '').localeCompare(String(b.referenceMonth || '')));
  }, [charges, selected]);

  const studentStats = useMemo(() => {
    const paid = studentLedger.filter((charge) => String(charge.status).toUpperCase() === 'PAID');
    const open = studentLedger.filter(chargeIsOpen);
    const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
    return {
      totalMonths: studentLedger.length,
      paidMonths: paid.length,
      openMonths: open.length,
      paidAmount: sum(paid, 'totalAmount'),
      openAmount: sum(open, 'totalAmount'),
      fineAmount: sum(studentLedger, 'fineAmount'),
      interestAmount: sum(studentLedger, 'interestAmount'),
    };
  }, [studentLedger]);

  const handleSendGuide = async (charge) => {
    setWorking(true);
    setActionMessage(null);
    try {
      const result = await sendIndividualGuide(charge.id);
      setActionMessage({ type: 'success', text: `Guia enviada/registrada para ${charge.chargeCode}. Estado: ${result?.status || 'processado'}` });
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Falha ao enviar guia.' });
    } finally {
      setWorking(false);
    }
  };

  const handleGenerateMonth = async () => {
    setWorking(true);
    setActionMessage(null);
    try {
      const result = await generateTuitionCharges({
        institutionId: INSTITUTION_ID,
        academicYear: '2024/2025',
        referenceMonth: DEFAULT_MONTH,
        dueDate: '2026-07-30',
        referenceDate: '2026-07-04',
        baseAmount: 45000,
        serviceCode: 'PROPINA',
        descriptionPrefix: 'Propina',
      });
      setActionMessage({ type: 'success', text: `Geração concluída: ${result?.createdCharges || 0} criadas, ${result?.reusedCharges || 0} reutilizadas.` });
      await load();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Falha ao gerar propinas.' });
    } finally {
      setWorking(false);
    }
  };

  const handleSendBatch = async () => {
    setWorking(true);
    setActionMessage(null);
    try {
      const result = await sendTuitionGuides({
        institutionId: INSTITUTION_ID,
        referenceMonth: month === 'ALL' ? DEFAULT_MONTH : month,
        chargeCodePrefix: 'IMT-PROPINA-',
        sendWhatsapp: true,
        sendEmail: true,
        sendSms: true,
        onlyPending: true,
        forceResend: false,
        maxItems: 50,
      });
      setActionMessage({ type: 'success', text: `Envio concluído: WhatsApp ${result?.sentWhatsapp || 0}, e-mail ${result?.sentEmail || 0}, SMS ${result?.sentSms || 0}.` });
      await load();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Falha ao enviar guias em lote.' });
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <LoadingState message="Carregando cobranças e propinas..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 overflow-hidden">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <WalletCards size={14} />
              Gestão de propinas, juros e conciliação
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Cobranças e propinas</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Consulta de guias, meses pagos, juros, multas, totais em aberto e histórico individual por estudante.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15" onClick={load} disabled={working}><RefreshCw size={16} />Atualizar</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15" onClick={handleGenerateMonth} disabled={working}><CalendarDays size={16} />Gerar propinas teste</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(16,185,129,.25)] transition hover:bg-emerald-600" onClick={handleSendBatch} disabled={working}><Send size={16} />Enviar guias</button>
          </div>
        </div>
      </section>

      {actionMessage && <div className={`rounded-2xl border p-4 text-sm font-black ${actionMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{actionMessage.text}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total de cobranças" value={stats.total} description="Registos financeiros" icon={Banknote} />
        <StatCard title="Pendentes" value={stats.pending} description="Aguardando pagamento" icon={WalletCards} tone="gold" />
        <StatCard title="Vencidas" value={stats.overdue} description={formatMoney(stats.overdueAmount)} icon={CalendarDays} tone="danger" />
        <StatCard title="Total em aberto" value={formatMoney(stats.openAmount)} description="Pendente + vencido" icon={FileText} tone="warning" />
        <StatCard title="Total recebido" value={formatMoney(stats.paidAmount)} description={`Juros: ${formatMoney(stats.paidInterestAmount)}`} icon={CheckCircle2} tone="success" />
        <StatCard title="Movimentado" value={formatMoney(stats.grossAmount)} description={`Multas recebidas: ${formatMoney(stats.paidFineAmount)}`} icon={Banknote} tone="info" />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(390px,.9fr)]">
        <div className="card-premium min-w-0 overflow-hidden">
          <div className="border-b border-slate-100/80 bg-white/80 p-4 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_150px]">
              <div className="relative min-w-0"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input-premium pl-11" placeholder="Buscar por código, estudante, matrícula ou mês..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <select className="input-premium" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Todos estados</option><option value="PENDING">Pendente</option><option value="OVERDUE">Vencida</option><option value="PAID">Pago</option><option value="CANCELLED">Cancelado</option></select>
              <select className="input-premium" value={month} onChange={(event) => setMonth(event.target.value)}><option value="ALL">Todos meses</option>{months.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </div>
          </div>
          <div className="max-h-[72vh] overflow-y-auto p-3 sm:p-4">
            {filtered.length === 0 ? <EmptyState /> : <div className="space-y-3">{filtered.map((charge) => <ChargeListItem key={charge.id || charge.chargeCode} charge={charge} active={selected?.id === charge.id} onClick={() => setSelected(charge)} />)}</div>}
          </div>
        </div>

        <aside className="card-premium min-w-0 p-4 xl:sticky xl:top-24 xl:self-start">
          {!selected ? <EmptyState title="Selecione uma cobrança" message="Clique numa cobrança para ver detalhes e ações." /> : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Detalhe da cobrança</p><h2 className="mt-2 break-words text-base font-black leading-6 text-slate-950">{selected.chargeCode}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{selected.description}</p></div><StatusBadge status={chargeIsOverdue(selected) ? 'OVERDUE' : selected.status} /></div></div>
              <div className="grid grid-cols-2 gap-2 2xl:grid-cols-4"><Mini label="Base" value={formatMoney(selected.amount, selected.currency)} /><Mini label="Multa" value={formatMoney(selected.fineAmount, selected.currency)} danger={selected.fineAmount > 0} /><Mini label="Juros" value={formatMoney(selected.interestAmount, selected.currency)} danger={selected.interestAmount > 0} /><Mini label="Total" value={formatMoney(selected.totalAmount, selected.currency)} strong /></div>
              <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-[0_14px_38px_rgba(15,23,42,.04)]"><div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-imetro-navy text-white shadow-lg"><ShieldCheck size={18} /></div><p className="font-black text-slate-900">Informações operacionais</p></div><Line label="Estudante" value={selected.studentName} /><Line label="Matrícula" value={selected.studentNumber} /><Line label="Referência" value={selected.referenceMonth} /><Line label="Vencimento" value={formatDate(selected.dueDate)} /><Line label="Estado" value={chargeIsOverdue(selected) ? 'Vencida/em atraso' : safeText(selected.status)} /></div>
              <StudentLedger charges={studentLedger} stats={studentStats} />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><a className="btn-secondary" href={paymentGuidePdfUrl(selected.chargeCode)} target="_blank" rel="noreferrer"><Eye size={15} className="mr-2" />Ver guia PDF</a><button className="btn-primary" onClick={() => handleSendGuide(selected)} disabled={working}><Send size={15} className="mr-2" />Enviar guia</button></div>
              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-sm text-imetro-navy"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} /><div><p className="font-black">Regra operacional</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Para conciliação, confira estudante, meses pagos, juros, multas e bordereaux emitidos.</p></div></div></div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function ChargeListItem({ charge, active, onClick }) {
  const overdue = chargeIsOverdue(charge);
  return (
    <button type="button" onClick={onClick} className={`group w-full rounded-3xl border bg-white p-4 text-left shadow-[0_14px_38px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,.09)] ${active ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-center">
        <div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="max-w-full break-words text-sm font-black text-slate-950">{charge.chargeCode}</p><StatusBadge status={overdue ? 'OVERDUE' : charge.status} /></div><p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{charge.description}</p><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="font-black text-slate-700">{charge.studentName || 'Estudante não informado'}</span><span>{charge.studentNumber || '-'}</span><span>{charge.referenceMonth || '-'}</span></div></div>
        <div className="grid grid-cols-2 gap-2"><div className="rounded-2xl bg-slate-50 px-3 py-2.5"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Total</p><p className="mt-1 break-words text-sm font-black text-slate-950">{formatMoney(charge.totalAmount, charge.currency)}</p>{charge.fineAmount > 0 && <p className="mt-1 text-[10px] font-black text-red-600">Multa: {formatMoney(charge.fineAmount, charge.currency)}</p>}{charge.interestAmount > 0 && <p className="mt-1 text-[10px] font-black text-amber-700">Juros: {formatMoney(charge.interestAmount, charge.currency)}</p>}</div><div className="rounded-2xl bg-slate-50 px-3 py-2.5"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Vencimento</p><p className="mt-1 text-sm font-black text-slate-950">{formatDate(charge.dueDate)}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{charge.referenceMonth || '-'}</p></div></div>
      </div>
    </button>
  );
}

function StudentLedger({ charges, stats }) {
  if (!charges.length) return null;
  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg"><Users size={18} /></div><div><p className="font-black text-slate-900">Histórico do estudante</p><p className="text-xs font-semibold text-slate-500">Todos os meses deste aluno</p></div></div><span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-blue-700">{stats.paidMonths}/{stats.totalMonths} pagos</span></div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><Mini label="Pago" value={formatMoney(stats.paidAmount)} strong /><Mini label="Em aberto" value={formatMoney(stats.openAmount)} danger={stats.openAmount > 0} /><Mini label="Multas" value={formatMoney(stats.fineAmount)} danger={stats.fineAmount > 0} /><Mini label="Juros" value={formatMoney(stats.interestAmount)} danger={stats.interestAmount > 0} /></div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">{charges.map((charge) => <div key={charge.id || charge.chargeCode} className="rounded-2xl border border-slate-100 bg-white p-3 text-xs shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="font-black text-slate-900">{charge.referenceMonth}</p><p className="mt-1 font-semibold text-slate-500">{charge.chargeCode}</p></div><StatusBadge status={chargeIsOverdue(charge) ? 'OVERDUE' : charge.status} /></div><div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600"><span>Base: {formatMoney(charge.amount, charge.currency)}</span><span>Multa: {formatMoney(charge.fineAmount, charge.currency)}</span><span>Juros: {formatMoney(charge.interestAmount, charge.currency)}</span><span>Total: {formatMoney(charge.totalAmount, charge.currency)}</span></div></div>)}</div>
    </div>
  );
}

function Mini({ label, value, strong, danger }) {
  return <div className={`min-w-0 rounded-2xl border p-3 ${danger ? 'border-red-100 bg-red-50 text-red-700' : strong ? 'border-blue-100 bg-blue-50 text-imetro-navy' : 'border-slate-100 bg-slate-50 text-slate-900'}`}><p className="text-[10px] font-black uppercase tracking-wide opacity-60">{label}</p><p className={`mt-1 break-words text-sm ${strong ? 'font-black' : 'font-bold'}`}>{value}</p></div>;
}

function Line({ label, value }) {
  return <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 first:pt-0 last:border-b-0 last:pb-0"><span className="shrink-0 font-semibold text-slate-500">{label}</span><span className="min-w-0 break-words text-right font-bold text-slate-800">{value}</span></div>;
}
