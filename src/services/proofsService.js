import api from './api.js';
import { getStoredSession } from './authService.js';

const PROOF_ENDPOINT_CANDIDATES = [
  '/api/v1/payment-proofs',
  '/api/v1/proofs',
  '/api/v1/secretariapay/payment-proofs',
];

async function firstSuccessful(requestFactory) {
  const response = await firstSuccessfulResponse(requestFactory);
  return response.data;
}

async function firstSuccessfulResponse(requestFactory) {
  let lastError;
  for (const endpoint of PROOF_ENDPOINT_CANDIDATES) {
    try {
      return await requestFactory(endpoint);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 405) throw error;
    }
  }
  throw lastError || new Error('Endpoint de comprovativos não disponível.');
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.proofs)) return data.proofs;
  return [];
}

function getCurrentUserId() {
  const session = getStoredSession();
  const user = session?.user || {};

  return user.id || user.userId || user.uuid || user.sub || null;
}

function buildReviewPayload(payload = {}, fallbackNote = '') {
  const reviewNote = payload.reviewNote || payload.notes || payload.reason || fallbackNote;
  const reviewedByUserId = payload.reviewedByUserId || payload.reviewerId || payload.userId || getCurrentUserId();
  const body = { reviewNote };

  if (reviewedByUserId) {
    body.reviewedByUserId = reviewedByUserId;
  }

  return body;
}

export async function listPaymentProofs() {
  const data = await firstSuccessful((endpoint) => api.get(endpoint));
  return asList(data);
}

export async function listPaymentProofsByStatus(status) {
  const data = await firstSuccessful((endpoint) => api.get(`${endpoint}/status/${status}`));
  return asList(data);
}

export async function openPaymentProofAttachment(id) {
  const response = await firstSuccessfulResponse((endpoint) => api.get(`${endpoint}/${id}/attachment`, { responseType: 'blob' }));
  const contentType = response.headers?.['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function approvePaymentProof(id, payload = {}) {
  return firstSuccessful((endpoint) => api.patch(
    `${endpoint}/${id}/approve`,
    buildReviewPayload(payload, 'Aprovado pela DCR no painel.'),
  ));
}

export async function rejectPaymentProof(id, payload = {}) {
  return firstSuccessful((endpoint) => api.patch(
    `${endpoint}/${id}/reject`,
    buildReviewPayload(payload, 'Comprovativo rejeitado pela DCR.'),
  ));
}

export async function markPaymentProofUnderReview(id, payload = {}) {
  return firstSuccessful((endpoint) => api.patch(`${endpoint}/${id}/under-review`, payload));
}
