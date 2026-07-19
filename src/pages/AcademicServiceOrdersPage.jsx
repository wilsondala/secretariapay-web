import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileOutput,
  FileSignature,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRoundCheck,
  X,
} from 'lucide-react';
import useAuth from '../shared/auth/useAuth.js';
import { can } from '../shared/auth/permissions.js';
import { listStudents } from '../services/studentsService.js';
import { listAcademicServices } from '../services/academicServicesService.js';
import { downloadAcademicDocumentPdf } from '../services/academicDocumentsService.js';
import {
  createAcademicServiceOrder,
  deliverAcademicServiceOrder,
  generateAcademicServiceOrderDocument,
  listAcademicServiceOrderArchive,
  listAcademicServiceOrders,
  markAcademicServiceOrderPrinted,
  markAcademicServiceOrderReadyForPickup,
  markAcademicServiceOrderReadyForPrint,
  requestAcademicServiceOrderPayment,
  sendAcademicServiceOrderPickupWhatsapp,
  signAcademicServiceOrder,
  submitAcademicServiceOrderSignature,
} from '../services/academicServiceOrdersService.js';

const STATUS_SEQUENCE = [
  'SOLICITADO',
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'DOCUMENTO_GERADO',
  'PRONTO_PARA_IMPRESSAO',
  'IMPRESSO',
  'AGUARDANDO_ASSINATURA',
  'ASSINADO',
  'PRONTO_PARA_LEVANTAMENTO',
  'WHATSAPP_ENVIADO',
  'ENTREGUE',
];

const STATUS_INFO = {
  SOLICITADO: { label: 'Solicitado', helper: 'Pedido registado pela DCR', tone: 'slate', icon: ClipboardList },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', helper: 'Cobrança emitida', tone: 'amber', icon: Banknote },
  PAGO: { label: 'Pago', helper: 'Liberado para a Secretaria', tone: 'emerald', icon: BadgeCheck },
  DOCUMENTO_GERADO: { label: 'Documento gerado', helper: 'Documento preparado no sistema', tone: 'blue', icon: FileOutput },
  PRONTO_PARA_IMPRESSAO: { label: 'Pronto para impressão', helper: 'Na fila de impressão', tone: 'violet', icon: FileText },
  IMPRESSO: { label: 'Impresso', helper: 'Via física preparada', tone: 'indigo', icon: Printer },
  AGUARDANDO_ASSINATURA: { label: 'Aguardando assinatura', helper: 'Encaminhado à Direção', tone: 'orange', icon: FileSignature },
  ASSINADO: { label: 'Assinado', helper: 'Assinatura concluída', tone: 'cyan', icon: ShieldCheck },
  PRONTO_PARA_LEVANTAMENTO: { label: 'Pronto para levantamento', helper: 'Disponível fisicamente', tone: 'teal', icon: MapPin },
  WHATSAPP_ENVIADO: { label: 'WhatsApp enviado', helper: 'Estudante notificado', tone: 'green', icon: MessageCircle },
  ENTREGUE: { label: 'Entregue', helper: 'Levantamento registado', tone: 'emerald', icon: PackageCheck },
};

const EMPTY_CREATE = {
  studentId: '',
  serviceId: '',
  purpose: '',
  notes: '',
};

function infoForStatus(status) {
  return STATUS_INFO[status] || { label: status || 'Sem estado', helper: '', tone: 'slate', icon: Clock3 };
}

