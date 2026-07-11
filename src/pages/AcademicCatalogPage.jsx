import { useEffect, useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Loader2, Pencil, Plus, RefreshCw, Search, UsersRound, X } from 'lucide-react';
import { env } from '../config/env.js';
import { fetchClasses, fetchCourses, saveClass, saveCourse } from '../services/academicCatalogService.js';
import usePermissions from '../shared/auth/usePermissions.js';

const shifts = [
  ['MORNING', 'Manhã'], ['AFTERNOON', 'Tarde'], ['EVENING', 'Fim da tarde'], ['NIGHT', 'Noite'], ['WEEKEND', 'Fim de semana'],
];

export default function AcademicCatalogPage() {
  const { can } = usePermissions();
  const canManageCatalog = can('manageAcademicCatalog');
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const [courseItems, classItems] = await Promise.all([fetchCourses(env.institutionId), fetchClasses(env.institutionId)]);
      setCourses(courseItems); setClasses(classItems);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Não foi possível carregar a gestão académica.');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const visibleCourses = useMemo(() => courses.filter((item) => [item.name, item.code, item.faculty].join(' ').toLowerCase().includes(search.toLowerCase())), [courses, search]);
  const visibleClasses = useMemo(() => classes.filter((item) => [item.name, item.courseName, item.academicYear, item.shift].join(' ').toLowerCase().includes(search.toLowerCase())), [classes, search]);

  return <div className="space-y-5">
    <section className="rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em]"><GraduationCap size={14}/> Gestão académica</div><h1 className="mt-4 text-3xl font-black">Cursos e turmas</h1><p className="mt-2 max-w-3xl text-sm font-semibold text-white/75">Administre a estrutura académica usada pelas importações, estudantes e cobranças.</p></div>
        <div className="flex gap-2"><button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black"><RefreshCw size={17}/> Atualizar</button>{canManageCatalog ? <button onClick={() => setEditing({ type: tab === 'courses' ? 'course' : 'class' })} className="inline-flex items-center gap-2 rounded-2xl bg-imetro-gold px-4 py-3 text-sm font-black text-imetro-navy"><Plus size={17}/> Novo {tab === 'courses' ? 'curso' : 'turma'}</button> : null}</div>
      </div>
    </section>

    {!canManageCatalog ? <div className="rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">Acesso em modo de consulta. O seu perfil não pode criar nem editar cursos e turmas.</div> : null}

    <div className="grid gap-4 sm:grid-cols-3"><Metric title="Cursos" value={courses.length} icon={BookOpen}/><Metric title="Turmas" value={classes.length} icon={UsersRound}/><Metric title="Ativos" value={tab === 'courses' ? courses.filter(i=>i.active).length : classes.filter(i=>i.active).length} icon={GraduationCap}/></div>

    <section className="card-premium p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex gap-2"><Tab active={tab==='courses'} onClick={()=>setTab('courses')}>Cursos</Tab><Tab active={tab==='classes'} onClick={()=>setTab('classes')}>Turmas</Tab></div><div className="relative w-full md:max-w-md"><Search size={18} className="absolute left-4 top-3.5 text-slate-400"/><input className="input-premium pl-11" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."/></div></div>
      {error && <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm font-bold text-red-600 dark:text-red-200">{error}</div>}
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin"/></div> : tab === 'courses' ? <div className="mt-5 grid gap-3 xl:grid-cols-2">{visibleCourses.map(item=><CourseCard key={item.id} item={item} canEdit={canManageCatalog} onEdit={()=>setEditing({type:'course', item})}/>)}</div> : <div className="mt-5 grid gap-3 xl:grid-cols-2">{visibleClasses.map(item=><ClassCard key={item.id} item={item} canEdit={canManageCatalog} onEdit={()=>setEditing({type:'class', item})}/>)}</div>}
    </section>
    {editing && canManageCatalog ? <EditModal mode={editing.type} item={editing.item} courses={courses} onClose={()=>setEditing(null)} onSaved={async()=>{setEditing(null);await load();}}/> : null}
  </div>;
}

function Metric({title,value,icon:Icon}){return <div className="card-premium p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-500">{title}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"><Icon size={22}/></div></div></div>}
function Tab({active,onClick,children}){return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-black ${active?'bg-[#3157D5] text-white':'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>{children}</button>}
function CourseCard({item,onEdit,canEdit}){return <div className="rounded-3xl border border-slate-100 bg-white p-5 dark:border-white/10 dark:bg-[#0D1B2E]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">{item.code||'Sem código'}</p><h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{item.name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{item.faculty||'Sem faculdade'} · {item.durationYears||'-'} anos</p></div>{canEdit ? <button onClick={onEdit} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><Pencil size={16}/></button> : null}</div><span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${item.active?'bg-emerald-500/10 text-emerald-600':'bg-slate-500/10 text-slate-500'}`}>{item.active?'Ativo':'Inativo'}</span></div>}
function ClassCard({item,onEdit,canEdit}){return <div className="rounded-3xl border border-slate-100 bg-white p-5 dark:border-white/10 dark:bg-[#0D1B2E]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">{item.courseName}</p><h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{item.name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{item.academicYear} · {shiftLabel(item.shift)} · {item.yearLevel||'-'}º ano</p></div>{canEdit ? <button onClick={onEdit} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><Pencil size={16}/></button> : null}</div><span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${item.active?'bg-emerald-500/10 text-emerald-600':'bg-slate-500/10 text-slate-500'}`}>{item.active?'Ativa':'Inativa'}</span></div>}
function shiftLabel(value){return shifts.find(([key])=>key===value)?.[1]||value||'-'}

function EditModal({mode,item,courses,onClose,onSaved}){
  const [form,setForm]=useState(mode==='course'?{id:item?.id,institutionId:env.institutionId,name:item?.name||'',code:item?.code||'',faculty:item?.faculty||'',durationYears:item?.durationYears||4,active:item?.active??true}:{id:item?.id,courseId:item?.courseId||courses[0]?.id||'',name:item?.name||'',academicYear:item?.academicYear||'2025/2026',yearLevel:item?.yearLevel||1,shift:item?.shift||'NIGHT',active:item?.active??true});
  const [saving,setSaving]=useState(false);const[error,setError]=useState('');
  async function submit(e){e.preventDefault();setSaving(true);setError('');try{mode==='course'?await saveCourse(form):await saveClass(form);await onSaved();}catch(err){setError(err?.response?.data?.message||err?.message||'Não foi possível guardar.');}finally{setSaving(false)}}
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2E]"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{item?'Editar':'Novo'} {mode==='course'?'curso':'turma'}</h2></div><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X size={18}/></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{mode==='course'?<><Field label="Nome"><input className="input-premium" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Código"><input className="input-premium" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></Field><Field label="Faculdade"><input className="input-premium" value={form.faculty} onChange={e=>setForm({...form,faculty:e.target.value})}/></Field><Field label="Duração"><input type="number" min="1" max="10" className="input-premium" value={form.durationYears} onChange={e=>setForm({...form,durationYears:Number(e.target.value)})}/></Field></>:<><Field label="Curso"><select className="input-premium" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})}>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Nome da turma"><input className="input-premium" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Ano letivo"><input className="input-premium" value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/></Field><Field label="Ano do curso"><input type="number" min="1" max="10" className="input-premium" value={form.yearLevel} onChange={e=>setForm({...form,yearLevel:Number(e.target.value)})}/></Field><Field label="Turno"><select className="input-premium" value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})}>{shifts.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field></>}<label className="flex items-center gap-3"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span className="text-sm font-black text-slate-600 dark:text-slate-300">Ativo</span></label></div>{error&&<div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm font-bold text-red-600">{error}</div>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader2 size={17} className="animate-spin"/>} Guardar</button></div></form></div>
}
function Field({label,children}){return <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>}
