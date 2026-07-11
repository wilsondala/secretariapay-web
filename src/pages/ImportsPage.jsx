import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Ban, CheckCircle2, DatabaseZap, Download, FileSpreadsheet,
  History, Loader2, Pencil, RefreshCw, RotateCcw, Search, UploadCloud,
  UsersRound, X, XCircle,
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import usePermissions from '../shared/auth/usePermissions.js';
import {
  cancelImportBatch, completeImportBatch, downloadImportErrors, fetchImportBatches,
  fetchImportHistory, fetchImportRows, reprocessImportBatch, syncImportBatch,
  updateImportRow, uploadImportCsv, validateImportBatch,
} from '../services/importsService.js';
import { normalizeDateTime, normalizeText, safeText } from '../utils/formatters.js';

const statusLabels = {
  ALL: 'Todos', DRAFT: 'Rascunho', PENDING: 'Pendente', PENDING_VALIDATION: 'Pendente validação',
  VALIDATED: 'Validado', VALID: 'Válido', IMPORTED: 'Importado', COMPLETED: 'Concluído',
  FAILED: 'Falhou', INVALID: 'Inválido', DUPLICATE: 'Duplicado', SYNCED: 'Sincronizado', CANCELLED: 'Cancelado',
};

const importStatusLabel = (status) => statusLabels[String(status || '').toUpperCase()] || status || '-';
const rowEditable = (row) => ['INVALID', 'DUPLICATE', 'PENDING', 'VALID'].includes(String(row?.status || '').toUpperCase());

