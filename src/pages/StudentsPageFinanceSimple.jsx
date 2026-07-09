import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StudentMonthlyLedger from '../components/financial/StudentMonthlyLedger.jsx';
import { listChargesByStudent } from '../services/chargesService.js';
import { listStudents } from '../services/studentsService.js';
import { getStudentClass, getStudentCourse, getStudentName, getStudentNumber, normalizeCharge, normalizeText } from '../utils/formatters.js';

export default function StudentsPageFinanceSimple() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [charges, setCharges] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [chargesLoading, setChargesLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudents();
      setStudents(data);
      setSelected((current) => current || data[0] || null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar estudantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    async function loadCharges() {
      if (!selected?.id) return setCharges([]);
      setChargesLoading(true);
      try {
        const data = await listChargesByStudent(selected.id);
        setCharges(data.map(normalizeCharge));
      } catch {
        setCharges([]);
      } finally {
        setChargesLoading(false);
      }
    }
    loadCharges();
  }, [selected]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return students.filter((student) => normalizeText([getStudentName(student), getStudentNumber(student), getStudentCourse(student), getStudentClass(student)].join(' ')).includes(term));
  }, [students, search]);

  if (loading) return <LoadingState message="Carregando estudantes..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">Estudantes</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">Resumo financeiro mensal do mês 1 ao 12, com data e hora do pagamento registado.</p>
          </div>
          <button className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white" onClick={load}><RefreshCw size={17} />Atualizar</button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(430px,.95fr)]">
        <div className="card-premium overflow-hidden">
          <div className="border-b border-slate-100/80 bg-white/80 p-4">
            <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input-premium pl-11" placeholder="Buscar por nome, matrícula, curso ou turma..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          </div>
          <div className="max-h-[72vh] overflow-y-auto p-4">
            {filtered.length === 0 ? <EmptyState /> : <div className="space-y-3">{filtered.map((student) => <button key={student.id || getStudentNumber(student)} onClick={() => setSelected(student)} className={`w-full rounded-3xl border bg-white p-4 text-left shadow-sm ${selected?.id === student.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100'}`}><p className="font-black text-slate-950">{getStudentName(student)}</p><p className="mt-1 text-sm font-bold text-imetro-navy">{getStudentNumber(student)}</p><p className="mt-2 text-xs font-semibold text-slate-500">{getStudentCourse(student)} · {getStudentClass(student)}</p></button>)}</div>}
          </div>
        </div>

        <aside className="space-y-4">
          {!selected ? <div className="card-premium p-4"><EmptyState title="Selecione um estudante" message="Clique no estudante para ver os 12 meses." /></div> : <StudentMonthlyLedger student={selected} charges={charges} loading={chargesLoading} />}
        </aside>
      </section>
    </div>
  );
}
