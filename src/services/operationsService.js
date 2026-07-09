import api from './api.js';

export async function getOperationsReadiness() {
  const { data } = await api.get('/api/v1/admin/operations/readiness');
  return data;
}

export async function generateMonthlyCharges(payload) {
  const { data } = await api.post('/api/v1/admin/operations/monthly-charges/generate', payload || {});
  return data;
}

export async function runFinancialNotifications() {
  const { data } = await api.post('/api/v1/admin/operations/notifications/run');
  return data;
}

export async function listNotificationLogs() {
  const { data } = await api.get('/api/v1/admin/operations/notifications/logs');
  return Array.isArray(data) ? data : [];
}

export async function listAuditLogs() {
  const { data } = await api.get('/api/v1/admin/operations/audit/logs');
  return Array.isArray(data) ? data : [];
}

export async function listPaymentTransactions() {
  const { data } = await api.get('/api/v1/admin/operations/payments/transactions');
  return Array.isArray(data) ? data : [];
}