export default function ImportsPage() {
  const { can } = usePermissions();
  const canManageImports = can('importAcademicData');
  const [batches, setBatches] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rowSearch, setRowSearch] = useState('');
  const [rowStatusFilter, setRowStatusFilter] = useState('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  async function loadBatchDetails(batchId) {
    if (!batchId) return;
    setRowsLoading(true);
    try {
      const [rowsResult, historyResult] = await Promise.all([fetchImportRows(batchId), fetchImportHistory(batchId)]);
      setRows(rowsResult.items);
      setHistory(historyResult);
    } finally { setRowsLoading(false); }
  }

  async function loadBatches(preferredId) {
    setLoading(true); setError('');
    try {
      const result = await fetchImportBatches();
      setBatches(result.items);
      const next = result.items.find((item) => item.id === preferredId)
        || result.items.find((item) => item.id === selectedBatch?.id)
        || result.items[0] || null;
      setSelectedBatch(next);
      if (next) await loadBatchDetails(next.id);
      else { setRows([]); setHistory(null); }
    } catch (err) { setError(readError(err, 'Não foi possível carregar as importações.')); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadBatches(); }, []);

  async function handleSelect(batch) { setSelectedBatch(batch); await loadBatchDetails(batch.id); }

  function denyAction() {
    alert('O seu perfil possui acesso apenas para consulta. Esta ação exige permissão de gestão de importações académicas.');
  }

  async function runBatchAction(action, successMessage) {
    if (!canManageImports) return denyAction();
    if (!selectedBatch?.id) return;
    setProcessing(true);
    try {
      const result = await action(selectedBatch.id);
      alert(result?.message || successMessage);
      await loadBatches(selectedBatch.id);
    } catch (err) { alert(readError(err, 'Não foi possível processar este lote.')); }
    finally { setProcessing(false); }
  }

  async function handleCancel() {
    if (!canManageImports) return denyAction();
    if (!selectedBatch?.id || history?.canCancel === false) return;
    const reason = window.prompt('Informe o motivo do cancelamento deste lote:');
    if (reason === null) return;
    if (!window.confirm(`Confirma o cancelamento do lote ${selectedBatch.importCode}?`)) return;
    await runBatchAction((id) => cancelImportBatch(id, reason), 'Lote cancelado com sucesso.');
  }

  async function handleReprocess() {
    if (!canManageImports) return denyAction();
    if (!selectedBatch?.id || history?.canReprocess === false) return;
    if (!window.confirm('Reprocessar este lote? Linhas sincronizadas serão preservadas e as demais revalidadas.')) return;
    await runBatchAction(reprocessImportBatch, 'Lote reprocessado com sucesso.');
  }

  const filteredBatches = useMemo(() => {
    const query = normalizeText(search);
    return batches.filter((batch) => {
      const statusOk = statusFilter === 'ALL' || String(batch.status).toUpperCase() === statusFilter;
      const text = normalizeText([batch.importCode, batch.sourceName, batch.fileName, batch.academicYear, batch.status].join(' '));
      return statusOk && (!query || text.includes(query));
    });
  }, [batches, search, statusFilter]);

  const filteredRows = useMemo(() => {
    const query = normalizeText(rowSearch);
    return rows.filter((row) => {
      const statusOk = rowStatusFilter === 'ALL' || String(row.status).toUpperCase() === rowStatusFilter;
      const text = normalizeText([row.studentNumber, row.fullName, row.courseName, row.className, row.phone, row.whatsapp, row.email, row.status].join(' '));
      return statusOk && (!query || text.includes(query));
    });
  }, [rows, rowSearch, rowStatusFilter]);

  const summary = useMemo(() => ({
    totalBatches: batches.length,
    completed: batches.filter((batch) => String(batch.status).toUpperCase() === 'COMPLETED').length,
    totalRows: batches.reduce((sum, batch) => sum + Number(batch.totalRows || 0), 0),
    invalidRows: batches.reduce((sum, batch) => sum + Number(batch.invalidRows || 0), 0),
  }), [batches]);

  if (loading) return <LoadingState title="Carregando importações WebSchool" />;
  if (error) return <ErrorState title="Falha ao carregar importações" message={error} onRetry={loadBatches} />;

  const selectedStatus = String(selectedBatch?.status || '').toUpperCase();

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white sm:p-7">
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80"><FileSpreadsheet size={14}/> WebSchool · IMETRO</div><h1 className="mt-4 text-2xl font-black sm:text-4xl">Importações académicas</h1><p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80 sm:text-base">Importe CSV ou Excel, corrija linhas inválidas, acompanhe o histórico e sincronize sem duplicidade.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => loadBatches(selectedBatch?.id)} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black"><RefreshCw size={18}/> Atualizar</button>{canManageImports && <button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-imetro-gold px-4 py-3 text-sm font-black text-imetro-navy"><UploadCloud size={18}/> Nova importação</button>}</div>
      </div>
    </section>

    {!canManageImports && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">Perfil em modo de consulta. Upload, correção, revalidação, conclusão, cancelamento, reprocessamento e sincronização estão protegidos.</div>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard title="Lotes" value={summary.totalBatches} subtitle="Importações WebSchool" icon={FileSpreadsheet}/><SummaryCard title="Concluídos" value={summary.completed} subtitle="Sincronizados ou finalizados" icon={CheckCircle2} tone="green"/><SummaryCard title="Linhas" value={summary.totalRows} subtitle="Alunos no staging" icon={UsersRound} tone="gold"/><SummaryCard title="Inválidas" value={summary.invalidRows} subtitle="Exigem correção" icon={XCircle} tone="red"/></div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.35fr)]">
      <section className="card-premium min-w-0 p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]"><div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lote, código, ficheiro..." className="input-premium pl-11"/></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium"><option value="ALL">Todos</option><option value="DRAFT">Rascunho</option><option value="VALIDATED">Validado</option><option value="COMPLETED">Concluído</option><option value="CANCELLED">Cancelado</option></select></div><div className="mt-5 space-y-4">{filteredBatches.length ? filteredBatches.map((batch) => <BatchCard key={batch.id} batch={batch} selected={selectedBatch?.id === batch.id} onSelect={handleSelect}/>) : <EmptyState title="Nenhum lote encontrado" message="Ajuste os filtros ou carregue uma nova importação."/>}</div></section>

      <section className="card-premium min-w-0 p-4">{selectedBatch ? <>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Lote selecionado</p><h2 className="mt-2 text-base font-black text-slate-950 dark:text-white">{selectedBatch.importCode}</h2><p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{selectedBatch.notes || 'Sem observações.'}</p></div><div className="flex flex-wrap gap-2"><ActionButton onClick={() => setHistoryOpen(true)}><History size={17}/> Histórico</ActionButton>{canManageImports && history?.canReprocess && <ActionButton onClick={handleReprocess} disabled={processing}><RotateCcw size={17}/> Reprocessar</ActionButton>}{canManageImports && history?.canCancel && <ActionButton danger onClick={handleCancel} disabled={processing}><Ban size={17}/> Cancelar lote</ActionButton>}{Number(selectedBatch.invalidRows || 0) > 0 && <ActionButton onClick={() => downloadImportErrors(selectedBatch.id, selectedBatch.importCode)}><Download size={17}/> Relatório de erros</ActionButton>}{canManageImports && ['DRAFT','PENDING_VALIDATION','VALIDATED'].includes(selectedStatus) && <ActionButton onClick={() => runBatchAction(validateImportBatch, 'Validação concluída.')} disabled={processing}>Revalidar</ActionButton>}{canManageImports && selectedStatus === 'VALIDATED' && Number(selectedBatch.invalidRows || 0) === 0 && <ActionButton onClick={() => runBatchAction(completeImportBatch, 'Lote concluído.')} disabled={processing}>Concluir staging</ActionButton>}{canManageImports && (selectedStatus === 'COMPLETED' || (selectedStatus === 'VALIDATED' && Number(selectedBatch.invalidRows || 0) === 0)) && <ActionButton primary onClick={() => runBatchAction(syncImportBatch, 'Sincronização concluída.')} disabled={processing}><DatabaseZap size={18}/> Sincronizar</ActionButton>}</div></div>

        {Number(selectedBatch.invalidRows || 0) > 0 && <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-700 dark:text-amber-200"><div className="flex gap-2"><AlertTriangle size={18}/> Corrija as linhas inválidas ou duplicadas e execute a revalidação antes de concluir o lote.</div></div>}
        <div className="mt-5 grid gap-3 md:grid-cols-3"><MiniInfo label="Cursos" value={`${selectedBatch.createdCourses} criados · ${selectedBatch.reusedCourses} reutilizados`}/><MiniInfo label="Turmas" value={`${selectedBatch.createdClasses} criadas · ${selectedBatch.reusedClasses} reutilizadas`}/><MiniInfo label="Estudantes" value={`${selectedBatch.createdStudents} criados · ${selectedBatch.updatedStudents} atualizados`}/></div>
        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]"><div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={18}/><input value={rowSearch} onChange={(e) => setRowSearch(e.target.value)} placeholder="Buscar aluno, matrícula, curso, turma..." className="input-premium pl-11"/></div><select value={rowStatusFilter} onChange={(e) => setRowStatusFilter(e.target.value)} className="input-premium"><option value="ALL">Todos</option><option value="VALID">Válido</option><option value="SYNCED">Sincronizado</option><option value="IMPORTED">Importado</option><option value="INVALID">Inválido</option><option value="DUPLICATE">Duplicado</option><option value="PENDING">Pendente</option></select></div>
        <div className="mt-5">{rowsLoading ? <LoadingState title="Carregando linhas"/> : filteredRows.length ? <div className="space-y-3">{filteredRows.map((row) => <RowCard key={row.id} row={row} canEdit={canManageImports} onEdit={() => setEditingRow(row)}/>)}</div> : <EmptyState title="Nenhuma linha encontrada" message="Ajuste a busca ou o filtro de estado."/>}</div>
      </> : <EmptyState title="Nenhum lote selecionado" message="Selecione uma importação WebSchool para ver as linhas."/>}</section>
    </div>

    {canManageImports && uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} suggestedInstitutionId={selectedBatch?.institutionId || batches.find((batch) => batch.institutionId)?.institutionId || ''} onUploaded={async (batch) => { setUploadOpen(false); await loadBatches(batch.id); }}/>} 
    {canManageImports && editingRow && <EditRowModal row={editingRow} batchId={selectedBatch.id} onClose={() => setEditingRow(null)} onSaved={async () => { setEditingRow(null); await loadBatches(selectedBatch.id); }}/>} 
    {historyOpen && history && <HistoryModal history={history} onClose={() => setHistoryOpen(false)}/>} 
  </div>;
}

