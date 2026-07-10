import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  UploadCloud,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import {
  completeImportBatch,
  fetchImportBatches,
  fetchImportRows,
  syncImportBatch,
  uploadImportCsv,
  validateImportBatch,
} from '../services/importsService.js';
import { normalizeDateTime, normalizeText, safeText } from '../utils/formatters.js';

const statusLabels = {
  ALL: 'Todos', DRAFT: 'Rascunho', PENDING: 'Pendente', PENDING_VALIDATION: 'Pendente validação',
  VALIDATED: 'Validado', VALID: 'Válido', IMPORTED: 'Importado', COMPLETED: 'Concluído',
  FAILED: 'Falhou', INVALID: 'Inválido', DUPLICATE: 'Duplicado', SYNCED: 'Sincronizado', CANCELLED: 'Cancelado',
};

function importStatusLabel(status) {
  return statusLabels[String(status || '').toUpperCase()] || status || '-';
}

export default function ImportsPage() {
  const [batches, setBatches] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [sourceInfo, setSourceInfo] = useState({ isDemo: false, source: '' });
  const [rowsInfo, setRowsInfo] = useState({ isDemo: false, source: '' });
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rowSearch, setRowSearch] = useState('');
  const [rowStatusFilter, setRowStatusFilter] = useState('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);

  async function loadBatches(preferredId) {
    setLoading(true);
    setError('');
    try {
      const result = await fetchImportBatches();
      setBatches(result.items);
      setSourceInfo({ isDemo: result.isDemo, source: result.source });
      const next = result.items.find((item) => item.id === preferredId)
        || result.items.find((item) => item.id === selectedBatch?.id)
        || result.items[0]
        || null;
      setSelectedBatch(next);
      if (next) await loadRows(next.id);
      else setRows([]);
    } catch (err) {
      setError(readError(err, 'Não foi possível carregar as importações.'));
    } finally {
      setLoading(false);
    }
  }

  async function loadRows(batchId) {
    if (!batchId) return;
    setRowsLoading(true);
    try {
      const result = await fetchImportRows(batchId);
      setRows(result.items);
      setRowsInfo({ isDemo: result.isDemo, source: result.source });
    } finally {
      setRowsLoading(false);
    }
  }

  useEffect(() => { loadBatches(); }, []);

  async function handleSelect(batch) {
    setSelectedBatch(batch);
    await loadRows(batch.id);
  }

  async function runBatchAction(action, successMessage) {
    if (!selectedBatch?.id || sourceInfo.isDemo || String(selectedBatch.id).startsWith('demo-')) {
      alert('Este lote é demonstrativo e não pode ser processado.');
      return;
    }
    setProcessing(true);
    try {
      const result = await action(selectedBatch.id);
      alert(result?.message || successMessage);
      await loadBatches(selectedBatch.id);
    } catch (err) {
      alert(readError(err, 'Não foi possível processar este lote.'));
    } finally {
      setProcessing(false);
    }
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

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <FileSpreadsheet size={14} /> WebSchool · IMETRO
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Importações académicas</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80 sm:text-base">
              Importe CSV ou Excel, valide o staging e sincronize estudantes, cursos e turmas reais com segurança e sem duplicidade.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => loadBatches(selectedBatch?.id)} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
              <RefreshCw size={18} /> Atualizar
            </button>
            <button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-imetro-gold px-4 py-3 text-sm font-black text-imetro-navy shadow-[0_16px_38px_rgba(215,169,40,.20)] transition hover:bg-amber-400">
              <UploadCloud size={18} /> Nova importação
            </button>
          </div>
        </div>
      </section>

      {(sourceInfo.isDemo || rowsInfo.isDemo) && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-4 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:from-amber-500/10 dark:via-[#0D1B2E] dark:to-orange-500/10 dark:text-amber-100">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={19} /> Alguns dados estão em modo demonstrativo porque o endpoint real ainda não respondeu.</div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Lotes" value={summary.totalBatches} subtitle="Importações WebSchool" icon={FileSpreadsheet} />
        <SummaryCard title="Concluídos" value={summary.completed} subtitle="Sincronizados ou finalizados" icon={CheckCircle2} tone="green" />
        <SummaryCard title="Linhas" value={summary.totalRows} subtitle="Alunos no staging" icon={UsersRound} tone="gold" />
        <SummaryCard title="Inválidas" value={summary.invalidRows} subtitle="Exigem correção" icon={XCircle} tone="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.35fr)]">
        <section className="card-premium min-w-0 p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
            <div className="relative min-w-0"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lote, código, ficheiro..." className="input-premium pl-11" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium">
              <option value="ALL">Todos</option><option value="DRAFT">Rascunho</option><option value="VALIDATED">Validado</option><option value="COMPLETED">Concluído</option><option value="FAILED">Falhou</option>
            </select>
          </div>
          <div className="mt-5 space-y-4">
            {filteredBatches.length ? filteredBatches.map((batch) => <BatchCard key={batch.id || batch.importCode} batch={batch} selected={selectedBatch?.id === batch.id} onSelect={handleSelect} />) : <EmptyState title="Nenhum lote encontrado" message="Ajuste os filtros ou carregue uma nova importação." />}
          </div>
        </section>

        <section className="card-premium min-w-0 p-4">
          {selectedBatch ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Lote selecionado</p>
                  <h2 className="mt-2 break-words text-base font-black text-slate-950 dark:text-white">{selectedBatch.importCode}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{selectedBatch.notes || 'Sem observações.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedStatus === 'DRAFT' || selectedStatus === 'PENDING_VALIDATION') && <ActionButton onClick={() => runBatchAction(validateImportBatch, 'Validação concluída.')} disabled={processing}>Validar</ActionButton>}
                  {selectedStatus === 'VALIDATED' && <ActionButton onClick={() => runBatchAction(completeImportBatch, 'Lote concluído.')} disabled={processing}>Concluir staging</ActionButton>}
                  {(selectedStatus === 'COMPLETED' || selectedStatus === 'VALIDATED') && <ActionButton primary onClick={() => runBatchAction(syncImportBatch, 'Sincronização concluída.')} disabled={processing}><DatabaseZap size={18} /> Sincronizar</ActionButton>}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniInfo label="Cursos" value={`${selectedBatch.createdCourses} criados · ${selectedBatch.reusedCourses} reutilizados`} />
                <MiniInfo label="Turmas" value={`${selectedBatch.createdClasses} criadas · ${selectedBatch.reusedClasses} reutilizadas`} />
                <MiniInfo label="Estudantes" value={`${selectedBatch.createdStudents} criados · ${selectedBatch.updatedStudents} atualizados`} />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
                <div className="relative min-w-0"><Search className="absolute left-4 top-3.5 text-slate-400" size={18} /><input value={rowSearch} onChange={(e) => setRowSearch(e.target.value)} placeholder="Buscar aluno, matrícula, curso, turma..." className="input-premium pl-11" /></div>
                <select value={rowStatusFilter} onChange={(e) => setRowStatusFilter(e.target.value)} className="input-premium">
                  <option value="ALL">Todos</option><option value="VALID">Válido</option><option value="SYNCED">Sincronizado</option><option value="IMPORTED">Importado</option><option value="INVALID">Inválido</option><option value="DUPLICATE">Duplicado</option><option value="PENDING">Pendente</option>
                </select>
              </div>

              <div className="mt-5">{rowsLoading ? <div className="p-4"><LoadingState title="Carregando linhas" /></div> : filteredRows.length ? <div className="space-y-3">{filteredRows.map((row) => <RowCard key={row.id} row={row} />)}</div> : <div className="p-4"><EmptyState title="Nenhuma linha encontrada" message="Ajuste a busca ou o filtro de estado." /></div>}</div>
            </>
          ) : <EmptyState title="Nenhum lote selecionado" message="Selecione uma importação WebSchool para ver as linhas." />}
        </section>
      </div>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} suggestedInstitutionId={selectedBatch?.institutionId || batches.find((b) => b.institutionId)?.institutionId || ''} onUploaded={async (batch) => { setUploadOpen(false); await loadBatches(batch.id); }} />}
    </div>
  );
}

