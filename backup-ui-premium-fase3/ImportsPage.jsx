import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, DatabaseZap, FileSpreadsheet, RefreshCw, Search, UploadCloud, UsersRound, XCircle } from 'lucide-react';
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

function SummaryCard({ title, value, subtitle, icon: Icon, tone = 'navy' }) {
  const tones = {
    navy: 'bg-imetro-navy text-white',
    gold: 'bg-imetro-gold/15 text-imetro-navy',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-base font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
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
      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
        selected ? 'border-imetro-gold bg-imetro-gold/10 shadow-soft' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{batch.sourceName}</p>
          <h3 className="mt-1 text-base font-black text-slate-950">{batch.importCode}</h3>
          <p className="mt-1 text-sm text-slate-500">{batch.fileName}</p>
        </div>
        <StatusBadge status={batch.status} label={importStatusLabel(batch.status)} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-base font-black text-slate-950">{batch.totalRows}</p>
          <p className="text-[11px] text-slate-500">Total</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2">
          <p className="text-base font-black text-emerald-700">{batch.validRows}</p>
          <p className="text-[11px] text-emerald-700">Válidas</p>
        </div>
        <div className="rounded-xl bg-red-50 p-2">
          <p className="text-base font-black text-red-700">{batch.invalidRows}</p>
          <p className="text-[11px] text-red-700">Inválidas</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2">
          <p className="text-base font-black text-blue-700">{batch.syncedRows}</p>
          <p className="text-[11px] text-blue-700">Sincron.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">Ano: {batch.academicYear}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">Criado: {normalizeDateTime(batch.createdAt)}</span>
      </div>
    </button>
  );
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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-imetro-gold">WebSchool · IMETRO</p>
          <h1 className="mt-2 text-base font-black text-slate-950">Importações académicas</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Acompanhe lotes, linhas importadas e sincronização do staging WebSchool com estudantes, cursos e turmas reais.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadBatches}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-soft transition hover:-translate-y-0.5"
          >
            <RefreshCw size={18} /> Atualizar
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-imetro-navy px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5">
            <UploadCloud size={18} /> Nova importação
          </button>
        </div>
      </div>

      {(sourceInfo.isDemo || rowsInfo.isDemo) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Alguns dados estão em modo demonstrativo porque o endpoint real de importações ainda não respondeu para esta tela.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Lotes" value={summary.totalBatches} subtitle="Importações WebSchool" icon={FileSpreadsheet} />
        <SummaryCard title="Concluídos" value={summary.completed} subtitle="Sincronizados ou finalizados" icon={CheckCircle2} tone="green" />
        <SummaryCard title="Linhas" value={summary.totalRows} subtitle="Alunos no staging" icon={UsersRound} tone="gold" />
        <SummaryCard title="Inválidas" value={summary.invalidRows} subtitle="Exigem correção" icon={XCircle} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar lote, código, ficheiro..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-imetro-gold"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-imetro-gold"
            >
              <option value="ALL">Todos</option>
              <option value="COMPLETED">Concluído</option>
              <option value="PENDING_VALIDATION">Pendente validação</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>

          <div className="mt-5 space-y-4">
            {filteredBatches.length ? (
              filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id || batch.importCode}
                  batch={batch}
                  selected={selectedBatch?.id === batch.id}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <EmptyState title="Nenhum lote encontrado" message="Ajuste os filtros ou carregue uma nova importação." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          {selectedBatch ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Lote selecionado</p>
                  <h2 className="mt-1 text-base font-black text-slate-950">{selectedBatch.importCode}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedBatch.notes || 'Sem observações.'}</p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-imetro-gold px-4 py-3 text-sm font-black text-imetro-navy shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <DatabaseZap size={18} /> {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Cursos</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{selectedBatch.createdCourses} criados · {selectedBatch.reusedCourses} reutilizados</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Turmas</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{selectedBatch.createdClasses} criadas · {selectedBatch.reusedClasses} reutilizadas</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Estudantes</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{selectedBatch.createdStudents} criados · {selectedBatch.updatedStudents} atualizados</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={rowSearch}
                    onChange={(event) => setRowSearch(event.target.value)}
                    placeholder="Buscar aluno, matrícula, curso, turma..."
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-imetro-gold"
                  />
                </div>
                <select
                  value={rowStatusFilter}
                  onChange={(event) => setRowStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-imetro-gold"
                >
                  <option value="ALL">Todos</option>
                  <option value="SYNCED">Sincronizado</option>
                  <option value="IMPORTED">Importado</option>
                  <option value="INVALID">Inválido</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[70px_1fr_1fr_120px] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  <span>Linha</span>
                  <span>Estudante</span>
                  <span>Curso/Turma</span>
                  <span>Estado</span>
                </div>
                {rowsLoading ? (
                  <div className="p-4"><LoadingState title="Carregando linhas" /></div>
                ) : filteredRows.length ? (
                  filteredRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[70px_1fr_1fr_120px] gap-3 border-t border-slate-100 px-4 py-4 text-sm">
                      <div className="font-black text-slate-400">#{row.rowNumber}</div>
                      <div>
                        <p className="font-black text-slate-950">{row.fullName}</p>
                        <p className="text-xs text-slate-500">Matrícula: {row.studentNumber}</p>
                        <p className="text-xs text-slate-500">WhatsApp: {safeText(row.whatsapp)}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{row.courseName}</p>
                        <p className="text-xs text-slate-500">Turma: {row.className} · Turno: {row.shiftName}</p>
                        {row.validationMessage && <p className="mt-1 text-xs text-red-600">{row.validationMessage}</p>}
                      </div>
                      <div>
                        <StatusBadge status={row.status} label={importStatusLabel(row.status)} />
                      </div>
                    </div>
                  ))
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