function UploadModal({ onClose, onUploaded, suggestedInstitutionId }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ institutionId: suggestedInstitutionId, academicYear: '2025/2026', semester: '1', sourceName: 'WebSchool IMETRO' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); if (!file) return setError('Selecione um ficheiro CSV ou Excel.'); if (!form.institutionId.trim()) return setError('Informe o ID da instituição.'); setUploading(true); setError(''); try { const batch = await uploadImportCsv({ ...form, file }); await onUploaded(batch); } catch (err) { setError(readError(err, 'Não foi possível importar o ficheiro.')); } finally { setUploading(false); } }
  return <ModalShell onClose={onClose} title="Nova importação WebSchool" subtitle="Envie CSV, XLSX ou XLS com até 10 MB."><form onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><Field label="Ficheiro"><input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input-premium"/></Field><Field label="ID da instituição"><input value={form.institutionId} onChange={(e) => setForm((prev) => ({ ...prev, institutionId: e.target.value }))} className="input-premium"/></Field><Field label="Ano letivo"><input value={form.academicYear} onChange={(e) => setForm((prev) => ({ ...prev, academicYear: e.target.value }))} className="input-premium"/></Field><Field label="Semestre"><select value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} className="input-premium"><option value="1">1º semestre</option><option value="2">2º semestre</option></select></Field><Field label="Origem"><input value={form.sourceName} onChange={(e) => setForm((prev) => ({ ...prev, sourceName: e.target.value }))} className="input-premium"/></Field></div>{error && <ErrorBox>{error}</ErrorBox>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" disabled={uploading} className="btn-primary">{uploading ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18}/>} Importar e validar</button></div></form></ModalShell>;
}