function readError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function money(value, currency = 'AOA') {
  if (value === null || value === undefined) return '-';
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} ${currency === 'AOA' ? 'Kz' : currency}`;
}

function datePlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function AcademicServiceOrdersPage() {
  const { user } = useAuth();
  const canCreate = can(user, 'createAcademicServiceOrders');
  const canProcess = can(user, 'processAcademicServiceOrders');
  const canSign = can(user, 'signAcademicServiceOrders');

  const [items, setItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tab, setTab] = useState('QUEUE');
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [dueDate, setDueDate] = useState(datePlusDays(3));
  const [physicalLocation, setPhysicalLocation] = useState('Secretaria Académica do IMETRO');
  const [recipientName, setRecipientName] = useState('');
  const [recipientDocumentNumber, setRecipientDocumentNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  async function load({ selectedId = null } = {}) {
    setLoading(true);
    setError('');
    try {
      const [orders, archived, studentRows, serviceRows] = await Promise.all([
        listAcademicServiceOrders(),
        listAcademicServiceOrderArchive(),
        listStudents(),
        listAcademicServices({ activeOnly: true }),
      ]);
      setItems(orders);
      setArchiveItems(archived);
      setStudents(studentRows);
      setServices(serviceRows);
      if (selectedId) {
        const refreshed = [...orders, ...archived].find((item) => item.id === selectedId);
        if (refreshed) setSelected(refreshed);
      }
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível carregar os pedidos de serviços académicos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelected(null);
        setCreateOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setPhysicalLocation(selected.physicalLocation || 'Secretaria Académica do IMETRO');
    setRecipientName(selected.recipientName || '');
    setRecipientDocumentNumber(selected.recipientDocumentNumber || '');
    setDeliveryNotes(selected.deliveryNotes || '');
  }, [selected]);

  const visibleItems = tab === 'ARCHIVE' ? archiveItems : items;
  const filtered = useMemo(() => visibleItems.filter((item) => {
    const term = query.trim().toLowerCase();
    const searchable = `${item.orderCode || ''} ${item.studentName || ''} ${item.studentNumber || ''} ${item.serviceName || ''} ${item.chargeCode || ''}`.toLowerCase();
    return (!term || searchable.includes(term)) && (statusFilter === 'ALL' || item.status === statusFilter);
  }), [visibleItems, query, statusFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    waitingPayment: items.filter((item) => item.status === 'AGUARDANDO_PAGAMENTO').length,
    secretaria: items.filter((item) => ['PAGO', 'DOCUMENTO_GERADO', 'PRONTO_PARA_IMPRESSAO', 'IMPRESSO'].includes(item.status)).length,
    direction: items.filter((item) => item.status === 'AGUARDANDO_ASSINATURA').length,
    pickup: items.filter((item) => ['ASSINADO', 'PRONTO_PARA_LEVANTAMENTO', 'WHATSAPP_ENVIADO'].includes(item.status)).length,
  }), [items]);

  async function createOrder(event) {
    event.preventDefault();
    if (!canCreate) return;
    setBusy('create');
    setError('');
    setSuccess('');
    try {
      const created = await createAcademicServiceOrder({
        studentId: createForm.studentId,
        serviceId: createForm.serviceId,
        purpose: createForm.purpose.trim() || null,
        notes: createForm.notes.trim() || null,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      setSelected(created);
      setSuccess('Pedido registado. A DCR pode agora emitir a cobrança institucional.');
      await load({ selectedId: created.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível criar o pedido.'));
    } finally {
      setBusy('');
    }
  }

  async function runAction(name, action, message) {
    if (!selected?.id) return;
    setBusy(name);
    setError('');
    setSuccess('');
    try {
      const updated = await action(selected.id);
      setSelected(updated);
      setSuccess(message);
      await load({ selectedId: updated.id });
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível concluir a operação.'));
    } finally {
      setBusy('');
    }
  }

  async function previewDocument() {
    if (!selected?.documentRequestId) return;
    setBusy('preview');
    setError('');
    try {
      const blob = await downloadAcademicDocumentPdf(selected.documentRequestId);
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (requestError) {
      setError(readError(requestError, 'Não foi possível abrir o documento.'));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-5">
      <section className="premium-hero">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="premium-pill"><ClipboardList size={14} /> Fluxo institucional de serviços</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-white sm:text-[32px]">Pedidos, documentos e levantamento</h1>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-white/85">Acompanhe o pedido desde a solicitação e pagamento até impressão, assinatura, notificação no WhatsApp e entrega física.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => load()} disabled={loading || Boolean(busy)} className="btn-light">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Atualizar
            </button>
            {canCreate ? <button onClick={() => setCreateOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F4B400] px-4 py-2.5 text-xs font-extrabold text-[#10213A] shadow-lg"><Plus size={17} /> Novo pedido</button> : null}
          </div>
        </div>
      </section>

      {error ? <Notice tone="red" icon={Clock3} text={error} /> : null}
      {success ? <Notice tone="green" icon={CheckCircle2} text={success} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Pedidos ativos" value={stats.total} helper="Ciclo operacional" />
        <Metric label="Aguardando pagamento" value={stats.waitingPayment} helper="Responsabilidade DCR" />
        <Metric label="Fila da Secretaria" value={stats.secretaria} helper="Gerar e imprimir" />
        <Metric label="Na Direção" value={stats.direction} helper="Aguardando assinatura" />
        <Metric label="Levantamento" value={stats.pickup} helper="Disponível ou notificado" />
      </section>

      <section className="premium-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-white/10">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[.04]">
            <TabButton active={tab === 'QUEUE'} onClick={() => setTab('QUEUE')} icon={ClipboardList} label="Fila operacional" />
            <TabButton active={tab === 'ARCHIVE'} onClick={() => setTab('ARCHIVE')} icon={Archive} label="Arquivo de documentos" />
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_230px] lg:w-[590px]">
            <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-premium pl-10" placeholder="Buscar pedido, estudante ou serviço..." /></div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-premium">
              <option value="ALL">Todos os estados</option>
              {STATUS_SEQUENCE.map((status) => <option key={status} value={status}>{STATUS_INFO[status].label}</option>)}
            </select>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500 dark:bg-white/[.03] dark:text-slate-400">
              <tr><th className="px-5 py-3">Pedido e estudante</th><th className="px-4 py-3">Serviço</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Atualização</th><th className="px-5 py-3 text-right">Detalhe</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[.06]">
              {filtered.map((item) => <OrderRow key={item.id} item={item} onOpen={() => setSelected(item)} />)}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-4 lg:hidden">{filtered.map((item) => <OrderCard key={item.id} item={item} onOpen={() => setSelected(item)} />)}</div>
        {loading ? <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Carregando pedidos...</div> : null}
        {!loading && filtered.length === 0 ? <EmptyState archive={tab === 'ARCHIVE'} /> : null}
      </section>

      {createOpen ? (
        <Modal title="Novo pedido de serviço" subtitle="Registo inicial pela DCR" onClose={() => setCreateOpen(false)}>
          <form onSubmit={createOrder} className="space-y-4">
            <Field label="Estudante">
              <select required value={createForm.studentId} onChange={(event) => setCreateForm((current) => ({ ...current, studentId: event.target.value }))} className="input-premium" disabled={Boolean(busy)}>
                <option value="">Selecione o estudante</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.studentNumber} · {student.fullName}</option>)}
              </select>
            </Field>
            <Field label="Serviço académico">
              <select required value={createForm.serviceId} onChange={(event) => setCreateForm((current) => ({ ...current, serviceId: event.target.value }))} className="input-premium" disabled={Boolean(busy)}>
                <option value="">Selecione o serviço</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {money(service.unitPrice, service.currency)}</option>)}
              </select>
            </Field>
            <Field label="Finalidade"><input value={createForm.purpose} onChange={(event) => setCreateForm((current) => ({ ...current, purpose: event.target.value }))} className="input-premium" placeholder="Ex.: Comprovação da situação académica" /></Field>
            <Field label="Observações"><textarea value={createForm.notes} onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))} rows={4} className="input-premium resize-y" placeholder="Informações internas para a DCR e Secretaria." /></Field>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancelar</button><button disabled={Boolean(busy)} className="btn-primary">{busy === 'create' ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Registar pedido</button></div>
          </form>
        </Modal>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button type="button" onClick={() => setSelected(null)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-label="Fechar detalhe" />
          <aside className="relative h-full w-full max-w-[720px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#081321]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#081321]/95">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#3157D5] dark:text-[#8EA9FF]">{selected.orderCode}</p><h2 className="mt-1 text-xl font-extrabold text-imetro-navy dark:text-white">{selected.serviceName}</h2><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{selected.studentName} · {selected.studentNumber}</p></div><button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><X size={20} /></button></div>
            </div>

            <div className="space-y-5 p-5">
              <StatusBanner status={selected.status} />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Valor" value={money(selected.amount, selected.currency)} />
                <Info label="Cobrança" value={selected.chargeCode || 'Ainda não emitida'} />
                <Info label="Estado financeiro" value={selected.chargeStatus || 'Pendente de cobrança'} />
                <Info label="Curso" value={selected.courseName || '-'} />
                <Info label="Documento" value={selected.documentCode || 'Ainda não gerado'} />
                <Info label="Local físico" value={selected.physicalLocation || 'Ainda não definido'} />
              </div>

              <div className="premium-card p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Linha do tempo obrigatória</h3><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">As etapas não podem ser ignoradas.</p></div><Clock3 size={18} className="text-[#3157D5]" /></div>
                <Timeline currentStatus={selected.status} />
              </div>

              <div className="premium-card p-4">
                <h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Próxima ação</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">A ação disponível respeita o perfil e o estado atual.</p>
                <div className="mt-4 space-y-3">
                  {selected.status === 'SOLICITADO' && canCreate ? <><Field label="Vencimento da cobrança"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="input-premium" /></Field><ActionButton icon={Banknote} label="Emitir cobrança e aguardar pagamento" onClick={() => runAction('payment', (id) => requestAcademicServiceOrderPayment(id, dueDate), 'Cobrança emitida. O pedido aguarda pagamento confirmado.')} loading={busy === 'payment'} primary /></> : null}
                  {selected.status === 'AGUARDANDO_PAGAMENTO' ? <ReadOnlyHint text="A DCR deve confirmar o pagamento na cobrança ou aprovar o comprovativo. Só depois o pedido aparecerá na fila operacional da Secretaria." /> : null}
                  {selected.status === 'PAGO' && canProcess ? <ActionButton icon={FileOutput} label="Gerar documento" onClick={() => runAction('generate', generateAcademicServiceOrderDocument, 'Documento gerado e associado ao pedido.')} loading={busy === 'generate'} primary /> : null}
                  {selected.status === 'DOCUMENTO_GERADO' && canProcess ? <ActionButton icon={FileText} label="Colocar na fila de impressão" onClick={() => runAction('ready-print', markAcademicServiceOrderReadyForPrint, 'Documento pronto para impressão.')} loading={busy === 'ready-print'} primary /> : null}
                  {selected.status === 'PRONTO_PARA_IMPRESSAO' && canProcess ? <ActionButton icon={Printer} label="Registar impressão" onClick={() => runAction('print', markAcademicServiceOrderPrinted, 'Impressão registada pela Secretaria.')} loading={busy === 'print'} primary /> : null}
                  {selected.status === 'IMPRESSO' && canProcess ? <ActionButton icon={UserRoundCheck} label="Encaminhar para assinatura" onClick={() => runAction('signature', submitAcademicServiceOrderSignature, 'Documento encaminhado para assinatura da Direção.')} loading={busy === 'signature'} warning /> : null}
                  {selected.status === 'AGUARDANDO_ASSINATURA' && canSign ? <ActionButton icon={FileSignature} label="Assinar documento" onClick={() => runAction('sign', signAcademicServiceOrder, 'Documento assinado pela Direção.')} loading={busy === 'sign'} warning /> : null}
                  {selected.status === 'AGUARDANDO_ASSINATURA' && !canSign ? <ReadOnlyHint text="A assinatura é exclusiva da Direção e dos administradores autorizados." /> : null}
                  {selected.status === 'ASSINADO' && canProcess ? <><Field label="Local de levantamento"><input value={physicalLocation} onChange={(event) => setPhysicalLocation(event.target.value)} className="input-premium" /></Field><ActionButton icon={MapPin} label="Confirmar disponibilidade física" onClick={() => runAction('pickup', (id) => markAcademicServiceOrderReadyForPickup(id, { physicalLocation }), 'Documento assinado e disponível fisicamente para levantamento.')} loading={busy === 'pickup'} success /></> : null}
                  {selected.status === 'PRONTO_PARA_LEVANTAMENTO' && canProcess ? <ActionButton icon={Send} label="Notificar estudante pelo WhatsApp" onClick={() => runAction('whatsapp', sendAcademicServiceOrderPickupWhatsapp, 'Estudante notificado pelo WhatsApp para levantamento.')} loading={busy === 'whatsapp'} success /> : null}
                  {selected.status === 'WHATSAPP_ENVIADO' && canProcess ? <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Nome de quem levantou"><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="input-premium" /></Field><Field label="Documento de identificação"><input value={recipientDocumentNumber} onChange={(event) => setRecipientDocumentNumber(event.target.value)} className="input-premium" /></Field></div><Field label="Observações da entrega"><textarea value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} rows={3} className="input-premium resize-y" /></Field><ActionButton icon={PackageCheck} label="Registar levantamento e entrega" onClick={() => runAction('deliver', (id) => deliverAcademicServiceOrder(id, { recipientName, recipientDocumentNumber, notes: deliveryNotes }), 'Entrega registada e documento arquivado.')} loading={busy === 'deliver'} success /></div> : null}
                  {selected.status === 'ENTREGUE' ? <ReadOnlyHint text={`Entregue a ${selected.recipientName || '-'} em ${formatDateTime(selected.deliveredAt)}. Registo arquivado para auditoria.`} /> : null}
                  {selected.documentRequestId ? <ActionButton icon={FileText} label="Pré-visualizar documento PDF" onClick={previewDocument} loading={busy === 'preview'} /> : null}
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-sm font-extrabold text-imetro-navy dark:text-white">Registos de responsabilidade</h3>
                <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2 dark:text-slate-300">
                  <Audit label="Solicitado" actor={selected.requestedBy} date={selected.requestedAt} />
                  <Audit label="Pagamento confirmado" actor="DCR / sistema financeiro" date={selected.paymentConfirmedAt} />
                  <Audit label="Impresso" actor={selected.printedBy} date={selected.printedAt} />
                  <Audit label="Assinado" actor={selected.signedBy} date={selected.signedAt} />
                  <Audit label="WhatsApp" actor={selected.whatsappSentBy} date={selected.whatsappSentAt} />
                  <Audit label="Entregue" actor={selected.deliveredBy} date={selected.deliveredAt} />
                </div>
              </div>
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

function TabButton({ active, onClick, icon: Icon, label }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold transition ${active ? 'bg-white text-[#3157D5] shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}><Icon size={15} />{label}</button>;
}

function StatusBadge({ status }) {
  const info = infoForStatus(status);
  const Icon = info.icon;
  const tones = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
    blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200',
    violet: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200',
    orange: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-200',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200',
    teal: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-200',
    green: 'border-green-200 bg-green-50 text-green-800 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${tones[info.tone] || tones.slate}`}><Icon size={13} />{info.label}</span>;
}

