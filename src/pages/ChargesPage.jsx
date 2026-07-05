import { useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarDays, Eye, FileText, RefreshCw, Search, Send, WalletCards } from 'lucide-react';
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

export default function ChargesPage() {
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
      setRawCharges(data);
      if (!selected && data.length > 0) setSelected(normalizeCharge(data[0]));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar cobranças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const months = useMemo(() => {
    const values = Array.from(new Set(charges.map((charge) => charge.referenceMonth).filter(Boolean)));
    return values.sort().reverse();
  }, [charges]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return charges.filter((charge) => {
      const text = normalizeText([
        charge.chargeCode,
        charge.description,
        charge.studentName,
        charge.studentNumber,
        charge.referenceMonth,
        charge.status,
      ].join(' '));
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
    return {
      total: charges.length,
      pending: pending.length,
      overdue: overdue.length,
      openAmount: open.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0),
      overdueAmount: overdue.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0),
    };
  }, [charges]);

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
      setActionMessage({
        type: 'success',
        text: `Geração concluída: ${result?.createdCharges || 0} criadas, ${result?.reusedCharges || 0} reutilizadas.`,
      });
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
      setActionMessage({
        type: 'success',
        text: `Envio concluído: WhatsApp ${result?.sentWhatsapp || 0}, e-mail ${result?.sentEmail || 0}, SMS ${result?.sentSms || 0}, já enviadas ${result?.skippedAlreadySent || 0}.`,
      });
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
    <div className="space-y-4 overflow-hidden">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <h1 className="page-title">Cobranças e propinas</h1>
          <p className="page-subtitle">Consulta real de cobranças, guias PDF, multas DCR e envio por WhatsApp.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={load} disabled={working}>
            <RefreshCw size={15} className="mr-2" />
            Atualizar
          </button>
          <button className="btn-secondary" onClick={handleGenerateMonth} disabled={working}>
            <CalendarDays size={15} className="mr-2" />
            Gerar propinas teste
          </button>
          <button className="btn-primary" onClick={handleSendBatch} disabled={working}>
            <Send size={15} className="mr-2" />
            Enviar guias do mês
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`rounded-xl border p-3 text-xs font-semibold ${actionMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {actionMessage.text}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de cobranças" value={stats.total} description="Registros financeiros" icon={Banknote} />
        <StatCard title="Pendentes" value={stats.pending} description="Aguardando pagamento" icon={WalletCards} tone="gold" />
        <StatCard title="Vencidas" value={stats.overdue} description={formatMoney(stats.overdueAmount)} icon={CalendarDays} tone="danger" />
        <StatCard title="Total em aberto" value={formatMoney(stats.openAmount)} description="Pendente + vencido" icon={FileText} tone="warning" />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.72fr)]">
        <div className="card min-w-0 overflow-hidden">
          <div className="border-b border-slate-100 p-3">
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_160px_145px]">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  className="input pl-9"
                  placeholder="Buscar por código, estudante, matrícula ou mês..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos estados</option>
                <option value="PENDING">Pendente</option>
                <option value="OVERDUE">Vencida</option>
                <option value="PAID">Pago</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <select className="input" value={month} onChange={(event) => setMonth(event.target.value)}>
                <option value="ALL">Todos meses</option>
                {months.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-3">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {filtered.map((charge) => (
                  <ChargeListItem
                    key={charge.id || charge.chargeCode}
                    charge={charge}
                    active={selected?.id === charge.id}
                    onClick={() => setSelected(charge)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="card min-w-0 p-3 xl:sticky xl:top-20 xl:self-start">
          {!selected ? (
            <EmptyState title="Selecione uma cobrança" message="Clique numa cobrança para ver detalhes e ações." />
          ) : (
            <div className="space-y-3">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Detalhe da cobrança</p>
                    <h2 className="mt-1 break-words text-sm font-black text-slate-900">{selected.chargeCode}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{selected.description}</p>
                  </div>
                  <StatusBadge status={chargeIsOverdue(selected) ? 'OVERDUE' : selected.status} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Mini label="Base" value={formatMoney(selected.amount, selected.currency)} />
                <Mini label="Multa" value={formatMoney(selected.fineAmount, selected.currency)} danger={selected.fineAmount > 0} />
                <Mini label="Total" value={formatMoney(selected.totalAmount, selected.currency)} strong />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs">
                <Line label="Estudante" value={selected.studentName} />
                <Line label="Matrícula" value={selected.studentNumber} />
                <Line label="Referência" value={selected.referenceMonth} />
                <Line label="Vencimento" value={formatDate(selected.dueDate)} />
                <Line label="Estado" value={chargeIsOverdue(selected) ? 'Vencida/em atraso' : safeText(selected.status)} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <a className="btn-secondary" href={paymentGuidePdfUrl(selected.chargeCode)} target="_blank" rel="noreferrer">
                  <Eye size={15} className="mr-2" />
                  Ver guia PDF
                </a>
                <button className="btn-primary" onClick={() => handleSendGuide(selected)} disabled={working}>
                  <Send size={15} className="mr-2" />
                  Enviar guia
                </button>
              </div>

              <div className="rounded-xl bg-imetro-goldSoft p-3 text-xs text-imetro-navy">
                <p className="font-black">Regra operacional</p>
                <p className="mt-1 leading-5">A guia é enviada apenas para contacto oficial do estudante. O recibo só deve ser emitido após validação manual da DCR.</p>
              </div>
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
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-imetro-gold bg-imetro-goldSoft/70 shadow-sm' : 'border-slate-100 bg-white hover:border-imetro-gold/50 hover:bg-slate-50'}`}
    >
      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="max-w-full break-words text-xs font-black text-slate-950 lg:text-[13px]">{charge.chargeCode}</p>
            <StatusBadge status={overdue ? 'OVERDUE' : charge.status} />
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-500">{charge.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">{charge.studentName || 'Estudante não informado'}</span>
            <span>{charge.studentNumber || '-'}</span>
            <span>{charge.referenceMonth || '-'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-[210px] lg:shrink-0">
          <div className="rounded-lg bg-slate-50 px-2 py-1.5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total</p>
            <p className="text-xs font-black text-slate-950">{formatMoney(charge.totalAmount, charge.currency)}</p>
            {charge.fineAmount > 0 && <p className="mt-0.5 text-[10px] font-bold text-red-600">Multa: {formatMoney(charge.fineAmount, charge.currency)}</p>}
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-1.5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Vencimento</p>
            <p className="text-xs font-black text-slate-950">{formatDate(charge.dueDate)}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{charge.referenceMonth || '-'}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function Mini({ label, value, strong, danger }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-xs ${strong ? 'font-black' : 'font-bold'} ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}
