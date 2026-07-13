import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { usePermissions } from '../shared/auth/usePermissions.js';
import {
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

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  ['ALL', 'Todos estados'],
  ['PENDING', 'Pendentes'],
  ['OVERDUE', 'Vencidas'],
  ['PAID', 'Pagas'],
  ['CANCELLED', 'Canceladas'],
];

export default function ChargesPageV2() {
  const { can } = usePermissions();
  const canSendGuides = can('sendWhatsapp');
  const consultationOnly = !canSendGuides;

  const [rawCharges, setRawCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [month, setMonth] = useState('ALL');
  const [sortBy, setSortBy] = useState('OVERDUE_FIRST');
  const [page, setPage] = useState(1);
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
      setSelected((current) => (
        current?.id ? normalized.find((item) => item.id === current.id) || null : null
      ));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar cobranças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  const months = useMemo(
    () => Array.from(new Set(charges.map((charge) => charge.referenceMonth).filter(Boolean))).sort().reverse(),
    [charges],
  );

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    const result = charges.filter((charge) => {
      const text = normalizeText([
        charge.chargeCode,
        charge.description,
        charge.studentName,
        charge.studentNumber,
        charge.referenceMonth,
        charge.status,
      ].join(' '));
      const matchesSearch = !term || text.includes(term);
      const matchesStatus = status === 'ALL'
        || (status === 'OVERDUE' ? chargeIsOverdue(charge) : String(charge.status).toUpperCase() === status);
      const matchesMonth = month === 'ALL' || charge.referenceMonth === month;
      return matchesSearch && matchesStatus && matchesMonth;
    });

    return result.sort((left, right) => {
      if (sortBy === 'AMOUNT') return Number(right.totalAmount || 0) - Number(left.totalAmount || 0);
      if (sortBy === 'STUDENT') return String(left.studentName || '').localeCompare(String(right.studentName || ''), 'pt');
      if (sortBy === 'DUE_DATE') return dateValue(left.dueDate) - dateValue(right.dueDate);
      if (sortBy === 'RECENT') return dateValue(right.createdAt || right.dueDate) - dateValue(left.createdAt || left.dueDate);
      return Number(chargeIsOverdue(right)) - Number(chargeIsOverdue(left))
        || dateValue(left.dueDate) - dateValue(right.dueDate)
        || Number(right.totalAmount || 0) - Number(left.totalAmount || 0);
    });
  }, [charges, search, status, month, sortBy]);

  useEffect(() => { setPage(1); }, [search, status, month, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const open = charges.filter(chargeIsOpen);
    const overdue = charges.filter(chargeIsOverdue);
    const pending = charges.filter((charge) => String(charge.status).toUpperCase() === 'PENDING');
    const paid = charges.filter((charge) => String(charge.status).toUpperCase() === 'PAID');
    const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
    return {
      total: charges.length,
      pending: pending.length,
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
      .sort((a, b) => dateValue(a.dueDate) - dateValue(b.dueDate));
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

  const denyAction = (text) => setActionMessage({ type: 'error', text });

  const handleSendGuide = async (charge) => {
    if (!canSendGuides) {
      denyAction('O seu perfil possui acesso apenas para consulta e não pode enviar guias.');
      return;
    }
    setWorking(true);
    setActionMessage(null);
    try {
      const result = await sendIndividualGuide(charge.id);
      setActionMessage({
        type: 'success',
        text: `Guia enviada/registrada para ${charge.chargeCode}. Estado: ${result?.status || 'processado'}`,
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || err.message || 'Falha ao enviar guia.' });
    } finally {
      setWorking(false);
    }
  };

  const handleSendBatch = async () => {
    if (!canSendGuides) {
      denyAction('O seu perfil possui acesso apenas para consulta e não pode enviar guias em lote.');
      return;
    }

    setWorking(true);
    setActionMessage(null);

    try {
      const referenceMonth = month === 'ALL' ? null : month;
      const result = await sendTuitionGuides({
        institutionId: INSTITUTION_ID,
        referenceMonth,
        chargeCodePrefix: 'IMT-PROPINA-',
        sendWhatsapp: true,
        sendEmail: true,
        sendSms: true,
        onlyPending: true,
        forceResend: false,
        maxItems: 50,
      });

      const batchLabel = referenceMonth || 'todos os meses pendentes';
      setActionMessage({
        type: 'success',
        text: `Envio concluído para ${batchLabel}: WhatsApp ${result?.sentWhatsapp || 0}, e-mail ${result?.sentEmail || 0}, SMS ${result?.sentSms || 0}.`,
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
    <div className="charges-page space-y-4">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="premium-pill"><WalletCards size={13} />Gestão de propinas, juros e conciliação</div>
            <h1 className="page-title mt-3">Cobranças e propinas</h1>
            <p className="page-subtitle text-white/80">
              Consulte cobranças numa tabela e abra o detalhe financeiro apenas quando necessário.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-light" onClick={load} disabled={working}><RefreshCw size={15} />Atualizar</button>
            {canSendGuides && (
              <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3.5 text-[12px] font-black text-white shadow-[0_12px_28px_rgba(16,185,129,.22)] transition hover:bg-emerald-600" onClick={handleSendBatch} disabled={working}><Send size={15} />Enviar guias</button>
            )}
          </div>
        </div>
      </section>

      {consultationOnly && (
        <div className="rounded-2xl border border-blue-200/70 bg-blue-50 px-4 py-3 text-[12px] font-bold text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
          Perfil em modo de consulta. O envio de guias está disponível apenas para perfis financeiros autorizados.
        </div>
      )}

      {actionMessage && (
        <div className={`rounded-2xl border px-4 py-3 text-[12px] font-black ${actionMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'}`}>
          {actionMessage.text}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Total de cobranças" value={stats.total} description="Registos financeiros" icon={Banknote} />
        <StatCard title="Pendentes" value={stats.pending} description="Aguardando pagamento" icon={WalletCards} tone="gold" />
        <StatCard title="Vencidas" value={stats.overdue} description={formatMoney(stats.overdueAmount)} icon={CalendarDays} tone="danger" />
        <StatCard title="Total em aberto" value={formatMoney(stats.openAmount)} description="Pendente + vencido" icon={FileText} tone="warning" />
        <StatCard title="Total recebido" value={formatMoney(stats.paidAmount)} description={`Juros: ${formatMoney(stats.paidInterestAmount)}`} icon={CheckCircle2} tone="success" />
        <StatCard title="Movimentado" value={formatMoney(stats.grossAmount)} description={`Multas: ${formatMoney(stats.paidFineAmount)}`} icon={Banknote} tone="info" />
      </section>

      <section className="card-premium overflow-hidden">
        <div className="border-b border-slate-100/80 bg-white/80 p-4 backdrop-blur dark:!border-slate-700 dark:!bg-[#0F172A]">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_170px_190px]">
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input className="input-premium pl-10" placeholder="Buscar por código, estudante, matrícula ou mês..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <SelectControl icon={Filter} value={status} onChange={setStatus}>
              {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectControl>
            <SelectControl value={month} onChange={setMonth}>
              <option value="ALL">Todos meses</option>
              {months.map((item) => <option key={item} value={item}>{item}</option>)}
            </SelectControl>
            <SelectControl value={sortBy} onChange={setSortBy}>
              <option value="OVERDUE_FIRST">Vencidas primeiro</option>
              <option value="DUE_DATE">Vencimento mais próximo</option>
              <option value="AMOUNT">Maior valor</option>
              <option value="STUDENT">Ordenar por estudante</option>
              <option value="RECENT">Mais recentes</option>
            </SelectControl>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-300">
            <span>{filtered.length} cobrança(s) encontrada(s)</span>
            <span>Clique numa linha para abrir o detalhe financeiro.</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhuma cobrança encontrada" message="Ajuste a pesquisa ou os filtros financeiros." /></div>
        ) : (
          <>
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[29%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-black uppercase tracking-[.1em] text-slate-500 dark:!bg-[#111827] dark:!text-slate-300">
                  <tr>
                    <TableHead>Cobrança</TableHead>
                    <TableHead>Estudante</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map((charge) => (
                    <ChargeTableRow key={charge.id || charge.chargeCode} charge={charge} onClick={() => setSelected(charge)} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {paginated.map((charge) => (
                <ChargeMobileCard key={charge.id || charge.chargeCode} charge={charge} onClick={() => setSelected(charge)} />
              ))}
            </div>

            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </section>

      {selected && (
        <ChargeFinancialDrawer
          charge={selected}
          studentLedger={studentLedger}
          studentStats={studentStats}
          canSendGuides={canSendGuides}
          working={working}
          onSendGuide={handleSendGuide}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ChargeTableRow({ charge, onClick }) {
  const overdue = chargeIsOverdue(charge);
  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <tr
      className="group cursor-pointer bg-white transition hover:bg-blue-50/70 focus:bg-blue-50/70 dark:!bg-[#0F172A] dark:hover:!bg-[#14213A]"
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <TableCell>
        <p className="truncate text-[13px] font-black text-slate-950 dark:!text-white">{charge.chargeCode}</p>
        <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:!text-slate-400">{charge.description}</p>
      </TableCell>
      <TableCell>
        <p className="truncate text-[12px] font-extrabold text-slate-900 dark:!text-slate-100">{charge.studentName || 'Estudante não informado'}</p>
        <p className="mt-1 truncate text-[11px] font-bold text-blue-700 dark:!text-blue-300">{charge.studentNumber || '-'}</p>
      </TableCell>
      <TableCell>
        <p className="truncate text-[12px] font-extrabold text-slate-800 dark:!text-slate-100">{charge.referenceMonth || '-'}</p>
      </TableCell>
      <TableCell>
        <p className={`text-[12px] font-black ${overdue ? 'text-red-700 dark:!text-red-300' : 'text-slate-800 dark:!text-slate-100'}`}>{formatDate(charge.dueDate)}</p>
      </TableCell>
      <TableCell>
        <p className="text-[13px] font-black text-slate-950 dark:!text-white">{formatMoney(charge.totalAmount, charge.currency)}</p>
        {(charge.fineAmount > 0 || charge.interestAmount > 0) && (
          <p className="mt-1 truncate text-[10px] font-bold text-red-600 dark:!text-red-300">Acréscimos: {formatMoney(Number(charge.fineAmount || 0) + Number(charge.interestAmount || 0), charge.currency)}</p>
        )}
      </TableCell>
      <TableCell><StatusBadge status={overdue ? 'OVERDUE' : charge.status} /></TableCell>
    </tr>
  );
}

function ChargeMobileCard({ charge, onClick }) {
  const overdue = chargeIsOverdue(charge);
  return (
    <button type="button" onClick={onClick} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:!border-slate-700 dark:!bg-[#0F172A]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-black text-slate-950 dark:!text-white">{charge.chargeCode}</p>
          <p className="mt-1 truncate text-[11px] font-bold text-blue-700 dark:!text-blue-300">{charge.studentName} · {charge.studentNumber}</p>
        </div>
        <ChevronRight className="shrink-0 text-slate-400" size={18} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MobileMetric label="Referência" value={charge.referenceMonth || '-'} />
        <MobileMetric label="Vencimento" value={formatDate(charge.dueDate)} />
        <MobileMetric label="Total" value={formatMoney(charge.totalAmount, charge.currency)} />
      </div>
      <div className="mt-3"><StatusBadge status={overdue ? 'OVERDUE' : charge.status} /></div>
    </button>
  );
}

function ChargeFinancialDrawer({ charge, studentLedger, studentStats, canSendGuides, working, onSendGuide, onClose }) {
  const overdue = chargeIsOverdue(charge);
  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Fechar detalhe da cobrança" className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl dark:!border-slate-700 dark:!bg-[#08111F]">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:!border-slate-700 dark:!bg-[#0F172A] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700 dark:!text-blue-300">Detalhe financeiro da cobrança</p>
                <StatusBadge status={overdue ? 'OVERDUE' : charge.status} />
              </div>
              <h2 className="mt-2 break-words text-lg font-black text-slate-950 dark:!text-white sm:text-xl">{charge.chargeCode}</h2>
              <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:!text-slate-300">{charge.description}</p>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200" aria-label="Fechar">
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DrawerMetric label="Base" value={formatMoney(charge.amount, charge.currency)} />
            <DrawerMetric label="Multa" value={formatMoney(charge.fineAmount, charge.currency)} tone={charge.fineAmount > 0 ? 'danger' : 'navy'} />
            <DrawerMetric label="Juros" value={formatMoney(charge.interestAmount, charge.currency)} tone={charge.interestAmount > 0 ? 'warning' : 'navy'} />
            <DrawerMetric label="Total" value={formatMoney(charge.totalAmount, charge.currency)} tone="success" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoCard icon={Users} label="Estudante" value={charge.studentName || 'Não informado'} />
            <InfoCard icon={ShieldCheck} label="Matrícula" value={charge.studentNumber || 'Não informada'} />
            <InfoCard icon={CalendarDays} label="Referência" value={charge.referenceMonth || 'Não informada'} />
            <InfoCard icon={AlertTriangle} label="Vencimento" value={formatDate(charge.dueDate)} />
          </div>

          <div className="mt-4">
            <StudentLedger charges={studentLedger} stats={studentStats} />
          </div>

          <div className={`mt-4 grid gap-2 ${canSendGuides ? 'sm:grid-cols-2' : ''}`}>
            <a className="btn-secondary" href={paymentGuidePdfUrl(charge.chargeCode)} target="_blank" rel="noreferrer"><Eye size={15} className="mr-2" />Ver guia PDF</a>
            {canSendGuides && <button className="btn-primary" onClick={() => onSendGuide(charge)} disabled={working}><Send size={15} className="mr-2" />Enviar guia</button>}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-[12px] text-imetro-navy dark:!border-amber-500/20">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} /><div><p className="font-black">Regra operacional</p><p className="mt-1 font-semibold leading-5 text-slate-600 dark:!text-slate-300">Para conciliação, confira estudante, meses pagos, juros, multas e borderôs emitidos.</p></div></div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function StudentLedger({ charges, stats }) {
  if (!charges.length) return null;
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 dark:!border-blue-500/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg"><Users size={17} /></div><div><p className="text-[13px] font-black text-slate-900 dark:!text-white">Histórico do estudante</p><p className="text-[11px] font-semibold text-slate-500 dark:!text-slate-400">Todos os meses deste aluno</p></div></div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-blue-700 dark:!bg-blue-500/15 dark:!text-blue-200">{stats.paidMonths}/{stats.totalMonths} pagos</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Mini label="Pago" value={formatMoney(stats.paidAmount)} strong />
        <Mini label="Em aberto" value={formatMoney(stats.openAmount)} danger={stats.openAmount > 0} />
        <Mini label="Multas" value={formatMoney(stats.fineAmount)} danger={stats.fineAmount > 0} />
        <Mini label="Juros" value={formatMoney(stats.interestAmount)} danger={stats.interestAmount > 0} />
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {charges.map((item) => (
          <div key={item.id || item.chargeCode} className="rounded-xl border border-slate-100 bg-white p-3 text-[11px] shadow-sm dark:!border-slate-700 dark:!bg-[#0F172A]">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-black text-slate-900 dark:!text-white">{item.referenceMonth}</p><p className="mt-1 truncate font-semibold text-slate-500 dark:!text-slate-400">{item.chargeCode}</p></div><StatusBadge status={chargeIsOverdue(item) ? 'OVERDUE' : item.status} /></div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-bold text-slate-600 dark:!text-slate-300"><span>Base: {formatMoney(item.amount, item.currency)}</span><span>Multa: {formatMoney(item.fineAmount, item.currency)}</span><span>Juros: {formatMoney(item.interestAmount, item.currency)}</span><span>Total: {formatMoney(item.totalAmount, item.currency)}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectControl({ icon: Icon, value, onChange, children }) {
  return (
    <div className="relative min-w-0">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-2.5 z-10 text-slate-400" size={15} />}
      <select className={`input-premium ${Icon ? 'pl-9' : ''}`} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </div>
  );
}

function TableHead({ children }) {
  return <th className="px-3 py-3 text-left">{children}</th>;
}

function TableCell({ children }) {
  return <td className="min-w-0 px-3 py-3.5 align-middle">{children}</td>;
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:!border-slate-700">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-300">Página {page} de {pageCount}</p>
      <div className="flex items-center gap-2">
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}><ChevronLeft size={17} /></button>
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200" onClick={() => onChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount}><ChevronRight size={17} /></button>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:!border-slate-700 dark:!bg-[#0F172A]">
      <div className="flex items-start gap-3"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:!bg-blue-950/50 dark:!text-blue-200"><Icon size={16} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500 dark:!text-slate-400">{label}</p><p className="mt-1 break-words text-[12px] font-extrabold text-slate-950 dark:!text-white">{value}</p></div></div>
    </div>
  );
}

function DrawerMetric({ label, value, tone = 'navy' }) {
  const tones = {
    navy: 'border-blue-200 bg-blue-50 text-blue-950 dark:!border-blue-800/70 dark:!bg-blue-950/35 dark:!text-blue-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:!border-emerald-800/70 dark:!bg-emerald-950/35 dark:!text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:!border-amber-700/70 dark:!bg-amber-950/35 dark:!text-amber-100',
    danger: 'border-red-200 bg-red-50 text-red-900 dark:!border-red-800/70 dark:!bg-red-950/35 dark:!text-red-100',
  };
  return <div className={`rounded-xl border p-3 ${tones[tone] || tones.navy}`}><p className="text-[9px] font-black uppercase tracking-[.1em] opacity-75">{label}</p><p className="mt-1 break-words text-[12px] font-black">{value}</p></div>;
}

function MobileMetric({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-2.5 dark:!bg-slate-900"><p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-[11px] font-black text-slate-900 dark:!text-white">{value}</p></div>;
}

function Mini({ label, value, strong, danger }) {
  return <div className={`min-w-0 rounded-xl border p-2.5 ${danger ? 'border-red-100 bg-red-50 text-red-700' : strong ? 'border-blue-100 bg-blue-50 text-imetro-navy' : 'border-slate-100 bg-slate-50 text-slate-900'}`}><p className="text-[9px] font-black uppercase tracking-wide opacity-60">{label}</p><p className={`mt-1 break-words text-[11px] ${strong ? 'font-black' : 'font-bold'}`}>{value}</p></div>;
}

function dateValue(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}