function OrderRow({ item, onOpen }) {
  return <tr className="transition hover:bg-[#F7F9FF] dark:hover:bg-white/[.04]"><td className="px-5 py-4"><p className="text-xs font-extrabold text-[#3157D5]">{item.orderCode}</p><p className="mt-1 text-sm font-extrabold text-imetro-navy dark:text-white">{item.studentName}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.studentNumber}</p></td><td className="px-4 py-4"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.serviceName}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{item.serviceCode}</p></td><td className="px-4 py-4 text-xs font-extrabold text-slate-700 dark:text-slate-200">{money(item.amount, item.currency)}</td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4 text-xs font-semibold text-slate-500 dark:text-slate-300">{formatDateTime(item.updatedAt)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={onOpen} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-[#3157D5] hover:bg-[#EEF3FF] dark:border-white/10 dark:hover:bg-white/10">Abrir</button></td></tr>;
}

function OrderCard({ item, onOpen }) {
  return <button type="button" onClick={onOpen} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#3157D5]">{item.orderCode}</p><p className="mt-1 truncate text-sm font-extrabold text-imetro-navy dark:text-white">{item.studentName}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.serviceName}</p></div><StatusBadge status={item.status} /></div><div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{money(item.amount, item.currency)}</span><span>{formatDateTime(item.updatedAt)}</span></div></button>;
}

