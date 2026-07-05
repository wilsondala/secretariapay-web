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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="page-title">Cobranças e propinas</h1>
          <p className="page-subtitle">Consulta real de cobranças, guias PDF, multas DCR e envio por WhatsApp.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={load} disabled={working}>
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </button>
          <button className="btn-secondary" onClick={handleGenerateMonth} disabled={working}>
            <CalendarDays size={16} className="mr-2" />
            Gerar propinas teste
          </button>
          <button className="btn-primary" onClick={handleSendBatch} disabled={working}>
            <Send size={16} className="mr-2" />
            Enviar guias do mês
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`rounded-2xl border p-4 text-sm font-semibold ${actionMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {actionMessage.text}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de cobranças" value={stats.total} description="Registros financeiros" icon={Banknote} />
        <StatCard title="Pendentes" value={stats.pending} description="Aguardando pagamento" icon={WalletCards} tone="gold" />
        <StatCard title="Vencidas" value={stats.overdue} description={formatMoney(stats.overdueAmount)} icon={CalendarDays} tone="danger" />
        <StatCard title="Total em aberto" value={formatMoney(stats.openAmount)} description="Pendente + vencido" icon={FileText} tone="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  className="input pl-10"
                  placeholder="Buscar por código, estudante, matrícula, descrição ou mês..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select className="input lg:w-48" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos estados</option>
                <option value="PENDING">Pendente</option>
                <option value="OVERDUE">Vencida</option>
                <option value="PAID">Pago</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <select className="input lg:w-44" value={month} onChange={(event) => setMonth(event.target.value)}>
                <option value="ALL">Todos meses</option>
                {months.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Cobrança</th>
                  <th className="px-5 py-3">Estudante</th>
                  <th className="px-5 py-3">Valores</th>
                  <th className="px-5 py-3">Vencimento</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((charge) => {
                  const active = selected?.id === charge.id;
                  return (
                    <tr
                      key={charge.id || charge.chargeCode}
                      className={`cursor-pointer transition hover:bg-imetro-goldSoft/40 ${active ? 'bg-imetro-goldSoft/70' : ''}`}
                      onClick={() => setSelected(charge)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">{charge.chargeCode}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{charge.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">{charge.studentName}</p>
                        <p className="mt-1 text-xs text-imetro-navy">{charge.studentNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">{formatMoney(charge.totalAmount, charge.currency)}</p>
                        {charge.fineAmount > 0 && <p className="mt-1 text-xs font-semibold text-red-600">Multa: {formatMoney(charge.fineAmount, charge.currency)}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">{formatDate(charge.dueDate)}</p>
                        <p className="mt-1 text-xs text-slate-500">{charge.referenceMonth}</p>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={chargeIsOverdue(charge) ? 'OVERDUE' : charge.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-5"><EmptyState /></div>}
        </div>

        <aside className="card p-5">
          {!selected ? (
            <EmptyState title="Selecione uma cobrança" message="Clique numa linha para ver os detalhes e ações." />
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-imetro-gold">Detalhe da cobrança</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">{selected.chargeCode}</h2>
                <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Mini label="Valor base" value={formatMoney(selected.amount, selected.currency)} />
                <Mini label="Multa" value={formatMoney(selected.fineAmount, selected.currency)} danger={selected.fineAmount > 0} />
                <Mini label="Total" value={formatMoney(selected.totalAmount, selected.currency)} wide />
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <Line label="Estudante" value={selected.studentName} />
                <Line label="Matrícula" value={selected.studentNumber} />
                <Line label="Referência" value={selected.referenceMonth} />
                <Line label="Vencimento" value={formatDate(selected.dueDate)} />
                <Line label="Estado" value={chargeIsOverdue(selected) ? 'Vencida/em atraso' : safeText(selected.status)} />
              </div>

              <div className="flex flex-col gap-2">
                <a className="btn-secondary" href={paymentGuidePdfUrl(selected.chargeCode)} target="_blank" rel="noreferrer">
                  <Eye size={16} className="mr-2" />
                  Ver guia PDF
                </a>
                <button className="btn-primary" onClick={() => handleSendGuide(selected)} disabled={working}>
                  <Send size={16} className="mr-2" />
                  Enviar guia por WhatsApp
                </button>
              </div>

              <div className="rounded-2xl bg-imetro-goldSoft p-4 text-sm text-imetro-navy">
                <p className="font-black">Regra operacional</p>
                <p className="mt-2 leading-6">A guia é enviada apenas para contacto oficial do estudante. O recibo só deve ser emitido após validação manual da DCR.</p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Mini({ label, value, wide, danger }) {
  return (
    <div className={`rounded-2xl bg-slate-50 p-4 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-black ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-200/70 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="max-w-[62%] text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}
