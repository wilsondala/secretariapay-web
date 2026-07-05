import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Mail, Phone, RefreshCw, Search, ShieldAlert, UserRound, Users } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { listChargesByStudent } from '../services/chargesService.js';
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
  getStudentStatus,
  getStudentWhatsapp,
  isStudentBlocked,
  normalizeCharge,
  normalizeText,
  safeText,
} from '../utils/formatters.js';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [contactFilter, setContactFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [studentCharges, setStudentCharges] = useState([]);
  const [chargesLoading, setChargesLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudents();
      setStudents(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Falha ao carregar estudantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadCharges = async () => {
      if (!selected?.id) {
        setStudentCharges([]);
        return;
      }
      setChargesLoading(true);
      try {
        const data = await listChargesByStudent(selected.id);
        setStudentCharges(data.map(normalizeCharge));
      } catch {
        setStudentCharges([]);
      } finally {
        setChargesLoading(false);
      }
    };
    loadCharges();
  }, [selected]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return students.filter((student) => {
      const text = normalizeText([
        getStudentName(student),
        getStudentNumber(student),
        getStudentCourse(student),
        getStudentClass(student),
        getStudentWhatsapp(student),
        getStudentPhone(student),
        getStudentEmail(student),
      ].join(' '));

      const matchesSearch = !term || text.includes(term);
      const hasWhatsapp = Boolean(getStudentWhatsapp(student));
      const hasAnyContact = Boolean(getStudentWhatsapp(student) || getStudentPhone(student) || getStudentEmail(student));
      const matchesContact =
        contactFilter === 'ALL' ||
        (contactFilter === 'WHATSAPP' && hasWhatsapp) ||
        (contactFilter === 'NO_CONTACT' && !hasAnyContact) ||
        (contactFilter === 'BLOCKED' && isStudentBlocked(student));

      return matchesSearch && matchesContact;
    });
  }, [students, search, contactFilter]);

  const stats = useMemo(() => {
    const noContact = students.filter((student) => !getStudentWhatsapp(student) && !getStudentPhone(student) && !getStudentEmail(student));
    const withWhatsapp = students.filter((student) => getStudentWhatsapp(student));
    const blocked = students.filter(isStudentBlocked);
    return { total: students.length, withWhatsapp: withWhatsapp.length, noContact: noContact.length, blocked: blocked.length };
  }, [students]);

  const openCharges = studentCharges.filter(chargeIsOpen);
  const overdueCharges = studentCharges.filter(chargeIsOverdue);
  const openAmount = openCharges.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0);

  if (loading) return <LoadingState message="Carregando estudantes do IMETRO..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="page-title">Estudantes</h1>
          <p className="page-subtitle">Consulta real do cadastro académico, contactos oficiais e situação financeira.</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de estudantes" value={stats.total} description="Cadastro académico" icon={Users} />
        <StatCard title="Com WhatsApp" value={stats.withWhatsapp} description="Contacto oficial" icon={Phone} tone="success" />
        <StatCard title="Sem contacto" value={stats.noContact} description="Corrigir cadastro" icon={AlertTriangle} tone="warning" />
        <StatCard title="Bloqueados" value={stats.blocked} description="Restrição financeira" icon={ShieldAlert} tone="danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  className="input pl-10"
                  placeholder="Buscar por nome, matrícula, curso, WhatsApp, telefone ou e-mail..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select className="input md:w-56" value={contactFilter} onChange={(event) => setContactFilter(event.target.value)}>
                <option value="ALL">Todos</option>
                <option value="WHATSAPP">Com WhatsApp</option>
                <option value="NO_CONTACT">Sem contacto</option>
                <option value="BLOCKED">Com bloqueio</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Estudante</th>
                  <th className="px-5 py-3">Curso/Turma</th>
                  <th className="px-5 py-3">Contacto oficial</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((student) => {
                  const active = selected?.id === student.id;
                  return (
                    <tr
                      key={student.id || getStudentNumber(student)}
                      className={`cursor-pointer transition hover:bg-imetro-goldSoft/40 ${active ? 'bg-imetro-goldSoft/70' : ''}`}
                      onClick={() => setSelected(student)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">{getStudentName(student)}</p>
                        <p className="mt-1 text-xs font-semibold text-imetro-navy">Matrícula: {getStudentNumber(student)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">{getStudentCourse(student)}</p>
                        <p className="mt-1 text-xs text-slate-500">{getStudentClass(student)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">{safeText(getStudentWhatsapp(student), 'Sem WhatsApp')}</p>
                        <p className="mt-1 text-xs text-slate-500">{safeText(getStudentEmail(student), 'Sem e-mail')}</p>
                      </td>
                      <td className="px-5 py-4">
                        {isStudentBlocked(student) ? <StatusBadge status="BLOCKED" label="Bloqueado" /> : <StatusBadge status={getStudentStatus(student)} label="Activo" />}
                      </td>
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
            <EmptyState title="Selecione um estudante" message="Clique numa linha para ver os detalhes." />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-imetro-navy text-white">
                  <UserRound size={25} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{getStudentName(selected)}</h2>
                  <p className="mt-1 text-sm font-semibold text-imetro-navy">{getStudentNumber(selected)}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-black text-slate-800">Dados académicos</p>
                <div className="mt-3 space-y-2 text-slate-600">
                  <Line label="Curso" value={getStudentCourse(selected)} />
                  <Line label="Turma" value={getStudentClass(selected)} />
                  <Line label="Estado" value={isStudentBlocked(selected) ? 'Com restrição financeira' : 'Activo'} />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-black text-slate-800">Contactos oficiais</p>
                <div className="mt-3 space-y-2 text-slate-600">
                  <Line label="WhatsApp" value={safeText(getStudentWhatsapp(selected), 'Não cadastrado')} icon={Phone} />
                  <Line label="Telefone" value={safeText(getStudentPhone(selected), 'Não cadastrado')} icon={Phone} />
                  <Line label="E-mail" value={safeText(getStudentEmail(selected), 'Não cadastrado')} icon={Mail} />
                </div>
              </div>

              <div className="rounded-2xl bg-imetro-goldSoft p-4 text-sm text-imetro-navy">
                <p className="font-black">Resumo financeiro</p>
                {chargesLoading ? (
                  <p className="mt-3">Carregando cobranças...</p>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Mini label="Em aberto" value={openCharges.length} />
                    <Mini label="Vencidas" value={overdueCharges.length} />
                    <Mini label="Total aberto" value={formatMoney(openAmount)} wide />
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Line({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-2 last:border-b-0 last:pb-0">
      <span className="flex items-center gap-2 font-semibold text-slate-500">{Icon && <Icon size={14} />}{label}</span>
      <span className="max-w-[60%] text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}

function Mini({ label, value, wide }) {
  return (
    <div className={`rounded-2xl bg-white/80 p-3 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
