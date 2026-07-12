import { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Plus, RefreshCw, Search, ToggleLeft, ToggleRight, X } from 'lucide-react';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';
import { listAcademicServices, saveAcademicService, setAcademicServiceActive } from '../services/academicServicesService.js';

const EMPTY_FORM = {
  id: null,
  code: '',
  name: '',
  category: 'ACADEMIC',
  unitPrice: '',
  currency: 'AOA',
  active: true,
  generatesGuide: true,
  generatesReceipt: true,
  allowsDiscount: false,
  allowsPenalty: false,
  availableWhatsapp: true,
  availablePortal: true,
  availablePanel: true,
  displayOrder: 0,
};

const CATEGORY_LABELS = {
  ACADEMIC: 'Académico',
  DOCUMENT: 'Documentos',
  PENALTY: 'Multas e penalidades',
  OTHER: 'Outros',
};

function money(value, currency = 'AOA') {
  if (value === null || value === undefined || value === '') return 'Preço não definido';
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} ${currency === 'AOA' ? 'Kz' : currency}`;
}

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled} className="flex items-center gap-2 text-left text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300">
      {checked ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-slate-400" />}
      {label}
    </button>
  );
}

function Modal({ form, setForm, onClose, onSave, saving }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B192A]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#3157D5]">Tabela de preços</p><h2 className="mt-1 text-xl font-extrabold">{form.id ? 'Editar serviço' : 'Novo serviço académico'}</h2></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X size={19} /></button>
        </div>
        <form onSubmit={onSave} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-500">Código<input required value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#3157D5] dark:border-white/10 dark:bg-white/[.04]" /></label>
            <label className="text-xs font-bold text-slate-500">Categoria<select value={form.category} onChange={(e) => update('category', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#102238]">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <label className="block text-xs font-bold text-slate-500">Nome do serviço<input required value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#3157D5] dark:border-white/10 dark:bg-white/[.04]" /></label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-xs font-bold text-slate-500">Preço unitário<input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => update('unitPrice', e.target.value)} placeholder="Ex.: 45000" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/[.04]" /></label>
            <label className="text-xs font-bold text-slate-500">Moeda<select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#102238]"><option value="AOA">AOA / Kz</option><option value="USD">USD</option></select></label>
            <label className="text-xs font-bold text-slate-500">Ordem<input type="number" min="0" value={form.displayOrder} onChange={(e) => update('displayOrder', Number(e.target.value || 0))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/[.04]" /></label>
          </div>
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-white/10 dark:bg-white/[.03]">
            <Toggle label="Serviço ativo" checked={form.active} onChange={(v) => update('active', v)} />
            <Toggle label="Gera guia" checked={form.generatesGuide} onChange={(v) => update('generatesGuide', v)} />
            <Toggle label="Gera comprovativo" checked={form.generatesReceipt} onChange={(v) => update('generatesReceipt', v)} />
            <Toggle label="Permite desconto" checked={form.allowsDiscount} onChange={(v) => update('allowsDiscount', v)} />
            <Toggle label="Permite multa" checked={form.allowsPenalty} onChange={(v) => update('allowsPenalty', v)} />
            <Toggle label="Disponível no WhatsApp" checked={form.availableWhatsapp} onChange={(v) => update('availableWhatsapp', v)} />
            <Toggle label="Disponível no portal" checked={form.availablePortal} onChange={(v) => update('availablePortal', v)} />
            <Toggle label="Disponível no painel" checked={form.availablePanel} onChange={(v) => update('availablePanel', v)} />
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#3157D5] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Check size={17} />{saving ? 'A guardar...' : 'Guardar serviço'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function AcademicServicesPage() {
  const { user } = useAuth();
  const canManage = can(user, 'manageAcademicServices');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('ALL');
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true); setMessage('');
    try { setItems(await listAcademicServices()); }
    catch (error) { setMessage(error?.response?.data?.message || 'Não foi possível carregar a tabela de preços.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const term = query.trim().toLowerCase();
    const matchesTerm = !term || `${item.name} ${item.code}`.toLowerCase().includes(term);
    const matchesCategory = !category || item.category === category;
    const matchesStatus = status === 'ALL' || (status === 'ACTIVE' ? item.active : !item.active);
    return matchesTerm && matchesCategory && matchesStatus;
  }), [items, query, category, status]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.active).length,
    priced: items.filter((item) => item.unitPrice !== null && item.unitPrice !== undefined).length,
    whatsapp: items.filter((item) => item.availableWhatsapp && item.active).length,
  }), [items]);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const payload = { ...form, unitPrice: form.unitPrice === '' ? null : Number(form.unitPrice) };
      await saveAcademicService(payload);
      setForm(null); setMessage('Serviço guardado com sucesso.'); await load();
    } catch (error) { setMessage(error?.response?.data?.message || 'Não foi possível guardar o serviço.'); }
    finally { setSaving(false); }
  }

  async function toggle(item) {
    if (!canManage) return;
    try { await setAcademicServiceActive(item.id, !item.active); await load(); }
    catch (error) { setMessage(error?.response?.data?.message || 'Não foi possível alterar o estado do serviço.'); }
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-[#1E4A88] bg-gradient-to-r from-[#0B2D63] to-[#132D47] p-6 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#F4B400]">Gestão financeira · IMETRO</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Serviços académicos e tabela de preços</h1><p className="mt-2 max-w-3xl text-sm text-slate-200">Configure os valores oficiais usados nas guias, no WhatsApp, no portal do estudante e nos comprovativos.</p></div><div className="flex gap-3"><button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"><RefreshCw size={17} />Atualizar</button>{canManage && <button onClick={() => setForm({ ...EMPTY_FORM })} className="inline-flex items-center gap-2 rounded-xl bg-[#F4B400] px-4 py-3 text-sm font-extrabold text-[#10213A]"><Plus size={18} />Novo serviço</button>}</div></div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Serviços cadastrados', stats.total, 'Catálogo institucional'], ['Ativos', stats.active, 'Disponíveis para utilização'], ['Com preço definido', stats.priced, 'Prontos para gerar cobrança'], ['No WhatsApp', stats.whatsapp, 'Ativos no atendimento'],
      ].map(([label, value, helper]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0C1B2D]"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p></div>)}</div>

      {message && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">{message}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0C1B2D]">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px_180px] dark:border-white/10"><div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar serviço ou código..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/[.04]" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#102238]"><option value="">Todas as categorias</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#102238]"><option value="ALL">Todos os estados</option><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option></select></div>
        <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-white/[.03]"><tr><th className="px-5 py-4">Serviço</th><th className="px-4 py-4">Categoria</th><th className="px-4 py-4">Preço oficial</th><th className="px-4 py-4">Canais</th><th className="px-4 py-4">Estado</th><th className="px-5 py-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">{loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">A carregar serviços...</td></tr> : filtered.length === 0 ? <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">Nenhum serviço encontrado.</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[.025]"><td className="px-5 py-4"><p className="font-bold">{item.name}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.code}</p></td><td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">{CATEGORY_LABELS[item.category] || item.category}</span></td><td className="px-4 py-4"><p className={item.unitPrice == null ? 'font-semibold text-amber-600' : 'font-extrabold text-emerald-600'}>{money(item.unitPrice, item.currency)}</p>{item.historicalTotal != null && <p className="mt-1 text-[10px] text-slate-400">Histórico: {money(item.historicalTotal, item.currency)}</p>}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-1.5">{item.availablePanel && <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold dark:bg-white/10">Painel</span>}{item.availableWhatsapp && <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">WhatsApp</span>}{item.availablePortal && <span className="rounded bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">Portal</span>}</div></td><td className="px-4 py-4"><button disabled={!canManage} onClick={() => toggle(item)} className={item.active ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700 disabled:cursor-default dark:bg-emerald-400/10 dark:text-emerald-300' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500 disabled:cursor-default dark:bg-white/10'}>{item.active ? 'Ativo' : 'Inativo'}</button></td><td className="px-5 py-4 text-right">{canManage && <button onClick={() => setForm({ ...EMPTY_FORM, ...item, unitPrice: item.unitPrice ?? '' })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#3157D5] hover:bg-blue-50 dark:border-white/10 dark:hover:bg-white/5"><Edit3 size={14} />Editar</button>}</td></tr>)}</tbody></table></div>
      </div>
      {form && <Modal form={form} setForm={setForm} onClose={() => setForm(null)} onSave={submit} saving={saving} />}
    </section>
  );
}
