import { loadDashboardSummary } from './dashboardService.js';
import { listNotificationLogs } from './operationsService.js';
import { fetchWhatsappMessages } from './whatsappService.js';

function statusOf(value) {
  return String(value || '').toUpperCase();
}

function isRecent(value, hours = 24) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000;
}

function firstDate(item) {
  return item?.createdAt || item?.created_at || item?.sentAt || item?.sent_at || item?.updatedAt || item?.updated_at;
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}-${item.title}-${item.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadTopbarAlerts() {
  const [summary, notificationLogs, whatsappResult] = await Promise.all([
    loadDashboardSummary().catch(() => null),
    listNotificationLogs().catch(() => []),
    fetchWhatsappMessages({ limit: 80 }).catch(() => ({ messages: [] })),
  ]);

  const messages = Array.isArray(whatsappResult?.messages) ? whatsappResult.messages : [];
  const failedNotifications = notificationLogs.filter((log) => statusOf(log.status) === 'FAILED');
  const preparedNotifications = notificationLogs.filter((log) => ['PREPARED', 'PENDING'].includes(statusOf(log.status)));
  const whatsappFailures = messages.filter((message) => ['FAILED', 'ERROR', 'SKIPPED', 'SKIPPED_NO_CONTACT'].includes(statusOf(message.status || message.dispatchStatus)));
  const whatsappPending = messages.filter((message) => ['PENDING', 'PROCESSING'].includes(statusOf(message.status || message.dispatchStatus)));
  const recentMessages = messages.filter((message) => isRecent(firstDate(message), 24));

  const pendingProofs = Number(summary?.pendingProofs || 0);
  const overdueCharges = Number(summary?.overdueCharges || 0);
  const noContactStudents = Number(summary?.noContactStudents || 0);

  const items = uniqueItems([
    failedNotifications.length ? {
      type: 'critical',
      title: `${failedNotifications.length} notificação(ões) com falha`,
      description: 'Verifique e-mail, WhatsApp ou SMS nas operações institucionais.',
      path: '/operations',
    } : null,
    whatsappFailures.length ? {
      type: 'critical',
      title: `${whatsappFailures.length} mensagem(ns) WhatsApp com falha`,
      description: 'Há mensagens que exigem atenção da DCR.',
      path: '/whatsapp',
    } : null,
    pendingProofs ? {
      type: 'warning',
      title: `${pendingProofs} comprovativo(s) pendente(s)`,
      description: 'Comprovativos aguardam validação operacional.',
      path: '/proofs',
    } : null,
    overdueCharges ? {
      type: 'warning',
      title: `${overdueCharges} mensalidade(s) vencida(s)`,
      description: 'Cobranças em atraso precisam de acompanhamento.',
      path: '/charges',
    } : null,
    noContactStudents ? {
      type: 'warning',
      title: `${noContactStudents} estudante(s) sem contacto`,
      description: 'Cadastro incompleto pode impedir notificações automáticas.',
      path: '/students',
    } : null,
    preparedNotifications.length ? {
      type: 'info',
      title: `${preparedNotifications.length} aviso(s) preparado(s)`,
      description: 'Há notificações preparadas/pendentes no módulo operacional.',
      path: '/operations',
    } : null,
    whatsappPending.length ? {
      type: 'info',
      title: `${whatsappPending.length} mensagem(ns) em processamento`,
      description: 'Envios aguardando confirmação do provedor.',
      path: '/whatsapp',
    } : null,
    recentMessages.length ? {
      type: 'success',
      title: `${recentMessages.length} mensagem(ns) recente(s)`,
      description: 'Movimento registrado no WhatsApp financeiro nas últimas 24h.',
      path: '/whatsapp',
    } : null,
  ].filter(Boolean));

  const actionCount = failedNotifications.length
    + whatsappFailures.length
    + pendingProofs
    + overdueCharges
    + noContactStudents
    + preparedNotifications.length
    + whatsappPending.length;

  return {
    count: actionCount,
    recentMessages: recentMessages.length,
    hasRecentMessages: recentMessages.length > 0,
    items,
    lastUpdatedAt: new Date().toISOString(),
  };
}