function EditRowModal({ row, batchId, onClose, onSaved }) {
  const [form, setForm] = useState({ ...row }); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const fields = [['studentNumber','Matrícula'],['fullName','Nome completo'],['courseName','Curso'],['className','Turma'],['shiftName','Turno'],['academicYear','Ano letivo'],['email','E-mail'],['phone','Telefone'],['whatsapp','WhatsApp']];
  async function submit(event) { event.preventDefault(); setSaving(true); setError(''); try { await updateImportRow(batchId, row.id, form); await onSaved(); } catch (err) { setError(readError(err, 'Não foi possível corrigir a linha.')); } finally { setSaving(false); } }
  return <ModalShell onClose={onClose} title={`Corrigir linha #${row.rowNumber}`} subtitle={row.validationMessage || 'Atualize os campos e salve para revalidar automaticamente.'}><form onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2">{fields.map(([name,label]) => <Field key={name} label={label}><input value={form[name] ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))} className="input-premium"/></Field>)}</div>{error && <ErrorBox>{error}</ErrorBox>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" disabled={saving} className="btn-primary">{saving && <Loader2 className="animate-spin" size={18}/>} Salvar e revalidar</button></div></form></ModalShell>;
}

function HistoryModal({ history, onClose }) { return <ModalShell onClose={onClose} title={`Histórico ${history.importCode}`} subtitle="Rastreabilidade e contadores atuais do lote."><div className="grid gap-3 sm:grid-cols-2"><MiniInfo label="Estado" value={importStatusLabel(history.status)}/><MiniInfo label="Importado por" value={history.createdBy || 'Não identificado'}/><MiniInfo label="Criado em" value={normalizeDateTime(history.createdAt)}/><MiniInfo label="Validado em" value={normalizeDateTime(history.validatedAt)}/><MiniInfo label="Concluído em" value={normalizeDateTime(history.completedAt)}/><MiniInfo label="Última atualização" value={normalizeDateTime(history.updatedAt)}/></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><Kpi value={history.totalRows} label="Total"/><Kpi value={history.validRows} label="Válidas" tone="green"/><Kpi value={history.invalidRows} label="Inválidas" tone="red"/><Kpi value={history.duplicateRows} label="Duplicadas" tone="red"/><Kpi value={history.importedRows} label="Importadas" tone="blue"/><Kpi value={history.syncedRows} label="Sincronizadas" tone="green"/></div>{history.notes && <div className="mt-4 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{history.notes}</div>}</ModalShell>; }
function ModalShell({ onClose, title, subtitle, children }) { return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2E]"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{subtitle}</p></div><button onClick={onClose} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X size={18}/></button></div>{children}</div></div>; }
function Field({ label, children }) { return <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function ErrorBox({ children }) { return <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">{children}</div>; }
function ActionButton({ children, primary = false, danger = false, ...props }) { const tone = primary ? 'bg-imetro-gold text-imetro-navy' : danger ? 'border border-red-300 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200' : 'border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white'; return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition disabled:opacity-60 ${tone}`}>{children}</button>; }
function SummaryCard({ title, value, subtitle, icon: Icon, tone = 'navy' }) { const tones = { navy: 'bg-imetro-navy text-white', gold: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700' }; return <div className="card-premium p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black text-slate-500">{title}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon size={22}/></div></div></div>; }
function BatchCard({ batch, selected, onSelect }) { return <button onClick={() => onSelect(batch)} className={`w-full rounded-3xl border bg-white p-4 text-left dark:bg-[#0D1B2E] ${selected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 dark:border-white/10'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">{batch.sourceName}</p><h3 className="mt-2 text-base font-black text-slate-950 dark:text-white">{batch.importCode}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{batch.fileName}</p></div><StatusBadge status={batch.status} label={importStatusLabel(batch.status)}/></div><div className="mt-4 grid grid-cols-4 gap-2 text-center"><Kpi value={batch.totalRows} label="Total"/><Kpi value={batch.validRows} label="Válidas" tone="green"/><Kpi value={batch.invalidRows} label="Inválidas" tone="red"/><Kpi value={batch.syncedRows} label="Sincron." tone="blue"/></div><div className="mt-4 flex gap-3 text-xs font-semibold text-slate-500"><span>Ano: {batch.academicYear}</span><span>Criado: {normalizeDateTime(batch.createdAt)}</span></div></button>; }
function Kpi({ value, label, tone = 'slate' }) { const tones = { slate: 'bg-slate-50 text-slate-950', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' }; return <div className={`rounded-2xl p-2 ${tones[tone]}`}><p className="text-base font-black">{value}</p><p className="text-[10px] font-semibold opacity-70">{label}</p></div>; }
function MiniInfo({ label, value }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value || '-'}</p></div>; }
function RowCard({ row, onEdit, canEdit }) { const editable = canEdit && rowEditable(row); return <div className="rounded-3xl border border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-[#0D1B2E]"><div className="grid gap-3 lg:grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_170px] lg:items-center"><div className="font-black text-slate-400">#{row.rowNumber}</div><div><p className="font-black text-slate-950 dark:text-white">{row.fullName || 'Sem nome'}</p><p className="text-xs font-semibold text-slate-500">Matrícula: {row.studentNumber || '-'}</p><p className="text-xs font-semibold text-slate-500">WhatsApp: {safeText(row.whatsapp)}</p></div><div><p className="font-semibold text-slate-800 dark:text-slate-200">{row.courseName || 'Sem curso'}</p><p className="text-xs font-semibold text-slate-500">Turma: {row.className || '-'} · Turno: {row.shiftName || '-'}</p>{row.validationMessage && <p className={`mt-1 text-xs font-semibold ${['VALID','SYNCED'].includes(String(row.status).toUpperCase()) ? 'text-emerald-600' : 'text-red-600'}`}>{row.validationMessage}</p>}</div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={row.status} label={importStatusLabel(row.status)}/>{editable && <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black dark:border-white/10"><Pencil size={14}/> Corrigir</button>}</div></div></div>; }
function readError(err, fallback) { return err?.response?.data?.message || err?.response?.data?.detail || err?.message || fallback; }
