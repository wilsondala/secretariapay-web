import api from './api.js';
import { env } from '../config/env.js';

const CHARGES_ENDPOINT = '/api/v1/charges';
const TUITION_ENDPOINT = '/api/v1/imetro/tuition-charges';

export async function listCharges() {
  const response = await api.get(CHARGES_ENDPOINT);
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function getCharge(id) {
  const response = await api.get(`${CHARGES_ENDPOINT}/${id}`);
  return response.data;
}

export async function listChargesByStudent(studentId) {
  const response = await api.get(`${CHARGES_ENDPOINT}/student/${studentId}`);
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function listChargesByStatus(status) {
  const response = await api.get(`${CHARGES_ENDPOINT}/status/${status}`);
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function confirmChargePayment(id) {
  const response = await api.patch(`${CHARGES_ENDPOINT}/${id}/confirm-payment`);
  return response.data;
}

export async function cancelCharge(id) {
  const response = await api.patch(`${CHARGES_ENDPOINT}/${id}/cancel`);
  return response.data;
}

export async function sendIndividualGuide(chargeId) {
  const response = await api.post(`/api/v1/secretariapay/financial-flow/charges/${chargeId}/send-guide`);
  return response.data;
}

export async function generateTuitionCharges(payload) {
  const response = await api.post(`${TUITION_ENDPOINT}/generate`, payload);
  return response.data;
}

export async function sendTuitionGuides(payload) {
  const response = await api.post(`${TUITION_ENDPOINT}/send-guides`, payload);
  return response.data;
}

export function paymentGuidePdfUrl(chargeCode) {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  return `${base}/api/v1/public/payment-guides/${chargeCode}/pdf`;
}
