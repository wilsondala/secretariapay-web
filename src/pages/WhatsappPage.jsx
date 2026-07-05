import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  Send,
  Smartphone,
  UserRound,
  XCircle,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { fetchWhatsappMessages, fetchWhatsappSessions } from '../services/whatsappService.js';
import {
  normalizeDateTime,
  getStudentName,
  safeText,
} from '../utils/formatters.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://secretariapay-api.paixaoangola.com';

const fallbackMessages = [
  {
    id: 'demo-wpp-1',
    channel: 'WHATSAPP',
    type: 'PAYMENT_GUIDE',
    status: 'SENT',
    recipientPhone: '+244954485547',
    chargeCode: 'IMT-PROPINA-2026_07-20200629',
    providerMessageId: 'wamid.demo-angola',
    studentName: 'Yasser Nahari Quianica Coimbra',
    createdAt: new Date().toISOString(),
    demo: true,
  },
  {
    id: 'demo-wpp-2',
    channel: 'WHATSAPP',
    type: 'PAYMENT_GUIDE',
    status: 'SENT',
    recipientPhone: '+5511915102566',
    chargeCode: 'IMT-PROPINA-2026_07-20200925',
    providerMessageId: 'wamid.demo-brasil',
    studentName: 'Maludi Adélia André Bernardo',
    createdAt: new Date().toISOString(),
    demo: true,
  },
  {
    id: 'demo-wpp-3',
    channel: 'WHATSAPP',
    type: 'PAYMENT_GUIDE',
    status: 'SKIPPED_NO_CONTACT',
    recipientPhone: '',
    chargeCode: 'IMT-PROPINA-2026_07-20230294',
    failureReason: 'Estudante sem contacto oficial cadastrado.',
    studentName: 'Luísa Mbala Sebastião',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    demo: true,
  },
];

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

