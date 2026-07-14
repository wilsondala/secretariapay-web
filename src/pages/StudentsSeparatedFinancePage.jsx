import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, RefreshCw, Search, Users, WalletCards } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StudentFinancialAccountsDrawer from '../components/financial/StudentFinancialAccountsDrawer.jsx';
import { listCharges } from '../services/chargesService.js';
import { listStudents } from '../services/studentsService.js';
import { formatMoney, getStudentClass, getStudentCourse, getStudentName, getStudentNumber, normalizeCharge, normalizeText } from '../utils/formatters.js';
import { buildSeparatedSummary, chargeMatchesStudent, mergeStudentCharges } from '../utils/financialSeparation.js';

const PAGE_SIZE = 10;

export default function StudentsSeparatedFinancePage() {
  const [students, setStudents] = useState([]);
  const [charges, setCharges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState('NAME');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [studentData, chargeData] = await Promise.all([listStudents(), listCharges()]);
      setStudents(studentData);
      setCharges(chargeData.map(normalizeCharge));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Falha ao carregar estudantes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => students.map((student) => ({
    student,
    summary: buildSeparatedSummary(charges.filter((charge) => chargeMatchesStudent(charge, student))),
  })), [students, charges]);

  const overview = useMemo(() => rows.reduce((result, row) => ({
    total: result.total + 1,
    regularized: result.regularized + (row.summary.totalOpen === 0 && row.summary.totalPaid > 0 ? 1 : 0),
    overdue: result.overdue + (row.summary.overdueCount > 0 ? 1 : 0),
    tuitionOpen: result.tuitionOpen + row.summary.tuition.openAmount,
    servicesOpen: result.servicesOpen + row.summary.services.openAmount,
    totalOpen: result.totalOpen + row.summary.totalOpen,
  }), { total: 0, regularized: 0, overdue: 0, tuitionOpen: 0, servicesOpen: 0, totalOpen: 0 }), [rows]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return rows.filter(({ student, summary }) => {
      const matchesText = !term || normalizeText(`${getStudentName(student)} ${getStudentNumber(student)} ${getStudentCourse(student)} ${getStudentClass(student)}`).includes(term);
      const matchesFilter = filter === 'ALL'
        || (filter === 'OPEN' && summary.totalOpen > 0)
        || (filter === 'OVERDUE' && summary.overdueCount > 0)
        || (filter === 'REGULARIZED' && summary.totalOpen === 0 && summary.totalPaid > 0)
        || (filter === 'NO_CHARGES' && summary.totalCount === 0);
      return matchesText && matchesFilter;
    }).sort((left, right) => {
      if (sort === 'TOTAL') return right.summary.totalOpen - left.summary.totalOpen;
      if (sort === 'TUITION') return right.summary.tuition.openAmount - left.summary.tuition.openAmount;
      if (sort === 'SERVICES') return right.summary.services.openAmount - left.summary.services.openAmount;
      return getStudentName(left.student).localeCompare(getStudentName(right.student), 'pt');
    });
  }, [rows, search, filter, sort]);

  useEffect(() => setPage(1), [search, filter, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const items = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (loading) return <LoadingState message="Carregando contas financeiras separadas..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div><div className="premium-pill"><WalletCards size={14} /> Contas financeiras separadas</div><h1 className="mt-4 text-2xl font-black text-white sm:text-4xl">Estudantes</h1><p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Propinas e serviços académicos possuem saldos, comprovativos e documentos independentes.</p></div>
          <button onClick={load} className="btn-light"><RefreshCw size={17} /> Atualizar</button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat icon={Users} label="Estudantes" value={overview.total} />
        <Stat icon={CheckCircle2} label="Regularizados" value={overview.regularized} tone="green" />
        <Stat icon={AlertTriangle} label="Em atraso" value={overview.overdue} tone="red" />
        <Stat icon={GraduationCap} label="Saldo de propinas" value={formatMoney(overview.tuitionOpen)} tone="amber" />
        <Stat icon={BookOpenCheck} label="Saldo de serviços" value={formatMoney(overview.servicesOpen)} tone="violet" />
        <Stat icon={WalletCards} label="Saldo total" value={formatMoney(overview.totalOpen)} />
      </section>

      <section className="card-premium overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-white/10 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input-premium pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, matrícula, curso ou turma..." /></div>
          <select className="input-premium" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Todos os estados</option><option value="OPEN">Com saldo em aberto</option><option value="OVERDUE">Em atraso</option><option value="REGULARIZED">Regularizados</option><option value="NO_CHARGES">Sem lançamentos</option></select>
          <select className="input-premium" value={sort} onChange={(event) => setSort(event.target.value)}><option value="NAME">Ordenar por nome</option><option value="TOTAL">Maior saldo total</option><option value="TUITION">Maior saldo de propinas</option><option value="SERVICES">Maior saldo de serviços</option></select>
        </div>

        {!items.length ? <div className="p-8"><EmptyState title="Nenhum estudante encontrado" description="Ajuste a pesquisa ou os filtros." /></div> : <>
          <div className="hidden lg:block"><table className="w-full table-fixed text-left"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-white/[.03]"><tr><th className="w-[28%] px-4 py-3">Estudante</th><th className="w-[23%] px-4 py-3">Curso e turma</th><th className="w-[16%] px-4 py-3">Propinas</th><th className="w-[16%] px-4 py-3">Serviços</th><th className="w-[17%] px-4 py-3">Total em aberto</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">{items.map(({ student, summary }) => <StudentRow key={student.id || getStudentNumber(student)} student={student} summary={summary} onClick={() => setSelected(student)} />)}</tbody></table></div>
          <div className="space-y-3 p-4 lg:hidden">{items.map(({ student, summary }) => <StudentCard key={student.id || getStudentNumber(student)} student={student} summary={summary} onClick={() => setSelected(student)} />)}</div>
          {pages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 text-xs font-bold text-slate-500 dark:border-white/10"><span>Página {current} de {pages}</span><div className="flex gap-2"><button className="btn-secondary" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft size={15} /> Anterior</button><button className="btn-secondary" disabled={current >= pages} onClick={() => setPage(current + 1)}>Seguinte <ChevronRight size={15} /></button></div></div> : null}
        </>}
      </section>

      {selected ? <StudentFinancialAccountsDrawer student={selected} cachedCharges={charges.filter((item) => chargeMatchesStudent(item, selected))} onClose={() => setSelected(null)} onChargesUpdated={(replacement) => setCharges((currentCharges) => mergeStudentCharges(currentCharges, replacement, selected))} /> : null}
    </div>
  );
}

function StudentRow({ student, summary, onClick }) { return <tr onClick={onClick} className="cursor-pointer transition hover:bg-blue-50/70 dark:hover:bg-white/[.04]"><td className="px-4 py-4"><p className="truncate text-sm font-black text-slate-950 dark:text-white">{getStudentName(student)}</p><p className="mt-1 text-xs font-bold text-blue-700 dark:text-blue-300">{getStudentNumber(student)}</p></td><td className="px-4 py-4"><p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{getStudentCourse(student)}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500">{getStudentClass(student)}</p></td><td className="px-4 py-4"><Balance amount={summary.tuition.openAmount} paid={summary.tuition.paidAmount} /></td><td className="px-4 py-4"><Balance amount={summary.services.openAmount} paid={summary.services.paidAmount} /></td><td className="px-4 py-4"><p className={`text-sm font-black ${summary.totalOpen ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(summary.totalOpen)}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{summary.overdueCount ? `${summary.overdueCount} vencida(s)` : 'Sem atraso'}</p></td></tr>; }
function StudentCard({ student, summary, onClick }) { return <button onClick={onClick} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-white/10 dark:bg-white/[.03]"><div className="flex justify-between gap-3"><div><p className="text-sm font-black text-slate-950 dark:text-white">{getStudentName(student)}</p><p className="mt-1 text-xs font-bold text-blue-700 dark:text-blue-300">{getStudentNumber(student)}</p></div><ChevronRight size={18} className="text-slate-400" /></div><div className="mt-4 grid grid-cols-3 gap-2"><Small label="Propinas" value={formatMoney(summary.tuition.openAmount)} /><Small label="Serviços" value={formatMoney(summary.services.openAmount)} /><Small label="Total" value={formatMoney(summary.totalOpen)} /></div></button>; }
function Balance({ amount, paid }) { return <div><p className={`text-sm font-black ${amount ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(amount)}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">Pago: {formatMoney(paid)}</p></div>; }
function Stat({ icon: Icon, label, value, tone = 'blue' }) { const colors = { blue: 'border-blue-200 bg-blue-50 text-blue-950', green: 'border-emerald-200 bg-emerald-50 text-emerald-950', red: 'border-red-200 bg-red-50 text-red-900', amber: 'border-amber-200 bg-amber-50 text-amber-950', violet: 'border-violet-200 bg-violet-50 text-violet-950' }; return <div className={`rounded-2xl border p-4 ${colors[tone]}`}><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 break-words text-xl font-black">{value}</p></div><Icon size={20} /></div></div>; }
function Small({ label, value }) { return <div className="rounded-xl bg-slate-50 p-2 dark:bg-white/5"><p className="text-[9px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 break-words text-[10px] font-black text-slate-950 dark:text-white">{value}</p></div>; }
