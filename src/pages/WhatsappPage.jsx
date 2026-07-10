import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { fetchWhatsappMessages, fetchWhatsappSessions } from '../services/whatsappService.js';
import { normalizeDateTime, getStudentName, safeText } from '../utils/formatters.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://secretariapay-api.paixaoangola.com';

const filterOptions = {
  status: ['ALL', 'SENT', 'FAILED', 'PENDING', 'DELIVERED', 'SKIPPED_NO_CONTACT'],
  channel: ['ALL', 'WHATSAPP', 'EMAIL', 'SMS'],
  type: ['ALL', 'PAYMENT_GUIDE', 'RECEIPT', 'PAYMENT_PROOF', 'NOTIFICATION'],
};

function normalizeMessage(message) {
  const charge = message?.charge || {};
  const student = message?.student || charge?.student || {};

  return {
    ...message,
    id: message?.id || message?.messageId || message?.providerMessageId || `${message?.chargeCode || 'msg'}-${message?.createdAt || Date.now()}`,
    channel: safeText(message?.channel || message?.deliveryChannel || 'WHATSAPP').toUpperCase(),
    type: safeText(message?.type || message?.messageType || 'PAYMENT_GUIDE').toUpperCase(),
    status: safeText(message?.status || message?.dispatchStatus || 'PENDING').toUpperCase(),
    recipientPhone: message?.recipientPhone || message?.recipient_phone || message?.phone || message?.to || '',
    chargeCode: message?.chargeCode || message?.charge_code || message?.code || charge?.chargeCode || charge?.charge_code || charge?.code || '',
    chargeId: message?.chargeId || message?.charge_id || charge?.id,
    providerMessageId: message?.providerMessageId || message?.provider_message_id || message?.wamid || '',
    failureReason: message?.failureReason || message?.failure_reason || message?.errorMessage || '',
    createdAt: message?.createdAt || message?.created_at || message?.sentAt || message?.sent_at,
    studentName: message?.studentName || message?.student_name || getStudentName(student),
    body: message?.body || message?.caption || message?.message || message?.text || '',
  };
}

function normalizeSession(session) {
  return {
    ...session,
    id: session?.id || session?.phoneNumber || session?.phone_number,
    phoneNumber: session?.phoneNumber || session?.phone_number || session?.phone || '-',
    status: safeText(session?.status || 'ACTIVE').toUpperCase(),
    currentStep: session?.currentStep || session?.current_step || '-',
    lastMessageText: session?.lastMessageText || session?.last_message_text || '',
    updatedAt: session?.updatedAt || session?.updated_at || session?.createdAt || session?.created_at,
  };
}

function statusTone(status) {
  const value = safeText(status).toUpperCase();
  if (['SENT', 'DELIVERED', 'READ'].includes(value)) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (['FAILED', 'ERROR'].includes(value)) return 'text-red-700 bg-red-50 border-red-200';
  if (['SKIPPED_NO_CONTACT', 'SKIPPED'].includes(value)) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-700 bg-slate-50 border-slate-200';
}

function labelStatus(status) {
  const map = {
    SENT: 'Enviado',
    DELIVERED: 'Entregue',
    READ: 'Lido',
    FAILED: 'Falhou',
    PENDING: 'Pendente',
    SKIPPED: 'Ignorado',
    SKIPPED_NO_CONTACT: 'Sem contacto',
  };
  return map[safeText(status).toUpperCase()] || status || '-';
}

function labelType(type) {
  const map = {
    PAYMENT_GUIDE: 'Guia de pagamento',
    RECEIPT: 'Recibo',
    PAYMENT_PROOF: 'Comprovativo',
    NOTIFICATION: 'Notificação',
  };
  return map[safeText(type).toUpperCase()] || type || '-';
}

function labelChannel(channel) {
  const map = {
    ALL: 'Todos os canais',
    WHATSAPP: 'WhatsApp',
    EMAIL: 'E-mail',
    SMS: 'SMS',
  };
  return map[safeText(channel).toUpperCase()] || channel || '-';
}

function labelFilterOption(group, option) {
  if (option === 'ALL') return 'Todos';
  if (group === 'status') return labelStatus(option);
  if (group === 'channel') return labelChannel(option);
  if (group === 'type') return labelType(option);
  return option;
}