function SummaryCard({ icon: Icon, label, value, description, className = '' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-base font-black text-slate-900">{value}</p>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
        </div>
        <div className={`rounded-xl p-3 ${className || 'bg-imetro-navy/10 text-imetro-navy'}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
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

      const normalizedMessages = (messageResult.messages.length ? messageResult.messages : fallbackMessages).map(normalizeMessage);
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
      setError(err?.response?.data?.message || err?.message || 'Não foi possível carregar o histórico do WhatsApp.');
      const fallback = fallbackMessages.map(normalizeMessage);
      setMessages(fallback);
      setSelected(fallback[0] || null);
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

      return [
        message.chargeCode,
        message.recipientPhone,
        message.providerMessageId,
        message.failureReason,
        message.studentName,
        message.type,
        message.status,
      ]
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

  const selectedGuideUrl = selected?.chargeCode
    ? `${API_BASE_URL}/api/v1/public/payment-guides/${selected.chargeCode}/pdf`
    : null;

  if (loading) return <LoadingState title="Carregando histórico do WhatsApp" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl bg-imetro-navy p-4 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-imetro-gold">DCR · Atendimento digital</p>
          <h1 className="mt-2 text-base font-black">WhatsApp e histórico de mensagens</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Controle das guias enviadas, mensagens falhadas, contactos oficiais e sessões de atendimento do IMETRO.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-imetro-navy hover:bg-imetro-gold"
        >
          <RefreshCcw size={18} />
          Atualizar
        </button>
      </div>

      {!endpointInfo.available ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-black">Endpoint real de mensagens ainda não disponível no backend.</p>
              <p className="mt-1">
                A tela está pronta e exibindo dados demonstrativos. Para dados reais, criar no backend um endpoint como
                <span className="font-mono"> GET /api/v1/admin/whatsapp/messages</span> retornando os registros de mensagens.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <ErrorState title="Falha ao carregar dados" message={error} onRetry={loadData} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={MessageCircle} label="Mensagens" value={summary.total} description="Total carregado" />
        <SummaryCard icon={CheckCircle2} label="Enviadas" value={summary.sent} description="Enviado, entregue ou lido" className="bg-emerald-50 text-emerald-700" />
        <SummaryCard icon={XCircle} label="Falhadas" value={summary.failed} description="Ação DCR necessária" className="bg-red-50 text-red-700" />
        <SummaryCard icon={AlertTriangle} label="Sem contacto" value={summary.skipped} description="Cadastro incompleto" className="bg-amber-50 text-amber-700" />
        <SummaryCard icon={FileText} label="Guias" value={summary.guides} description="Guias de pagamento" className="bg-blue-50 text-blue-700" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'messages' ? 'bg-imetro-navy text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          Mensagens
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`rounded-xl px-4 py-2 text-sm font-black ${activeTab === 'sessions' ? 'bg-imetro-navy text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          Sessões WhatsApp
        </button>
      </div>

      {activeTab === 'messages' ? (
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_180px]">
                <label className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    placeholder="Buscar por estudante, telefone, cobrança, falha ou provider ID"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-imetro-navy"
                  />
                </label>

                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-imetro-navy"
                >
                  {filterOptions.status.map((option) => (
                    <option key={option} value={option}>{labelFilterOption('status', option)}</option>
                  ))}
                </select>

                <select
                  value={filters.channel}
                  onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value }))}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-imetro-navy"
                >
                  {filterOptions.channel.map((option) => (
                    <option key={option} value={option}>{labelFilterOption('channel', option)}</option>
                  ))}
                </select>

                <select
                  value={filters.type}
                  onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-imetro-navy"
                >
                  {filterOptions.type.map((option) => (
                    <option key={option} value={option}>{labelFilterOption('type', option)}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredMessages.length ? (
              <div className="divide-y divide-slate-100">
                {filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelected(message)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${selected?.id === message.id ? 'bg-imetro-navy/5' : ''}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(message.status)}`}>{labelStatus(message.status)}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{labelChannel(message.channel)}</span>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{labelType(message.type)}</span>
                        </div>
                        <p className="mt-3 truncate text-base font-black text-slate-900">{message.chargeCode || 'Sem cobrança vinculada'}</p>
                        <p className="mt-1 text-sm text-slate-500">{message.studentName || 'Estudante não informado'}</p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="flex items-center gap-2 text-sm font-bold text-slate-700 lg:justify-end"><Phone size={15} />{message.recipientPhone || 'Sem telefone'}</p>
                        <p className="mt-1 text-xs text-slate-500">{normalizeDateTime(message.createdAt)}</p>
                      </div>
                    </div>
                    {message.failureReason ? <p className="mt-2 text-sm font-semibold text-red-600">{message.failureReason}</p> : null}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhuma mensagem encontrada" message="Ajuste os filtros para ver outros registos." />
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Detalhe da mensagem</p>
                    <h2 className="mt-1 text-base font-black text-slate-900">{labelType(selected.type)}</h2>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400">Cobrança</p>
                  <p className="mt-1 break-all text-sm font-black text-slate-900">{selected.chargeCode || '-'}</p>
                </div>

                <div className="grid gap-3 text-sm">
                  <InfoRow icon={UserRound} label="Estudante" value={selected.studentName || '-'} />
                  <InfoRow icon={Smartphone} label="Contacto" value={selected.recipientPhone || '-'} />
                  <InfoRow icon={Clock3} label="Criado em" value={normalizeDateTime(selected.createdAt)} />
                  <InfoRow icon={Send} label="Provider ID" value={selected.providerMessageId || '-'} />
                </div>

                {selected.failureReason ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-black">Motivo da falha</p>
                    <p className="mt-1">{selected.failureReason}</p>
                  </div>
                ) : null}

                {selected.body ? (
                  <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                    <p className="font-black text-slate-900">Conteúdo</p>
                    <p className="mt-2 whitespace-pre-wrap">{selected.body}</p>
                  </div>
                ) : null}

                {selectedGuideUrl ? (
                  <a
                    href={selectedGuideUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-imetro-navy px-4 py-3 text-sm font-black text-white hover:bg-imetro-gold hover:text-imetro-navy"
                  >
                    <FileText size={18} />
                    Abrir guia PDF
                  </a>
                ) : null}
              </div>
            ) : (
              <EmptyState title="Selecione uma mensagem" message="Clique num registo para ver detalhes." />
            )}
          </aside>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-black text-slate-900">Sessões de atendimento</h2>
            <p className="mt-1 text-sm text-slate-500">Conversas abertas, encerradas e etapas atuais do robô.</p>
          </div>

          {sessions.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Telefone</th>
                    <th className="px-5 py-4 text-left">Estado</th>
                    <th className="px-5 py-4 text-left">Etapa</th>
                    <th className="px-5 py-4 text-left">Última mensagem</th>
                    <th className="px-5 py-4 text-left">Atualização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">{session.phoneNumber}</td>
                      <td className="px-5 py-4"><StatusBadge status={session.status} /></td>
                      <td className="px-5 py-4 text-slate-600">{session.currentStep}</td>
                      <td className="max-w-md px-5 py-4 text-slate-600">{session.lastMessageText || '-'}</td>
                      <td className="px-5 py-4 text-slate-500">{normalizeDateTime(session.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Nenhuma sessão carregada"
              message="Quando o endpoint de sessões estiver disponível, esta tabela mostrará as conversas do robô."
            />
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
      <Icon className="mt-0.5 text-imetro-navy" size={18} />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 break-words font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