function StatusBanner({ status }) {
  const info = infoForStatus(status);
  const Icon = info.icon;
  return <div className="rounded-2xl border border-[#DCE5FA] bg-[#F5F8FF] p-4 dark:border-white/10 dark:bg-white/[.04]"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3157D5] text-white"><Icon size={20} /></span><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-slate-400">Estado atual</p><p className="mt-1 text-base font-extrabold text-imetro-navy dark:text-white">{info.label}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{info.helper}</p></div></div></div>;
}

function Timeline({ currentStatus }) {
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
  return <div className="mt-4 grid gap-2 sm:grid-cols-2">{STATUS_SEQUENCE.map((status, index) => { const info = STATUS_INFO[status]; const complete = index < currentIndex; const current = index === currentIndex; const Icon = info.icon; return <div key={status} className={`flex items-center gap-3 rounded-xl border p-3 ${current ? 'border-[#3157D5] bg-[#EEF3FF] dark:border-[#7EA0FF] dark:bg-[#3157D5]/15' : complete ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-400/10' : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[.03]'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${current ? 'bg-[#3157D5] text-white' : complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>{complete ? <CheckCircle2 size={16} /> : <Icon size={15} />}</span><div className="min-w-0"><p className="truncate text-xs font-extrabold text-slate-700 dark:text-slate-200">{info.label}</p><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">{info.helper}</p></div></div>; })}</div>;
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[.04]"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-bold text-imetro-navy dark:text-white">{value || '-'}</p></div>;
}

function Audit({ label, actor, date }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[.03]"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{actor || '-'}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{formatDateTime(date)}</p></div>;
}

function ActionButton({ icon: Icon, label, onClick, loading, primary, warning, success }) {
  const tone = primary ? 'bg-[#3157D5] text-white hover:bg-[#2449C6]' : warning ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : success ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.04] dark:text-white dark:hover:bg-white/[.08]';
  return <button type="button" onClick={onClick} disabled={loading} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${tone}`}>{loading ? <Loader2 className="animate-spin" size={17} /> : <Icon size={17} />}{label}</button>;
}

function ReadOnlyHint({ text }) {
  return <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300"><ShieldCheck size={16} className="mt-0.5 shrink-0" />{text}</div>;
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B192A]"><div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#3157D5]">{subtitle}</p><h2 className="mt-1 text-xl font-extrabold text-imetro-navy dark:text-white">{title}</h2></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X size={19} /></button></div><div className="p-6">{children}</div></div></div>;
}

function EmptyState({ archive }) {
  const Icon = archive ? Archive : ClipboardList;
  return <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center"><Icon size={34} className="text-slate-300" /><p className="mt-3 text-sm font-extrabold text-slate-600 dark:text-slate-200">{archive ? 'Nenhum documento arquivado' : 'Nenhum pedido encontrado'}</p><p className="mt-1 text-xs font-semibold text-slate-400">{archive ? 'Os pedidos assinados, notificados e entregues serão preservados aqui.' : 'Registe um pedido ou altere os filtros de pesquisa.'}</p></div>;
}