function UploadModal({ onClose, onUploaded, suggestedInstitutionId }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ institutionId: suggestedInstitutionId, academicYear: '2025/2026', semester: '1', sourceName: 'WebSchool IMETRO' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!file) return setError('Selecione um ficheiro CSV ou Excel.');
    const extension = String(file.name || '').split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extension)) return setError('Formato inválido. Utilize CSV, XLSX ou XLS.');
    if (!form.institutionId.trim()) return setError('Informe o ID da instituição.');
    setUploading(true); setError('');
    try { const batch = await uploadImportCsv({ ...form, file }); await onUploaded(batch); }
    catch (err) { setError(readError(err, 'Não foi possível importar o ficheiro.')); }
    finally { setUploading(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2E]">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">Nova importação WebSchool</h2><p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">Envie CSV UTF-8, XLSX ou XLS com cabeçalhos. Limite de 10 MB.</p></div><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X size={18} /></button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Ficheiro CSV ou Excel</span><input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input-premium" /></label>
          <Field label="ID da instituição"><input value={form.institutionId} onChange={(e) => setForm((p) => ({ ...p, institutionId: e.target.value }))} className="input-premium" placeholder="UUID da instituição" /></Field>
          <Field label="Ano letivo"><input value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} className="input-premium" /></Field>
          <Field label="Semestre"><select value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} className="input-premium"><option value="1">1º semestre</option><option value="2">2º semestre</option></select></Field>
          <Field label="Origem"><input value={form.sourceName} onChange={(e) => setForm((p) => ({ ...p, sourceName: e.target.value }))} className="input-premium" /></Field>
        </div>
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">Colunas mínimas: <strong>Número do estudante, Nome e Curso</strong>. Também são reconhecidas: Ano Lectivo, Semestre, Turma, Turno, Telefone, WhatsApp e E-mail. No Excel, a primeira folha será utilizada.</div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" disabled={uploading} className="btn-primary">{uploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />} Importar e validar</button></div>
      </form>
    </div>
  );
}

