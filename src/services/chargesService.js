import api from './api.js';
import { env } from '../config/env.js';
import { getStoredSession } from './authService.js';
import { can } from '../shared/auth/permissions.js';

const CHARGES_ENDPOINT = '/api/v1/charges';
const TUITION_ENDPOINT = '/api/v1/imetro/tuition-charges';
const FINANCIAL_FLOW_ENDPOINT = '/api/v1/secretariapay/financial-flow';
const PUBLIC_PAYMENT_GUIDES_ENDPOINT = '/api/v1/public/payment-guides';

function requireAction(action, message) {
  const { user } = getStoredSession();
  if (!can(user, action)) {
    const error = new Error(message || 'O seu perfil não possui permissão para executar esta ação.');
    error.code = 'FORBIDDEN_ACTION';
    throw error;
  }
}

function requireValue(value, message) {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new Error(message);
  }
  return value;
}

export async function listCharges() {
  const response = await api.get(CHARGES_ENDPOINT);
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function getCharge(id) {
  requireValue(id, 'O identificador da cobrança é obrigatório.');
  const response = await api.get(`${CHARGES_ENDPOINT}/${id}`);
  return response.data;
}

export async function listChargesByStudent(studentId) {
  requireValue(studentId, 'O identificador do estudante é obrigatório.');
  const response = await api.get(`${CHARGES_ENDPOINT}/student/${studentId}`);
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function listChargesByStatus(status) {
  requireValue(status, 'O estado da cobrança é obrigatório.');
  const response = await api.get(`${CHARGES_ENDPOINT}/status/${status}`);
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function confirmChargePayment(id) {
  requireAction('manageCharges', 'O seu perfil não pode confirmar pagamentos manualmente.');
  requireValue(id, 'O identificador da cobrança é obrigatório.');
  const response = await api.patch(`${CHARGES_ENDPOINT}/${id}/confirm-payment`);
  return response.data;
}

export async function cancelCharge(id) {
  requireAction('manageCharges', 'O seu perfil não pode cancelar cobranças.');
  requireValue(id, 'O identificador da cobrança é obrigatório.');
  const response = await api.patch(`${CHARGES_ENDPOINT}/${id}/cancel`);
  return response.data;
}

export async function sendIndividualGuide(chargeId) {
  requireAction('sendWhatsapp', 'O seu perfil não pode enviar guias aos estudantes.');
  requireValue(chargeId, 'O identificador da cobrança é obrigatório para enviar a guia.');
  const response = await api.post(`${FINANCIAL_FLOW_ENDPOINT}/charges/${chargeId}/send-guide`);
  return response.data;
}

export async function generateTuitionCharges(payload) {
  requireAction('generateMonthlyCharges', 'O seu perfil não pode gerar propinas.');
  const response = await api.post(`${TUITION_ENDPOINT}/generate`, payload);
  return response.data;
}

export async function sendTuitionGuides(payload = {}) {
  requireAction('sendWhatsapp', 'O seu perfil não pode executar envio de guias em lote.');

  const request = {
    institutionId: requireValue(payload.institutionId, 'A instituição é obrigatória para o envio em lote.'),
    referenceMonth: payload.referenceMonth || null,
    status: payload.status || 'PENDING',
    chargeCodePrefix: payload.chargeCodePrefix || 'IMT-PROPINA-',
    chargeIds: Array.isArray(payload.chargeIds) && payload.chargeIds.length ? payload.chargeIds : null,
    onlyPending: payload.onlyPending !== false,
    sendWhatsapp: payload.sendWhatsapp !== false,
    sendEmail: payload.sendEmail !== false,
    sendSms: payload.sendSms === true,
    maxItems: Number.isFinite(Number(payload.maxItems)) ? Number(payload.maxItems) : 50,
  };

  const response = await api.post(`${TUITION_ENDPOINT}/send-guides`, request);
  return response.data;
}

export function paymentGuidePdfUrl(chargeCode) {
  requireValue(chargeCode, 'O código da cobrança é obrigatório para abrir a guia.');
  const base = env.apiBaseUrl.replace(/\/$/, '');
  return `${base}${PUBLIC_PAYMENT_GUIDES_ENDPOINT}/${encodeURIComponent(chargeCode)}/pdf`;
}
