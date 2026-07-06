import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  FileSpreadsheet,
  RefreshCw,
  Search,
  UploadCloud,
  UsersRound,
  XCircle,
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { fetchImportBatches, fetchImportRows, syncImportBatch } from '../services/importsService.js';
import { normalizeDateTime, normalizeText, safeText } from '../utils/formatters.js';

const statusLabels = {
  ALL: 'Todos',
  PENDING: 'Pendente',
  PENDING_VALIDATION: 'Pendente validação',
  VALIDATED: 'Validado',
  IMPORTED: 'Importado',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
  INVALID: 'Inválido',
  SYNCED: 'Sincronizado',
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rowSearch, setRowSearch] = useState('');
  const [rowStatusFilter, setRowStatusFilter] = useState('ALL');

  async function loadBatches() {
    setLoading(true);
    setError('');
    try {
      const result = await fetchImportBatches();
      setBatches(result.items);
      setSourceInfo({ isDemo: result.isDemo, source: result.source });
      const first = result.items[0] || null;
      setSelectedBatch(first);
      if (first) await loadRows(first.id);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Não foi possível carregar as importações.');
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

  useEffect(() => {
    loadBatches();
  }, []);

  async function handleSelect(batch) {
    setSelectedBatch(batch);
    await loadRows(batch.id);
  }

  async function handleSync() {
    if (!selectedBatch?.id) return;
    if (sourceInfo.isDemo || String(selectedBatch.id).startsWith('demo-')) {
      alert('Este lote é demonstrativo. Quando o endpoint real estiver ativo, a sincronização será executada no backend.');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncImportBatch(selectedBatch.id);
      alert(result?.message || 'Sincronização solicitada com sucesso.');
      await loadBatches();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Não foi possível sincronizar este lote.');
    } finally {
      setSyncing(false);
    }
  }

  const filteredBatches = useMemo(() => {
    const query = normalizeText(search);
    return batches.filter((batch) => {
      const statusOk = statusFilter === 'ALL' || String(batch.status).toUpperCase() === statusFilter;
      const text = normalizeText([
        batch.importCode,
        batch.sourceName,
        batch.fileName,
        batch.academicYear,
        batch.status,
      ].join(' '));
      return statusOk && (!query || text.includes(query));
    });
  }, [batches, search, statusFilter]);

  const filteredRows = useMemo(() => {
    const query = normalizeText(rowSearch);
    return rows.filter((row) => {
      const statusOk = rowStatusFilter === 'ALL' || String(row.status).toUpperCase() === rowStatusFilter;
      const text = normalizeText([
        row.studentNumber,
        row.fullName,
        row.courseName,
        row.className,
        row.phone,
        row.whatsapp,
        row.email,
        row.status,
      ].join(' '));
      return statusOk && (!query || text.includes(query));
    });
  }, [rows, rowSearch, rowStatusFilter]);

  const summary = useMemo(() => {
    return {
      totalBatches: batches.length,
      completed: batches.filter((batch) => String(batch.status).toUpperCase() === 'COMPLETED').length,
      totalRows: batches.reduce((sum, batch) => sum + Number(batch.totalRows || 0), 0),
      invalidRows: batches.reduce((sum, batch) => sum + Number(batch.invalidRows || 0), 0),
    };
  }, [batches]);

  if (loading) return <LoadingState title="Carregando importações WebSchool" />;
  if (error) return <ErrorState title="Falha ao carregar importações" message={error} onRetry={loadBatches} />;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061936] via-[#08285A] to-[#061936] p-5 text-white shadow-[0_24px_70px_rgba(7,20,45,.16)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <FileSpreadsheet size={14} />
              WebSchool · IMETRO
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Importações académicas</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Acompanhe lotes, linhas importadas e sincronização do staging WebSchool com estudantes, cursos e turmas reais.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadBatches} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
              <RefreshCw size={18} /> Atualizar
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-imetro-gold px-4 py-3 text-sm font-black text-imetro-navy shadow-[0_16px_38px_rgba(215,169,40,.20)] transition hover:bg-amber-400">
              <UploadCloud size={18} /> Nova importação
            </button>
          </div>
        </div>
      </section>

      {(sourceInfo.isDemo || rowsInfo.isDemo) && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-4 text-sm font-semibold text-amber-900">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} />
            Alguns dados estão em modo demonstrativo porque o endpoint real de importações ainda não respondeu para esta tela.
          </div>
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
            <div className="relative min-w-0">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lote, código, ficheiro..." className="input-premium pl-11" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-premium">
              <option value="ALL">Todos</option>
              <option value="COMPLETED">Concluído</option>
              <option value="PENDING_VALIDATION">Pendente validação</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>

          <div className="mt-5 space-y-4">
            {filteredBatches.length ? (
              filteredBatches.map((batch) => (
                <BatchCard key={batch.id || batch.importCode} batch={batch} selected={selectedBatch?.id === batch.id} onSelect={handleSelect} />
              ))
            ) : (
              <EmptyState title="Nenhum lote encontrado" message="Ajuste os filtros ou carregue uma nova importação." />
            )}
          </div>
        </section>

        <section className="card-premium min-w-0 p-4">
          {selectedBatch ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Lote selecionado</p>
                  <h2 className="mt-2 break-words text-base font-black text-slate-950">{selectedBatch.importCode}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selectedBatch.notes || 'Sem observações.'}</p>
                </div>
                <button onClick={handleSync} disabled={syncing} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-imetro-gold px-4 py-3 text-sm font-black text-imetro-navy shadow-[0_14px_34px_rgba(215,169,40,.20)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                  <DatabaseZap size={18} /> {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniInfo label="Cursos" value={`${selectedBatch.createdCourses} criados · ${selectedBatch.reusedCourses} reutilizados`} />
                <MiniInfo label="Turmas" value={`${selectedBatch.createdClasses} criadas · ${selectedBatch.reusedClasses} reutilizadas`} />
                <MiniInfo label="Estudantes" value={`${selectedBatch.createdStudents} criados · ${selectedBatch.updatedStudents} atualizados`} />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
                <div className="relative min-w-0">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input value={rowSearch} onChange={(event) => setRowSearch(event.target.value)} placeholder="Buscar aluno, matrícula, curso, turma..." className="input-premium pl-11" />
                </div>
                <select value={rowStatusFilter} onChange={(event) => setRowStatusFilter(event.target.value)} className="input-premium">
                  <option value="ALL">Todos</option>
                  <option value="SYNCED">Sincronizado</option>
                  <option value="IMPORTED">Importado</option>
                  <option value="INVALID">Inválido</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>

              <div className="mt-5">
                {rowsLoading ? (
                  <div className="p-4"><LoadingState title="Carregando linhas" /></div>
                ) : filteredRows.length ? (
                  <div className="space-y-3">
                    {filteredRows.map((row) => (
                      <RowCard key={row.id} row={row} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4"><EmptyState title="Nenhuma linha encontrada" message="Ajuste a busca ou o filtro de estado." /></div>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="Nenhum lote selecionado" message="Selecione uma importação WebSchool para ver as linhas." />
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, tone = 'navy' }) {
  const tones = {
    navy: 'bg-imetro-navy text-white',
    gold: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function BatchCard({ batch, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(batch)}
      className={`w-full rounded-3xl border bg-white p-4 text-left shadow-[0_14px_38px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,.09)] ${selected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">{batch.sourceName}</p>
          <h3 className="mt-2 break-words text-base font-black text-slate-950">{batch.importCode}</h3>
          <p className="mt-1 break-words text-sm font-semibold text-slate-500">{batch.fileName}</p>
        </div>
        <StatusBadge status={batch.status} label={importStatusLabel(batch.status)} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Kpi value={batch.totalRows} label="Total" />
        <Kpi value={batch.validRows} label="Válidas" tone="green" />
        <Kpi value={batch.invalidRows} label="Inválidas" tone="red" />
        <Kpi value={batch.syncedRows} label="Sincron." tone="blue" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">Ano: {batch.academicYear}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Criado: {normalizeDateTime(batch.createdAt)}</span>
      </div>
    </button>
  );
}

function Kpi({ value, label, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-950',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <div className={`rounded-2xl p-2 ${tones[tone] || tones.slate}`}>
      <p className="text-base font-black">{value}</p>
      <p className="text-[10px] font-semibold opacity-70">{label}</p>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function RowCard({ row }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,.05)]">
      <div className="grid gap-3 lg:grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)_140px] lg:items-center">
        <div className="font-black text-slate-400">#{row.rowNumber}</div>
        <div className="min-w-0">
          <p className="break-words font-black text-slate-950">{row.fullName}</p>
          <p className="text-xs font-semibold text-slate-500">Matrícula: {row.studentNumber}</p>
          <p className="text-xs font-semibold text-slate-500">WhatsApp: {safeText(row.whatsapp)}</p>
        </div>
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-800">{row.courseName}</p>
          <p className="text-xs font-semibold text-slate-500">Turma: {row.className} · Turno: {row.shiftName}</p>
          {row.validationMessage && <p className="mt-1 text-xs font-semibold text-red-600">{row.validationMessage}</p>}
        </div>
        <div>
          <StatusBadge status={row.status} label={importStatusLabel(row.status)} />
        </div>
      </div>
    </div>
  );
}