function Field({ label, children }) { return <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function ActionButton({ children, primary = false, ...props }) { return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${primary ? 'bg-imetro-gold text-imetro-navy hover:bg-amber-400' : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'}`}>{children}</button>; }

function SummaryCard({ title, value, subtitle, icon: Icon, tone = 'navy' }) {
  const tones = { navy: 'bg-imetro-navy text-white', gold: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700' };
  return <div className="card-premium p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black text-slate-500">{title}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${tones[tone]}`}><Icon size={22} /></div></div></div>;
}

function BatchCard({ batch, selected, onSelect }) {
  return <button onClick={() => onSelect(batch)} className={`w-full rounded-3xl border bg-white p-4 text-left shadow-[0_14px_38px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 dark:bg-[#0D1B2E] ${selected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200 dark:border-white/10'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">{batch.sourceName}</p><h3 className="mt-2 break-words text-base font-black text-slate-950 dark:text-white">{batch.importCode}</h3><p className="mt-1 break-words text-sm font-semibold text-slate-500">{batch.fileName}</p></div><StatusBadge status={batch.status} label={importStatusLabel(batch.status)} /></div><div className="mt-4 grid grid-cols-4 gap-2 text-center"><Kpi value={batch.totalRows} label="Total" /><Kpi value={batch.validRows} label="Válidas" tone="green" /><Kpi value={batch.invalidRows} label="Inválidas" tone="red" /><Kpi value={batch.syncedRows} label="Sincron." tone="blue" /></div><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500"><span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">Ano: {batch.academicYear}</span><span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/5">Criado: {normalizeDateTime(batch.createdAt)}</span></div></button>;
}

function Kpi({ value, label, tone = 'slate' }) { const tones = { slate: 'bg-slate-50 text-slate-950', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700' }; return <div className={`rounded-2xl p-2 ${tones[tone] || tones.slate}`}><p className="text-base font-black">{value}</p><p className="text-[10px] font-semibold opacity-70">{label}</p></div>; }
function MiniInfo({ label, value }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p></div>; }
function RowCard({ row }) { return <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,.05)] dark:border-white/10 dark:bg-[#0D1B2E]"><div className="grid gap-3 lg:grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)_140px] lg:items-center"><div className="font-black text-slate-400">#{row.rowNumber}</div><div className="min-w-0"><p className="break-words font-black text-slate-950 dark:text-white">{row.fullName}</p><p className="text-xs font-semibold text-slate-500">Matrícula: {row.studentNumber}</p><p className="text-xs font-semibold text-slate-500">WhatsApp: {safeText(row.whatsapp)}</p></div><div className="min-w-0"><p className="break-words font-semibold text-slate-800 dark:text-slate-200">{row.courseName}</p><p className="text-xs font-semibold text-slate-500">Turma: {row.className} · Turno: {row.shiftName}</p>{row.validationMessage && <p className={`mt-1 text-xs font-semibold ${String(row.status).toUpperCase() === 'VALID' || String(row.status).toUpperCase() === 'SYNCED' ? 'text-emerald-600' : 'text-red-600'}`}>{row.validationMessage}</p>}</div><div><StatusBadge status={row.status} label={importStatusLabel(row.status)} /></div></div></div>; }
function readError(err, fallback) { return err?.response?.data?.message || err?.response?.data?.detail || err?.message || fallback; }
