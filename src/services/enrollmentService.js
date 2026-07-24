import api from './api.js';

const BASE_URL = '/api/v1/enrollments';

export async function listEnrollments({ institutionId, requestType = '', status = '' }) {
  const params = { institutionId };
  if (requestType) params.requestType = requestType;
  if (status) params.status = status;
  const { data } = await api.get(BASE_URL, { params });
  return Array.isArray(data) ? data : [];
}

export async function getEnrollment(requestId) {
  const { data } = await api.get(`${BASE_URL}/${requestId}`);
  return data;
}

export async function getEnrollmentDashboard(institutionId) {
  const { data } = await api.get(`${BASE_URL}/dashboard/summary`, { params: { institutionId } });
  return data;
}

export async function createEnrollmentFromAdmission(applicationId, payload) {
  const { data } = await api.post(`${BASE_URL}/from-admission/${applicationId}`, payload);
  return data;
}

export async function createReenrollment(payload) {
  const { data } = await api.post(`${BASE_URL}/reenrollments`, payload);
  return data;
}

export async function submitEnrollmentPaymentProof(invoiceId, payload) {
  const { data } = await api.post(`${BASE_URL}/invoices/${invoiceId}/payment-proofs`, payload);
  return data;
}

export async function approveEnrollmentPaymentProof(proofId, payload) {
  const { data } = await api.post(`${BASE_URL}/payment-proofs/${proofId}/approve`, payload);
  return data;
}

export async function rejectEnrollmentPaymentProof(proofId, payload) {
  const { data } = await api.post(`${BASE_URL}/payment-proofs/${proofId}/reject`, payload);
  return data;
}

export async function confirmEnrollmentPayment(invoiceId, payload) {
  const { data } = await api.post(`${BASE_URL}/invoices/${invoiceId}/confirm-payment`, payload);
  return data;
}
