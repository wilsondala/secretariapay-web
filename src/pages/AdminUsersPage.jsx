import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { changeAdminUserStatus, createAdminUser, fetchAdminUserRoles, fetchAdminUsers, updateAdminUser } from '../services/adminUsersService.js';
import { env } from '../config/env.js';

const roleLabels = {
  ADMIN_GLOBAL: 'Administrador global', ADMIN_INSTITUTION: 'Administrador institucional', ADMIN_IMETRO: 'Administrador IMETRO',
  DIRECAO: 'Direção', FINANCEIRO: 'Financeiro', TESOURARIA: 'Tesouraria', SECRETARIA: 'Secretaria',
  OPERADOR_ATENDIMENTO: 'Operador de atendimento', DCR_COORDENACAO: 'Coordenação DCR', DCR_OPERADOR: 'Operador DCR',
  TIC: 'TIC', AUDITORIA: 'Auditoria', ADMIN: 'Administrador legado', COMPANY_ADMIN: 'Administrador legado', OPERATOR: 'Operador legado',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [userItems, roleItems] = await Promise.all([fetchAdminUsers(), fetchAdminUserRoles()]);
      setUsers(userItems);
      setRoles(roleItems);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => !q || [user.fullName, user.email, user.role, user.status, user.whatsapp].join(' ').toLowerCase().includes(q));
  }, [users, search]);

  const active = users.filter((user) => user.status === 'ACTIVE').length;
  const blocked = users.filter((user) => user.status === 'BLOCKED').length;

  async function toggleStatus(user) {
    const next = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`${next === 'ACTIVE' ? 'Ativar' : 'Desativar'} ${user.fullName}?`)) return;
    await changeAdminUserStatus(user.id, next);
    await load();
  }

  return <div className="space-y-5">
    <section className="rounded-3xl bg-gradient-to-r from-[#061936] via-[#0B2D63] to-[#061936] p-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.16em]"><ShieldCheck size={14}/> Segurança institucional</div><h1 className="mt-4 text-3xl font-black">Usuários e permissões</h1><p className="mt-2 text-sm font-semibold text-white/75">Controle operadores, perfis de acesso e estado das contas administrativas.</p></div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={18}/> Novo usuário</button>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-3">
      <Summary title="Usuários" value={users.length} icon={Users}/><Summary title="Ativos" value={active} icon={UserCheck}/><Summary title="Bloqueados/inativos" value={users.length - active} icon={UserX}/>
    </div>

    <section className="card-premium p-4">
      <div className="relative max-w-xl"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input className="input-premium pl-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, perfil ou estado..."/></div>
      <div className="mt-5 space-y-3">
        {loading ? <p className="p-6 text-sm font-semibold text-slate-500">Carregando usuários...</p> : filtered.map((user) => <div key={user.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_190px] lg:items-center">
          <div><p className="font-black text-slate-950 dark:text-white">{user.fullName}</p><p className="text-xs font-semibold text-slate-500">{user.email}</p>{user.whatsapp && <p className="mt-1 text-xs text-slate-400">WhatsApp: {user.whatsapp}</p>}</div>
          <div><p className="text-sm font-black text-slate-700 dark:text-slate-200">{roleLabels[user.role] || user.role}</p><p className="text-xs text-slate-500">{user.institutionName || env.institutionShortName}</p></div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'}`}>{user.status}</span>
          <div className="flex flex-wrap justify-end gap-2"><button onClick={() => setEditing(user)} className="btn-secondary"><Pencil size={15}/> Editar</button><button onClick={() => toggleStatus(user)} className="btn-secondary">{user.status === 'ACTIVE' ? <UserX size={15}/> : <UserCheck size={15}/>} {user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}</button></div>
        </div>)}
      </div>
    </section>

    {editing && <UserModal user={editing} roles={roles} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }}/>} 
  </div>;
}

function UserModal({ user, roles, onClose, onSaved }) {
  const isNew = !user.id;
  const [form, setForm] = useState({ fullName: user.fullName || '', email: user.email || '', password: '', role: user.role || 'DCR_OPERADOR', status: user.status || 'ACTIVE', whatsapp: user.whatsapp || '', institutionId: user.institutionId || env.institutionId });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) { e.preventDefault(); setSaving(true); setError(''); try { isNew ? await createAdminUser(form) : await updateAdminUser(user.id, form); await onSaved(); } catch (err) { setError(err?.response?.data?.message || err?.message || 'Não foi possível salvar o usuário.'); } finally { setSaving(false); } }
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2E]"><h2 className="text-xl font-black text-slate-950 dark:text-white">{isNew ? 'Novo usuário' : 'Editar usuário'}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nome completo"><input className="input-premium" value={form.fullName} onChange={(e) => setForm({...form, fullName:e.target.value})} required/></Field><Field label="E-mail"><input type="email" className="input-premium" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} required/></Field><Field label={isNew ? 'Palavra-passe' : 'Nova palavra-passe (opcional)'}><input type="password" className="input-premium" value={form.password} onChange={(e) => setForm({...form, password:e.target.value})} required={isNew} minLength={isNew ? 8 : undefined}/></Field><Field label="WhatsApp"><input className="input-premium" value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp:e.target.value})}/></Field><Field label="Perfil"><select className="input-premium" value={form.role} onChange={(e) => setForm({...form, role:e.target.value})}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role] || role}</option>)}</select></Field><Field label="Estado"><select className="input-premium" value={form.status} onChange={(e) => setForm({...form, status:e.target.value})}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="BLOCKED">Bloqueado</option></select></Field></div>{error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</div>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button disabled={saving} className="btn-primary"><KeyRound size={17}/>{saving ? 'Salvando...' : 'Salvar usuário'}</button></div></form></div>;
}

function Field({ label, children }) { return <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Summary({ title, value, icon: Icon }) { return <div className="card-premium p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-500">{title}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Icon size={22}/></div></div></div>; }
