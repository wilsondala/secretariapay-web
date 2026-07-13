import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StudentMonthlyLedger from '../components/financial/StudentMonthlyLedger.jsx';
import { listCharges, listChargesByStudent } from '../services/chargesService.js';
import { listStudents } from '../services/studentsService.js';
import {
  chargeIsOpen,
  chargeIsOverdue,
  formatMoney,
  getStudentClass,
  getStudentCourse,
  getStudentEmail,
  getStudentName,
  getStudentNumber,
  getStudentPhone,
  normalizeCharge,
  normalizeText,
} from '../utils/formatters.js';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  ['ALL', 'Todos'],
  ['REGULARIZED', 'Regularizados'],
  ['PENDING', 'Com pendências'],
  ['OVERDUE', 'Em atraso'],
  ['NO_CHARGES', 'Sem lançamentos'],
];

export default function StudentsPageFinanceSimple() {
  const [students, setStudents] = useState([]);
  const [allCharges, setAllCharges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedCharges, setSelectedCharges] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chargesLoading, setChargesLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, chargesData] = await Promise.all([listStudents(), listCharges()]);
      setStudents(studentsData);
      setAllCharges(chargesData.map(normalizeCharge));
      setSelected((current) => {
        if (!current) return null;
        return studentsData.find((student) => student.id === current.id) || null;
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar estudantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) {
      setSelectedCharges([]);
      return undefined;
    }

    const cached = allCharges.filter((charge) => chargeMatchesStudent(charge, selected));
    setSelectedCharges(cached);

    let active = true;
    async function refreshSelectedCharges() {
      if (!selected?.id) return;
      setChargesLoading(true);
      try {
        const data = await listChargesByStudent(selected.id);
        if (!active) return;
        const normalized = data.map(normalizeCharge);
        setSelectedCharges(normalized);
        setAllCharges((current) => mergeStudentCharges(current, normalized, selected));
      } catch {
        if (active) setSelectedCharges(cached);
      } finally {
        if (active) setChargesLoading(false);
      }
    }

    refreshSelectedCharges();
    return () => { active = false; };
  }, [selected]);

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

  const rows = useMemo(() => students.map((student) => ({
    student,
    summary: buildStudentSummary(student, allCharges),
  })), [students, allCharges]);

  const overview = useMemo(() => buildOverview(rows), [rows]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    const result = rows.filter(({ student, summary }) => {
      const matchesText = normalizeText([
        getStudentName(student),
        getStudentNumber(student),
        getStudentCourse(student),
        getStudentClass(student),
        getStudentPhone(student),
        getStudentEmail(student),
      ].join(' ')).includes(term);
      const matchesStatus = statusFilter === 'ALL' || summary.status === statusFilter;
      return matchesText && matchesStatus;
    });

    return result.sort((left, right) => {
      if (sortBy === 'DEBT') return right.summary.openAmount - left.summary.openAmount;
      if (sortBy === 'OVERDUE') return right.summary.overdueCount - left.summary.overdueCount || right.summary.openAmount - left.summary.openAmount;
      if (sortBy === 'PAID') return right.summary.paidAmount - left.summary.paidAmount;
      return getStudentName(left.student).localeCompare(getStudentName(right.student), 'pt');
    });
  }, [rows, search, statusFilter, sortBy]);

  useEffect(() => { setPage(1); }, [search, statusFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) return <LoadingState message="Carregando estudantes e situação financeira..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Gestão financeira académica</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">Estudantes</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Consulte todos os estudantes numa tabela e abra o detalhe financeiro apenas quando necessário.
            </p>
          </div>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
            onClick={load}
          >
            <RefreshCw size={17} /> Atualizar
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <OverviewCard icon={Users} label="Total de estudantes" value={overview.total} tone="navy" />
        <OverviewCard icon={CheckCircle2} label="Regularizados" value={overview.regularized} tone="success" />
        <OverviewCard icon={Clock3} label="Com pendências" value={overview.pending} tone="warning" />
        <OverviewCard icon={AlertTriangle} label="Em atraso" value={overview.overdue} tone="danger" />
        <OverviewCard icon={BadgeDollarSign} label="Total em aberto" value={formatMoney(overview.openAmount)} tone="navy" />
      </section>

      <section className="card-premium overflow-hidden">
        <div className="border-b border-slate-100/80 bg-white/80 p-4 dark:!border-slate-700 dark:!bg-[#0F172A] sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                className="input-premium pl-11"
                placeholder="Buscar por nome, matrícula, curso, turma, telefone ou e-mail..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <SelectControl icon={Filter} value={statusFilter} onChange={setStatusFilter}>
              {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectControl>
            <SelectControl value={sortBy} onChange={setSortBy}>
              <option value="NAME">Ordenar por nome</option>
              <option value="DEBT">Maior dívida</option>
              <option value="OVERDUE">Mais atrasos</option>
              <option value="PAID">Maior valor pago</option>
            </SelectControl>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
            <span>{filtered.length} estudante(s) encontrado(s)</span>
            <span>Clique numa linha para abrir a situação financeira.</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhum estudante encontrado" message="Ajuste a pesquisa ou os filtros financeiros." /></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1120px] w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-[.12em] text-slate-500 dark:!bg-[#111827] dark:!text-slate-300">
                  <tr>
                    <TableHead>Estudante</TableHead>
                    <TableHead>Curso e turma</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead align="center">Pagos</TableHead>
                    <TableHead align="center">Em aberto</TableHead>
                    <TableHead>Dívida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead align="right">Detalhe</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map(({ student, summary }) => (
                    <StudentTableRow
                      key={student.id || getStudentNumber(student)}
                      student={student}
                      summary={summary}
                      onClick={() => setSelected(student)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {paginated.map(({ student, summary }) => (
                <StudentMobileCard
                  key={student.id || getStudentNumber(student)}
                  student={student}
                  summary={summary}
                  onClick={() => setSelected(student)}
                />
              ))}
            </div>

            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </section>

      {selected && (
        <StudentFinancialDrawer
          student={selected}
          charges={selectedCharges}
          loading={chargesLoading}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function StudentTableRow({ student, summary, onClick }) {
  return (
    <tr
      className="group cursor-pointer bg-white transition hover:bg-blue-50/70 focus-within:bg-blue-50/70 dark:!bg-[#0F172A] dark:hover:!bg-[#14213A]"
      onClick={onClick}
    >
      <TableCell>
        <div className="flex min-w-[240px] items-center gap-3">
          <StudentAvatar name={getStudentName(student)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950 dark:!text-white">{getStudentName(student)}</p>
            <p className="mt-1 text-xs font-extrabold text-blue-700 dark:!text-blue-300">{getStudentNumber(student)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <p className="max-w-[250px] truncate text-sm font-extrabold text-slate-800 dark:!text-slate-100">{getStudentCourse(student)}</p>
        <p className="mt-1 max-w-[250px] truncate text-xs font-semibold text-slate-500 dark:!text-slate-400">{getStudentClass(student)}</p>
      </TableCell>
      <TableCell>
        <p className="text-sm font-bold text-slate-800 dark:!text-slate-100">{getStudentPhone(student) || 'Sem telefone'}</p>
        <p className="mt-1 max-w-[210px] truncate text-xs font-semibold text-slate-500 dark:!text-slate-400">{getStudentEmail(student) || 'Sem e-mail'}</p>
      </TableCell>
      <TableCell align="center"><CountBadge value={summary.paidCount} tone="success" /></TableCell>
      <TableCell align="center"><CountBadge value={summary.openCount} tone={summary.overdueCount ? 'danger' : 'warning'} /></TableCell>
      <TableCell>
        <p className={`text-sm font-black ${summary.openAmount > 0 ? 'text-red-700 dark:!text-red-300' : 'text-emerald-700 dark:!text-emerald-300'}`}>
          {formatMoney(summary.openAmount)}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:!text-slate-400">Pago: {formatMoney(summary.paidAmount)}</p>
      </TableCell>
      <TableCell><FinancialStatus status={summary.status} /></TableCell>
      <TableCell align="right">
        <button
          type="button"
          aria-label={`Abrir situação financeira de ${getStudentName(student)}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-blue-300 group-hover:text-blue-700 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-300"
        >
          <ChevronRight size={18} />
        </button>
      </TableCell>
    </tr>
  );
}

function StudentMobileCard({ student, summary, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:!border-slate-700 dark:!bg-[#0F172A]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <StudentAvatar name={getStudentName(student)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950 dark:!text-white">{getStudentName(student)}</p>
            <p className="mt-1 text-xs font-extrabold text-blue-700 dark:!text-blue-300">{getStudentNumber(student)}</p>
          </div>
        </div>
        <ChevronRight className="shrink-0 text-slate-400" size={18} />
      </div>
      <p className="mt-3 truncate text-xs font-semibold text-slate-500 dark:!text-slate-300">{getStudentCourse(student)} · {getStudentClass(student)}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MobileMetric label="Pagos" value={summary.paidCount} />
        <MobileMetric label="Em aberto" value={summary.openCount} />
        <MobileMetric label="Dívida" value={formatMoney(summary.openAmount)} />
      </div>
      <div className="mt-3"><FinancialStatus status={summary.status} /></div>
    </button>
  );
}

function StudentFinancialDrawer({ student, charges, loading, onClose }) {
  const summary = buildStudentSummary(student, charges);
  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Fechar detalhe financeiro"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl dark:!border-slate-700 dark:!bg-[#08111F]">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:!border-slate-700 dark:!bg-[#0F172A] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <StudentAvatar name={getStudentName(student)} large />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[.16em] text-blue-700 dark:!text-blue-300">Situação financeira do estudante</p>
                <h2 className="mt-1 truncate text-xl font-black text-slate-950 dark:!text-white sm:text-2xl">{getStudentName(student)}</h2>
                <p className="mt-1 text-sm font-extrabold text-slate-500 dark:!text-slate-300">Matrícula {getStudentNumber(student)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} label="Curso" value={getStudentCourse(student)} />
            <InfoCard icon={WalletCards} label="Turma" value={getStudentClass(student)} />
            <InfoCard icon={Phone} label="Telefone" value={getStudentPhone(student) || 'Não informado'} />
            <InfoCard icon={Mail} label="E-mail" value={getStudentEmail(student) || 'Não informado'} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DrawerMetric label="Pagos" value={summary.paidCount} tone="success" />
            <DrawerMetric label="Em aberto" value={summary.openCount} tone="warning" />
            <DrawerMetric label="Total pago" value={formatMoney(summary.paidAmount)} />
            <DrawerMetric label="Total em dívida" value={formatMoney(summary.openAmount)} tone={summary.openAmount > 0 ? 'danger' : 'success'} />
          </div>

          <div className="mt-5">
            <StudentMonthlyLedger student={student} charges={charges} loading={loading} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, tone }) {
  const tones = {
    navy: 'border-blue-200 bg-blue-50 text-blue-950 dark:!border-blue-800/70 dark:!bg-blue-950/35 dark:!text-blue-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:!border-emerald-800/70 dark:!bg-emerald-950/35 dark:!text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:!border-amber-700/70 dark:!bg-amber-950/35 dark:!text-amber-100',
    danger: 'border-red-200 bg-red-50 text-red-900 dark:!border-red-800/70 dark:!bg-red-950/35 dark:!text-red-100',
  };
  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.12em] opacity-75">{label}</p>
          <p className="mt-2 break-words text-xl font-black">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-white/10"><Icon size={20} /></span>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:!border-slate-700 dark:!bg-[#0F172A]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:!bg-blue-950/50 dark:!text-blue-200"><Icon size={17} /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500 dark:!text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm font-extrabold text-slate-950 dark:!text-white">{value}</p>
        </div>
      </div>
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
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[.1em] opacity-75">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function FinancialStatus({ status }) {
  const config = {
    REGULARIZED: ['Regularizado', CheckCircle2, 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:!bg-emerald-500/20 dark:!text-emerald-100 dark:ring-emerald-400/30'],
    PENDING: ['Com pendências', Clock3, 'bg-amber-100 text-amber-900 ring-amber-200 dark:!bg-amber-500/20 dark:!text-amber-100 dark:ring-amber-400/30'],
    OVERDUE: ['Em atraso', AlertTriangle, 'bg-red-100 text-red-800 ring-red-200 dark:!bg-red-500/20 dark:!text-red-100 dark:ring-red-400/30'],
    NO_CHARGES: ['Sem lançamentos', WalletCards, 'bg-slate-200 text-slate-700 ring-slate-300 dark:!bg-slate-700 dark:!text-slate-200 dark:ring-slate-600'],
  }[status] || ['Sem informação', WalletCards, 'bg-slate-200 text-slate-700 ring-slate-300'];
  const [label, Icon, className] = config;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${className}`}><Icon size={12} />{label}</span>;
}

function StudentAvatar({ name, large = false }) {
  const initials = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#08285A] to-blue-600 font-black text-white shadow-sm ${large ? 'h-13 w-13 text-base' : 'h-11 w-11 text-sm'}`}>
      {initials || '?'}
    </span>
  );
}

function CountBadge({ value, tone }) {
  const className = tone === 'success'
    ? 'bg-emerald-100 text-emerald-800 dark:!bg-emerald-500/20 dark:!text-emerald-100'
    : tone === 'danger'
      ? 'bg-red-100 text-red-800 dark:!bg-red-500/20 dark:!text-red-100'
      : 'bg-amber-100 text-amber-900 dark:!bg-amber-500/20 dark:!text-amber-100';
  return <span className={`inline-flex min-w-9 items-center justify-center rounded-xl px-2.5 py-1.5 text-xs font-black ${className}`}>{value}</span>;
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-2.5 py-2 dark:!bg-slate-900">
      <p className="text-[9px] font-black uppercase tracking-wide text-slate-500 dark:!text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[11px] font-black text-slate-950 dark:!text-white">{value}</p>
    </div>
  );
}

function SelectControl({ icon: Icon, value, onChange, children }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={17} />}
      <select
        className={`input-premium appearance-none pr-10 ${Icon ? 'pl-11' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronRight className="pointer-events-none absolute right-4 top-3.5 rotate-90 text-slate-400" size={17} />
    </div>
  );
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 dark:!border-slate-700 dark:!bg-[#111827] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-bold text-slate-500 dark:!text-slate-300">Página {page} de {pageCount}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200"
        ><ChevronLeft size={15} /> Anterior</button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200"
        >Seguinte <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function TableHead({ children, align = 'left' }) {
  return <th className={`border-b border-slate-200 px-4 py-3 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} dark:!border-slate-700`}>{children}</th>;
}

function TableCell({ children, align = 'left' }) {
  return <td className={`px-4 py-4 align-middle ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>{children}</td>;
}

function buildOverview(rows) {
  return rows.reduce((summary, row) => {
    summary.total += 1;
    summary.openAmount += row.summary.openAmount;
    if (row.summary.status === 'REGULARIZED') summary.regularized += 1;
    if (row.summary.status === 'PENDING') summary.pending += 1;
    if (row.summary.status === 'OVERDUE') summary.overdue += 1;
    return summary;
  }, { total: 0, regularized: 0, pending: 0, overdue: 0, openAmount: 0 });
}

function buildStudentSummary(student, charges) {
  const studentCharges = charges.filter((charge) => chargeMatchesStudent(charge, student));
  const active = studentCharges.filter((charge) => !['CANCELLED', 'CANCELED'].includes(String(charge.status).toUpperCase()));
  const paid = uniqueFinancialPeriods(active.filter((charge) => String(charge.status).toUpperCase() === 'PAID'));
  const open = uniqueFinancialPeriods(active.filter((charge) => chargeIsOpen(charge)));
  const overdue = open.filter(chargeIsOverdue);
  const sum = (items) => items.reduce((total, charge) => total + Number(charge.totalAmount || 0), 0);

  let status = 'NO_CHARGES';
  if (overdue.length > 0) status = 'OVERDUE';
  else if (open.length > 0) status = 'PENDING';
  else if (paid.length > 0) status = 'REGULARIZED';

  return {
    status,
    paidCount: paid.length,
    openCount: open.length,
    overdueCount: overdue.length,
    paidAmount: sum(paid),
    openAmount: sum(open),
  };
}

function uniqueFinancialPeriods(charges) {
  const map = new Map();
  charges.forEach((charge) => {
    const key = normalizeText(charge.referenceMonth || charge.chargeCode || charge.id || Math.random());
    const current = map.get(key);
    if (!current || String(charge.status).toUpperCase() === 'PAID') map.set(key, charge);
  });
  return [...map.values()];
}

function chargeMatchesStudent(charge, student) {
  if (!charge || !student) return false;
  const chargeStudentId = charge.student?.id || charge.studentId || charge.student_id;
  if (chargeStudentId && student.id && String(chargeStudentId) === String(student.id)) return true;
  return normalizeText(charge.studentNumber || charge.student?.studentNumber || charge.student?.student_number) === normalizeText(getStudentNumber(student));
}

function mergeStudentCharges(current, replacement, student) {
  return [
    ...current.filter((charge) => !chargeMatchesStudent(charge, student)),
    ...replacement,
  ];
}
