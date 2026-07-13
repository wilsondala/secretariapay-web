import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FilePenLine,
  FileSignature,
  FileText,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRoundCheck,
  X,
} from 'lucide-react';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';
import {
  createDemoDeclaration,
  downloadAcademicDocumentPdf,
  listAcademicDocuments,
  markAcademicDocumentReady,
  sendAcademicDocumentWhatsapp,
  signAcademicDocumentDemo,
  updateAcademicDocument,
} from '../services/academicDocumentsService.js';

const STATUS = {
  DRAFT: { label: 'Em preparação', tone: 'slate', icon: FilePenLine },
  READY_FOR_SIGNATURE: { label: 'Pronto para assinatura', tone: 'amber', icon: Clock3 },
  SIGNED: { label: 'Assinado', tone: 'blue', icon: BadgeCheck },
  SENT: { label: 'Disponibilizado', tone: 'green', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelado', tone: 'red', icon: AlertTriangle },
};

const EMPTY_CREATE = {
  studentNumber: '202301404',
  purpose: 'Comprovação da situação académica',
  declarationText: '',
};

function infoForStatus(value) {
  return STATUS[value] || { label: value || 'Sem estado', tone: 'slate', icon: FileText };
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

export default function AcademicDocumentsPage() {
  const { user } = useAuth();
  const canPrepare = can(user, 'prepareAcademicDocuments');
  const canSign = can(user, 'signAcademicDocuments');
  const canSend = can(user, 'sendAcademicDocuments');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ purpose: '', declarationText: '' });

  async function load({ selectedId = null } = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await listAcademicDocuments();
      setItems(data);
      if (selectedId) {
        const refreshed = data.find((item) => item.id === selectedId);
        if (refreshed) {
          setSelected(refreshed);
          setEditForm({ purpose: refreshed.purpose || '', declarationText: refreshed.declarationText || '' });
        }
      }
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível carregar os documentos académicos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.studentName || ''} ${item.studentNumber || ''} ${item.documentCode || ''} ${item.courseName || ''}`.toLowerCase();
    return (!term || searchable.includes(term)) && (filterStatus === 'ALL' || item.status === filterStatus);
  }), [items, query, filterStatus]);

  const stats = useMemo(() => ({
    total: items.length,
    draft: items.filter((item) => item.status === 'DRAFT').length,
    ready: items.filter((item) => item.status === 'READY_FOR_SIGNATURE').length,
    signed: items.filter((item) => item.status === 'SIGNED').length,
    sent: items.filter((item) => item.status === 'SENT').length,
  }), [items]);

  async function createDocument(event) {
    event.preventDefault();
    if (!canPrepare) return;
    setBusy('create');
    setError('');
    setSuccess('');
    try {
      const created = await createDemoDeclaration({
        studentNumber: createForm.studentNumber.trim(),
        purpose: createForm.purpose.trim(),
        declarationText: createForm.declarationText.trim() || null,
      });
      setSelected(created);
      setEditForm({ purpose: created.purpose || '', declarationText: created.declarationText || '' });
      setCreateForm((current) => ({ ...EMPTY_CREATE, studentNumber: current.studentNumber }));
      setSuccess('Declaração criada. Revise o texto antes de encaminhar para assinatura.');
      await load({ selectedId: created.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível criar a declaração.'));
    } finally {
      setBusy('');
    }
  }

  function openDocument(item) {
    setSelected(item);
    setEditForm({ purpose: item.purpose || '', declarationText: item.declarationText || '' });
    setError('');
    setSuccess('');
  }

  async function runAction(name, fn, message) {
    if (!selected?.id) return;
    setBusy(name);
    setError('');
    setSuccess('');
    try {
      const updated = await fn(selected.id);
      setSelected(updated);
      setEditForm({ purpose: updated.purpose || '', declarationText: updated.declarationText || '' });
      setSuccess(message);
      await load({ selectedId: updated.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível concluir a operação.'));
    } finally {
      setBusy('');
    }
  }

  async function saveDraft() {
    if (!selected?.id || !canPrepare) return;
    setBusy('save');
    setError('');
    setSuccess('');
    try {
      const updated = await updateAcademicDocument(selected.id, {
        purpose: editForm.purpose.trim(),
        declarationText: editForm.declarationText.trim(),
      });
      setSelected(updated);
      setSuccess('Texto da declaração guardado com sucesso.');
      await load({ selectedId: updated.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível guardar a declaração.'));
    } finally {
      setBusy('');
    }
  }

  async function preview() {
    if (!selected?.id) return;
    setBusy('preview');
    setError('');
    try {
      const blob = await downloadAcademicDocumentPdf(selected.id);
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível abrir a pré-visualização.'));
    } finally {
      setBusy('');
    }
  }

  const editable = selected && !['SIGNED', 'SENT', 'CANCELLED'].includes(selected.status);
  const publiclyAvailable = selected && ['SIGNED', 'SENT'].includes(selected.status);

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><FileSignature size={14} /> Gestão documental académica</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[32px]">Documentos académicos</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Prepare, revise, assine e disponibilize declarações académicas pelo SecretáriaPay.</p>
          </div>
          <button onClick={() => load()} disabled={loading || Boolean(busy)} className="btn-light self-start xl:self-auto">
            {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><p className="font-black">Demonstração — sem validade jurídica.</p><p className="mt-1 text-xs leading-5">Nesta fase, todas as declarações usam a assinatura eletrónica demonstrativa de Zakeu António Zengo, Presidente da Instituição.</p></div></div>
      </section>

      {error ? <Notice tone="red" icon={AlertTriangle} text={error} /> : null}
      {success ? <Notice tone="green" icon={CheckCircle2} text={success} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Documentos" value={stats.total} helper="Total da demonstração" />
        <Metric label="Em preparação" value={stats.draft} helper="Rascunhos editáveis" />
        <Metric label="Para assinatura" value={stats.ready} helper="Aguardando Zakeu" />
        <Metric label="Assinados" value={stats.signed} helper="Prontos para envio" />
        <Metric label="Disponibilizados" value={stats.sent} helper="Enviados ao estudante" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <div className="premium-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#3157D5] dark:text-[#8EA9FF]">Nova demonstração</p><h2 className="mt-1 text-lg font-extrabold text-imetro-navy dark:text-white">Criar declaração simples</h2><p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">A matrícula preenche automaticamente os dados académicos.</p></div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#3157D5] dark:bg-white/10 dark:text-[#8EA9FF]"><Plus size={19} /></span>
          </div>
          <form onSubmit={createDocument} className="mt-5 space-y-4">
            <Field label="Matrícula do estudante"><input required value={createForm.studentNumber} onChange={(event) => setCreateForm((current) => ({ ...current, studentNumber: event.target.value }))} className="input-premium" placeholder="Ex.: 202301404" disabled={!canPrepare || Boolean(busy)} /></Field>
            <Field label="Finalidade"><input required value={createForm.purpose} onChange={(event) => setCreateForm((current) => ({ ...current, purpose: event.target.value }))} className="input-premium" placeholder="Ex.: Comprovação académica" disabled={!canPrepare || Boolean(busy)} /></Field>
            <Field label="Texto personalizado (opcional)"><textarea value={createForm.declarationText} onChange={(event) => setCreateForm((current) => ({ ...current, declarationText: event.target.value }))} rows={5} className="input-premium min-h-[126px] resize-y leading-6" placeholder="Deixe em branco para usar o texto institucional automático." disabled={!canPrepare || Boolean(busy)} /></Field>
            {canPrepare ? <button disabled={Boolean(busy)} className="btn-primary w-full justify-center">{busy === 'create' ? <Loader2 className="animate-spin" size={17} /> : <FilePenLine size={17} />} Criar declaração</button> : <ReadOnlyHint text="Seu perfil possui apenas acesso de consulta." />}
          </form>
        </div>

        <div className="premium-card overflow-hidden">
          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px] dark:border-white/10">
            <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-premium pl-10" placeholder="Buscar estudante, matrícula ou código..." /></div>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="input-premium"><option value="ALL">Todos os estados</option>{Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select>
          </div>

          <div className="hidden lg:block">
            <table className="w-full table-fixed text-left">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500 dark:bg-white/[.03] dark:text-slate-400"><tr><th className="w-[30%] px-4 py-3">Estudante</th><th className="w-[25%] px-4 py-3">Documento</th><th className="w-[21%] px-4 py-3">Estado</th><th className="w-[24%] px-4 py-3">Atualização</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">{filtered.map((item) => <DocumentRow key={item.id} item={item} onClick={() => openDocument(item)} />)}</tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 lg:hidden">{filtered.map((item) => <DocumentCard key={item.id} item={item} onClick={() => openDocument(item)} />)}</div>
          {!loading && filtered.length === 0 ? <EmptyState /> : null}
          {loading ? <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Carregando documentos...</div> : null}
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button type="button" onClick={() => setSelected(null)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fechar detalhe" />
          <aside className="relative h-full w-full max-w-[620px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#081321]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#081321]/95">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#3157D5] dark:text-[#8EA9FF]">Declaração simples</p><h2 className="mt-1 text-xl font-extrabold text-imetro-navy dark:text-white">{selected.studentName}</h2><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{selected.studentNumber} · {selected.documentCode}</p></div><button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><X size={20} /></button></div>
            </div>

            <div className="space-y-5 p-5">
              <StatusBanner item={selected} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Curso" value={selected.courseName || '-'} />
                <Info label="Ano académico" value={selected.academicYear || '-'} />
                <Info label="Signatário demo" value={selected.signatoryName} />
                <Info label="Cargo" value={selected.signatoryRole} />
                <Info label="Versão" value={`v${selected.versionNumber || 1}`} />
                <Info label="Hash" value={selected.documentHash ? `${selected.documentHash.slice(0, 16)}...` : 'Pendente'} />
              </div>

              <div className="premium-card p-4">
                <div className="flex items-center gap-2"><FileText size={17} className="text-[#3157D5]" /><h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Conteúdo da declaração</h3></div>
                <div className="mt-4 space-y-4">
                  <Field label="Finalidade"><input value={editForm.purpose} onChange={(event) => setEditForm((current) => ({ ...current, purpose: event.target.value }))} className="input-premium" disabled={!editable || !canPrepare || Boolean(busy)} /></Field>
                  <Field label="Texto"><textarea value={editForm.declarationText} onChange={(event) => setEditForm((current) => ({ ...current, declarationText: event.target.value }))} rows={9} className="input-premium min-h-[210px] resize-y leading-6" disabled={!editable || !canPrepare || Boolean(busy)} /></Field>
                  {editable && canPrepare ? <button type="button" onClick={saveDraft} disabled={Boolean(busy)} className="btn-secondary w-full justify-center">{busy === 'save' ? <Loader2 className="animate-spin" size={17} /> : <FilePenLine size={17} />} Guardar alterações</button> : null}
                  {!editable ? <ReadOnlyHint text="O conteúdo foi bloqueado após a assinatura." /> : null}
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Fluxo de aprovação</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ActionButton icon={FileText} label="Pré-visualizar PDF" onClick={preview} loading={busy === 'preview'} disabled={Boolean(busy)} />
                  {publiclyAvailable && selected.validationUrl ? <ActionButton icon={ShieldCheck} label="Abrir validação" onClick={() => window.open(selected.validationUrl, '_blank', 'noopener,noreferrer')} disabled={Boolean(busy)} /> : null}
                  {editable && canPrepare ? <ActionButton icon={UserRoundCheck} label="Pronto para assinatura" onClick={() => runAction('ready', markAcademicDocumentReady, 'Documento encaminhado para assinatura.')} loading={busy === 'ready'} disabled={Boolean(busy)} primary /> : null}
                  {selected.status === 'READY_FOR_SIGNATURE' && canSign ? <ActionButton icon={FileSignature} label="Assinar como Zakeu" onClick={() => runAction('sign', signAcademicDocumentDemo, 'Declaração assinada eletronicamente em modo demonstração.')} loading={busy === 'sign'} disabled={Boolean(busy)} warning /> : null}
                  {publiclyAvailable && canSend ? <ActionButton icon={Send} label={selected.status === 'SENT' ? 'Reenviar no WhatsApp' : 'Enviar no WhatsApp'} onClick={() => runAction('send', sendAcademicDocumentWhatsapp, 'Documento disponibilizado ao estudante pelo WhatsApp.')} loading={busy === 'send'} disabled={Boolean(busy)} success /> : null}
                </div>
                {!canSign ? <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300"><LockKeyhole size={15} /> A assinatura demonstrativa é permitida apenas para Direção e administradores.</p> : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300"><p><b>Criado:</b> {formatDateTime(selected.createdAt)}</p><p><b>Assinado:</b> {formatDateTime(selected.signedAt)}</p><p><b>Enviado:</b> {formatDateTime(selected.sentAt)}</p></div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, helper }) {
  return <div className="premium-card p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-imetro-navy dark:text-white">{value}</p><p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{helper}</p></div>;
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs font-extrabold text-slate-500 dark:text-slate-300">{label}</span><div className="mt-2">{children}</div></label>;
}

function Notice({ tone, icon: Icon, text }) {
  const classes = tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200';
  return <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}><Icon size={18} className="mt-0.5 shrink-0" />{text}</div>;
}

function StatusBadge({ status }) {
  const info = infoForStatus(status);
  const Icon = info.icon;
  const tones = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
    blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
    red: 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${tones[info.tone]}`}><Icon size={13} />{info.label}</span>;
}

