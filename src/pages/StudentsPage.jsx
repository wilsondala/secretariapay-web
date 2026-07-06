import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const overdueAmount = overdueCharges.reduce((sum, charge) => sum + Number(charge.totalAmount || 0), 0);
  const selectedWhatsapp = selected ? getStudentWhatsapp(selected) : '';
  const selectedBlocked = selected ? isStudentBlocked(selected) : false;

  if (loading) return <LoadingState message="Carregando estudantes do IMETRO..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <GraduationCap size={14} />
              Cadastro académico e financeiro
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Estudantes</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Consulta real do cadastro académico, contactos oficiais, situação financeira e restrições académicas dos estudantes.
            </p>
          </div>
          <button className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-[0_16px_44px_rgba(0,0,0,.12)] transition hover:bg-white/15" onClick={load}>
            <RefreshCw size={17} />
            Atualizar dados
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de estudantes" value={stats.total} description="Registos académicos ativos" icon={Users} />
        <StatCard title="Com WhatsApp" value={stats.withWhatsapp} description="Contactos oficiais validados" icon={Phone} tone="success" />
        <StatCard title="Sem contacto" value={stats.noContact} description="Cadastros para correção" icon={AlertTriangle} tone="warning" />
        <StatCard title="Bloqueados" value={stats.blocked} description="Restrição financeira aplicada" icon={ShieldAlert} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
        <div className="card-premium min-w-0 overflow-hidden">
          <div className="border-b border-slate-100/80 bg-white/80 p-4 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-w-0">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  className="input-premium pl-11"
                  placeholder="Buscar por nome, matrícula, curso, WhatsApp, telefone ou e-mail..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select className="input-premium" value={contactFilter} onChange={(event) => setContactFilter(event.target.value)}>
                <option value="ALL">Todos</option>
                <option value="WHATSAPP">Com WhatsApp</option>
                <option value="NO_CONTACT">Sem contacto</option>
                <option value="BLOCKED">Com bloqueio</option>
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {filtered.map((student) => (
                  <StudentCard
                    key={student.id || getStudentNumber(student)}
                    student={student}
                    active={selected?.id === student.id}
                    onClick={() => setSelected(student)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="card-premium min-w-0 p-4 xl:sticky xl:top-24 xl:self-start">
          {!selected ? (
            <EmptyState title="Selecione um estudante" message="Clique num estudante para ver os detalhes." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-4">
                <div className="flex items-start gap-4">
                  <StudentAvatar student={selected} size="large" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-lg font-black leading-tight text-slate-950">{getStudentName(selected)}</h2>
                      {selectedBlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700 ring-1 ring-red-100">
                          <ShieldAlert size={13} /> Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                          <ShieldCheck size={13} /> Regular
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-black text-imetro-navy">{getStudentNumber(selected)}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{getStudentCourse(selected)} · {getStudentClass(selected)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <a
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-black transition ${selectedWhatsapp ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400'}`}
                    href={selectedWhatsapp ? `https://wa.me/${onlyDigits(selectedWhatsapp)}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                  <Link className="inline-flex items-center justify-center gap-2 rounded-2xl bg-imetro-navy px-3 py-2.5 text-xs font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.18)] transition hover:bg-imetro-navySoft" to="/charges">
                    <ReceiptText size={15} />
                    Cobrança
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <InfoPanel icon={GraduationCap} title="Dados académicos">
                  <Line label="Curso" value={getStudentCourse(selected)} />
                  <Line label="Turma" value={getStudentClass(selected)} />
                  <Line label="Estado" value={selectedBlocked ? 'Com restrição financeira' : 'Activo'} />
                </InfoPanel>

                <InfoPanel icon={Phone} title="Contactos oficiais">
                  <Line label="WhatsApp" value={safeText(getStudentWhatsapp(selected), 'Não cadastrado')} icon={MessageCircle} />
                  <Line label="Telefone" value={safeText(getStudentPhone(selected), 'Não cadastrado')} icon={Phone} />
                  <Line label="E-mail" value={safeText(getStudentEmail(selected), 'Não cadastrado')} icon={Mail} />
                </InfoPanel>

                <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-sm text-imetro-navy">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
                      <WalletCards size={19} />
                    </div>
                    <div>
                      <p className="font-black">Resumo financeiro</p>
                      <p className="text-xs font-semibold text-slate-500">Situação consolidada do estudante</p>
                    </div>
                  </div>

                  {chargesLoading ? (
                    <p className="mt-4 text-sm font-semibold">Carregando cobranças...</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Mini label="Em aberto" value={openCharges.length} tone="warning" />
                      <Mini label="Vencidas" value={overdueCharges.length} tone="danger" />
                      <Mini label="Total aberto" value={formatMoney(openAmount)} wide />
                      <Mini label="Valor vencido" value={formatMoney(overdueAmount)} tone="danger" wide />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function StudentCard({ student, active, onClick }) {
  const whatsapp = getStudentWhatsapp(student);
  const noContact = !whatsapp && !getStudentPhone(student) && !getStudentEmail(student);
  const blocked = isStudentBlocked(student);

  return (
    <article
      className={`group cursor-pointer rounded-3xl border bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,.09)] ${
        active ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'
      }`}
      onClick={onClick}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(190px,.65fr)_minmax(190px,.58fr)] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <StudentAvatar student={student} warning={noContact || blocked} />
          <div className="min-w-0">
            <h3 className="break-words text-base font-black leading-5 text-slate-950">{getStudentName(student)}</h3>
            <p className="mt-1 text-sm font-bold text-imetro-navy">{getStudentNumber(student)}</p>
            <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
              {blocked ? <StatusBadge status="BLOCKED" label="Bloqueado" /> : <StatusBadge status={getStudentStatus(student)} label="Activo" />}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-3 lg:bg-transparent lg:px-0 lg:py-0">
          <p className="break-words text-sm font-black text-slate-800">{getStudentCourse(student)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{getStudentClass(student)}</p>
        </div>

        <div className="min-w-0 text-left lg:text-right">
          {whatsapp ? (
            <>
              <p className="break-words text-sm font-black text-emerald-700">{whatsapp}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">WhatsApp oficial</p>
            </>
          ) : (
            <>
              <p className="text-sm font-black text-amber-600">Sem contacto</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Corrigir cadastro</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-imetro-navy transition hover:bg-slate-50" type="button">
          <Eye size={15} />
          Ver detalhes
        </button>
        <a
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-black transition ${
            whatsapp ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400'
          }`}
          href={whatsapp ? `https://wa.me/${onlyDigits(whatsapp)}` : undefined}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          <MessageCircle size={15} />
          WhatsApp
        </a>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-imetro-navy px-3 py-2.5 text-xs font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.18)] transition hover:bg-imetro-navySoft"
          to="/charges"
          onClick={(event) => event.stopPropagation()}
        >
          <ReceiptText size={15} />
          Cobrança
        </Link>
      </div>
    </article>
  );
}

function StudentAvatar({ student, warning = false, size = 'normal' }) {
  const name = getStudentName(student);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase() || 'AL';
  const sizes = size === 'large' ? 'h-14 w-14 text-lg rounded-3xl' : 'h-12 w-12 text-base rounded-2xl';

  return (
    <div className="relative shrink-0">
      <div className={`flex ${sizes} items-center justify-center bg-gradient-to-br from-[#07142D] to-[#0B2A5B] font-black text-white shadow-[0_14px_34px_rgba(7,20,45,.22)]`}>
        {initials}
      </div>
      <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white ring-2 ring-white ${warning ? 'bg-amber-500' : 'bg-emerald-500'}`}>
        {warning ? <AlertTriangle size={13} /> : <MessageCircle size={13} />}
      </span>
    </div>
  );
}

function InfoPanel({ icon: Icon, title, children }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,.04)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-imetro-navy text-white shadow-lg">
          <Icon size={19} />
        </div>
        <p className="font-black text-slate-900">{title}</p>
      </div>
      <div className="space-y-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function Line({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="flex items-center gap-2 font-semibold text-slate-500">{Icon && <Icon size={14} />}{label}</span>
      <span className="max-w-[62%] break-words text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}

function Mini({ label, value, wide, tone = 'navy' }) {
  const tones = {
    navy: 'border-blue-100 bg-blue-50/70 text-imetro-navy',
    warning: 'border-amber-100 bg-amber-50 text-amber-800',
    danger: 'border-red-100 bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl border p-3 ${tones[tone] || tones.navy} ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 break-words text-base font-black">{value}</p>
    </div>
  );
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}
