import api from './api.js';

const PROOF_ENDPOINT_CANDIDATES = [
  '/api/v1/payment-proofs',
  '/api/v1/proofs',
  '/api/v1/secretariapay/payment-proofs',
];

async function firstSuccessful(requestFactory) {
  let lastError;
  for (const endpoint of PROOF_ENDPOINT_CANDIDATES) {
    try {
      const response = await requestFactory(endpoint);
      return response.data;
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

export async function listPaymentProofs() {
  const data = await firstSuccessful((endpoint) => api.get(endpoint));
  return asList(data);
}

export async function listPaymentProofsByStatus(status) {
  const data = await firstSuccessful((endpoint) => api.get(`${endpoint}/status/${status}`));
  return asList(data);
}

export async function approvePaymentProof(id, payload = {}) {
  return firstSuccessful((endpoint) => api.patch(`${endpoint}/${id}/approve`, payload));
}

export async function rejectPaymentProof(id, payload = {}) {
  return firstSuccessful((endpoint) => api.patch(`${endpoint}/${id}/reject`, payload));
}

export async function markPaymentProofUnderReview(id, payload = {}) {
  return firstSuccessful((endpoint) => api.patch(`${endpoint}/${id}/under-review`, payload));
}