function DocumentRow({ item, onClick }) {
  return <tr onClick={onClick} className="cursor-pointer transition hover:bg-[#F7F9FF] dark:hover:bg-white/[.04]"><td className="px-4 py-4"><p className="truncate text-sm font-extrabold text-imetro-navy dark:text-white">{item.studentName}</p><p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.studentNumber}</p></td><td className="px-4 py-4"><p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">Declaração simples</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{item.documentCode}</p></td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4 text-xs font-semibold text-slate-500 dark:text-slate-300">{formatDateTime(item.updatedAt)}</td></tr>;
}

function DocumentCard({ item, onClick }) {
  return <button type="button" onClick={onClick} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-imetro-navy dark:text-white">{item.studentName}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{item.studentNumber}</p></div><StatusBadge status={item.status} /></div><p className="mt-3 truncate text-[11px] font-semibold text-slate-400">{item.documentCode}</p></button>;
}

function StatusBanner({ item }) {
  const info = infoForStatus(item.status);
  const Icon = info.icon;
  return <div className="rounded-2xl border border-[#DCE5FA] bg-[#F5F8FF] p-4 dark:border-white/10 dark:bg-white/[.04]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3157D5] text-white"><Icon size={19} /></span><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-slate-400">Estado do documento</p><p className="mt-1 text-sm font-extrabold text-imetro-navy dark:text-white">{info.label}</p></div></div></div>;
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[.04]"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-bold text-imetro-navy dark:text-white">{value || '-'}</p></div>;
}

function ActionButton({ icon: Icon, label, onClick, loading, disabled, primary, warning, success }) {
  const tone = primary ? 'bg-[#3157D5] text-white hover:bg-[#2449C6]' : warning ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : success ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.04] dark:text-white dark:hover:bg-white/[.08]';
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${tone}`}>{loading ? <Loader2 className="animate-spin" size={17} /> : <Icon size={17} />}{label}</button>;
}

function ReadOnlyHint({ text }) {
  return <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300"><LockKeyhole size={16} />{text}</div>;
}

function EmptyState() {
  return <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center"><FileSignature size={32} className="text-slate-300" /><p className="mt-3 text-sm font-extrabold text-slate-600 dark:text-slate-200">Nenhum documento encontrado</p><p className="mt-1 text-xs font-semibold text-slate-400">Crie a primeira declaração ou altere os filtros.</p></div>;
}