export default function WhatsappPage() {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endpointInfo, setEndpointInfo] = useState({ messages: null, sessions: null, available: true });
  const [activeTab, setActiveTab] = useState('messages');
  const [filters, setFilters] = useState({ search: '', status: 'ALL', channel: 'ALL', type: 'ALL' });

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [messageResult, sessionResult] = await Promise.all([
        fetchWhatsappMessages({ limit: 200 }),
        fetchWhatsappSessions({ limit: 80 }),
      ]);

      const normalizedMessages = messageResult.messages.map(normalizeMessage);
      const normalizedSessions = sessionResult.sessions.map(normalizeSession);

      setMessages(normalizedMessages);
      setSessions(normalizedSessions);
      setSelected(normalizedMessages[0] || null);
      setEndpointInfo({
        messages: messageResult.endpoint,
        sessions: sessionResult.endpoint,
        available: messageResult.available,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Não foi possível carregar o histórico real do WhatsApp.');
      setMessages([]);
      setSessions([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMessages = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return messages.filter((message) => {
      if (filters.status !== 'ALL' && message.status !== filters.status) return false;
      if (filters.channel !== 'ALL' && message.channel !== filters.channel) return false;
      if (filters.type !== 'ALL' && message.type !== filters.type) return false;
      if (!term) return true;
      return [message.chargeCode, message.recipientPhone, message.providerMessageId, message.failureReason, message.studentName, message.type, message.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [filters, messages]);

  const summary = useMemo(() => {
    const sent = messages.filter((message) => ['SENT', 'DELIVERED', 'READ'].includes(message.status)).length;
    const failed = messages.filter((message) => message.status === 'FAILED').length;
    const skipped = messages.filter((message) => ['SKIPPED', 'SKIPPED_NO_CONTACT'].includes(message.status)).length;
    const guides = messages.filter((message) => message.type === 'PAYMENT_GUIDE').length;
    return { total: messages.length, sent, failed, skipped, guides };
  }, [messages]);

  const selectedGuideUrl = selected?.chargeCode ? `${API_BASE_URL}/api/v1/public/payment-guides/${selected.chargeCode}/pdf` : null;

  if (loading) return <LoadingState title="Carregando histórico do WhatsApp" />;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-gradient-to-br from-[#061936] via-[#08285A] to-[#061936] p-6 text-white shadow-[0_28px_90px_rgba(7,20,45,.22)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-20 h-56 w-56 rounded-full bg-imetro-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-white/80">
              <MessageCircle size={14} />
              Atendimento financeiro WhatsApp
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">WhatsApp financeiro</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/78 sm:text-base">
              Monitorização de guias enviadas, recibos em PDF, sessões do robô, contactos oficiais e falhas de entrega.
            </p>
          </div>
          <button type="button" onClick={loadData} className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white shadow-[0_16px_44px_rgba(0,0,0,.12)] transition hover:bg-white/15">
            <RefreshCcw size={17} />
            Atualizar histórico
          </button>
        </div>
      </section>

      {!endpointInfo.available ? (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-4 text-sm font-semibold text-amber-900">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19} />
            <div>
              <p className="font-black">Histórico real indisponível.</p>
              <p className="mt-1 leading-6">O endpoint administrativo de mensagens ainda não devolveu dados reais. As mensagens demonstrativas antigas foram removidas para evitar confusão operacional.</p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <ErrorState title="Falha ao carregar dados" message={error} onRetry={loadData} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={MessageCircle} title="Mensagens" value={summary.total} description="Total carregado" />
        <StatCard icon={CheckCircle2} title="Enviadas" value={summary.sent} description="Enviado, entregue ou lido" tone="success" />
        <StatCard icon={XCircle} title="Falhadas" value={summary.failed} description="Ação DCR necessária" tone="danger" />
        <StatCard icon={AlertTriangle} title="Sem contacto" value={summary.skipped} description="Cadastro incompleto" tone="warning" />
        <StatCard icon={FileText} title="Guias" value={summary.guides} description="Guias de pagamento" tone="gold" />
      </section>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')}>Mensagens</TabButton>
        <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')}>Sessões WhatsApp</TabButton>
      </div>

      {activeTab === 'messages' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
          <section className="card-premium min-w-0 overflow-hidden">
            <div className="border-b border-slate-100/80 bg-white/80 p-4 backdrop-blur">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_180px]">
                <label className="relative min-w-0">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar por estudante, telefone, cobrança, falha ou ID do provedor..." className="input-premium pl-11" />
                </label>
                <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="input-premium">
                  {filterOptions.status.map((option) => <option key={option} value={option}>{labelFilterOption('status', option)}</option>)}
                </select>
                <select value={filters.channel} onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value }))} className="input-premium">
                  {filterOptions.channel.map((option) => <option key={option} value={option}>{labelFilterOption('channel', option)}</option>)}
                </select>
                <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="input-premium">
                  {filterOptions.type.map((option) => <option key={option} value={option}>{labelFilterOption('type', option)}</option>)}
                </select>
              </div>
            </div>

            {filteredMessages.length ? (
              <div className="max-h-[68vh] space-y-3 overflow-y-auto p-3 sm:p-4">
                {filteredMessages.map((message) => <MessageCard key={message.id} message={message} active={selected?.id === message.id} onClick={() => setSelected(message)} />)}
              </div>
            ) : (
              <EmptyState title="Nenhuma mensagem real encontrada" message="Quando a API devolver mensagens reais, elas aparecerão nesta lista. As mensagens demonstrativas antigas não são mais exibidas." />
            )}
          </section>

          <aside className="card-premium min-w-0 p-4 xl:sticky xl:top-32 xl:self-start">
            {selected ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[.18em] text-imetro-gold">Detalhe da mensagem</p>
                      <h2 className="mt-2 break-words text-base font-black text-slate-950">{labelType(selected.type)}</h2>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{selected.studentName || 'Estudante não informado'}</p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm shadow-[0_14px_38px_rgba(15,23,42,.04)]">
                  <Line label="Cobrança" value={selected.chargeCode || '-'} />
                  <Line label="Contacto" value={selected.recipientPhone || '-'} />
                  <Line label="Criado em" value={normalizeDateTime(selected.createdAt)} />
                  <Line label="ID do provedor" value={selected.providerMessageId || '-'} />
                </div>
                {selected.failureReason ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-black">Motivo da falha</p><p className="mt-1 leading-6">{selected.failureReason}</p></div> : null}
                {selected.body ? <div className="rounded-3xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><p className="font-black text-slate-900">Conteúdo</p><p className="mt-2 whitespace-pre-wrap leading-6">{selected.body}</p></div> : null}
                {selectedGuideUrl ? <a href={selectedGuideUrl} target="_blank" rel="noreferrer" className="btn-primary w-full"><FileText size={16} className="mr-2" />Abrir guia PDF</a> : null}
              </div>
            ) : <EmptyState title="Selecione uma mensagem" message="Clique num registro para ver detalhes." />}
          </aside>
        </div>
      ) : (
        <section className="card-premium overflow-hidden">
          <div className="border-b border-slate-100 bg-white/80 p-5">
            <h2 className="text-lg font-black text-imetro-navy">Sessões de atendimento</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Conversas abertas, encerradas e etapas atuais do robô financeiro.</p>
          </div>
          {sessions.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-4 text-left">Telefone</th><th className="px-5 py-4 text-left">Estado</th><th className="px-5 py-4 text-left">Etapa</th><th className="px-5 py-4 text-left">Última mensagem</th><th className="px-5 py-4 text-left">Atualização</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sessions.map((session) => <tr key={session.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-bold text-slate-900">{session.phoneNumber}</td><td className="px-5 py-4"><StatusBadge status={session.status} /></td><td className="px-5 py-4 text-slate-600">{session.currentStep}</td><td className="max-w-md px-5 py-4 text-slate-600">{session.lastMessageText || '-'}</td><td className="px-5 py-4 text-slate-500">{normalizeDateTime(session.updatedAt)}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="Nenhuma sessão carregada" message="Quando a API devolver sessões reais, esta tabela mostrará as conversas do robô." />}
        </section>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${active ? 'bg-imetro-navy text-white shadow-[0_14px_34px_rgba(7,20,45,.16)]' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{children}</button>;
}

function MessageCard({ message, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`w-full rounded-3xl border bg-white p-4 text-left shadow-[0_14px_38px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,.09)] ${active ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(message.status)}`}>{labelStatus(message.status)}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{labelChannel(message.channel)}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{labelType(message.type)}</span></div>
          <p className="mt-3 break-words text-sm font-black text-slate-950">{message.chargeCode || 'Sem cobrança vinculada'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{message.studentName || 'Estudante não informado'}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-left lg:text-right"><p className="flex items-center gap-2 text-sm font-black text-slate-700 lg:justify-end"><Phone size={15} />{message.recipientPhone || 'Sem telefone'}</p><p className="mt-1 text-xs font-semibold text-slate-500">{normalizeDateTime(message.createdAt)}</p></div>
      </div>
      {message.failureReason ? <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{message.failureReason}</p> : null}
    </button>
  );
}

function Line({ label, value }) {
  return <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 first:pt-0 last:border-b-0 last:pb-0"><span className="shrink-0 font-semibold text-slate-500">{label}</span><span className="min-w-0 break-words text-right font-bold text-slate-800">{value}</span></div>;
}
