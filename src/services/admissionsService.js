import api from './api.js';

const BASE_URL = '/api/v1/admissions';
const PUBLIC_BASE_URL = '/api/v1/public/admissions';

export async function getOfficialAdmissionsCatalog(institutionId) {
  const { data } = await api.get(`${PUBLIC_BASE_URL}/catalog`, { params: { institutionId } });
  return data;
}

export async function createPublicAdmissionApplication(payload) {
  const { data } = await api.post(`${PUBLIC_BASE_URL}/applications`, payload);
  return data;
}

export async function getPublicAdmissionPaymentStatus(applicationCode, documentNumber) {
  const { data } = await api.post(
    `${PUBLIC_BASE_URL}/applications/${encodeURIComponent(applicationCode)}/payment/status`,
    { documentNumber },
  );
  return data;
}

export async function issuePublicAdmissionPayment(applicationCode, documentNumber) {
  const { data } = await api.post(
    `${PUBLIC_BASE_URL}/applications/${encodeURIComponent(applicationCode)}/payment`,
    { documentNumber },
  );
  return data;
}

export async function downloadPublicAdmissionPaymentGuide(applicationCode, documentNumber) {
  const response = await api.post(
    `${PUBLIC_BASE_URL}/applications/${encodeURIComponent(applicationCode)}/payment-guide`,
    { documentNumber },
    { responseType: 'blob' },
  );
  return response.data;
}

export async function submitPublicAdmissionPaymentProof(applicationCode, payload) {
  const { data } = await api.post(
    `${PUBLIC_BASE_URL}/applications/${encodeURIComponent(applicationCode)}/payment-proof`,
    payload,
  );
  return data;
}

export async function uploadPublicAdmissionPaymentProof(applicationCode, documentNumber, file) {
  const formData = new FormData();
  formData.append('documentNumber', documentNumber);
  formData.append('file', file);

  const { data } = await api.post(
    `${PUBLIC_BASE_URL}/applications/${encodeURIComponent(applicationCode)}/payment-proof/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function listAdmissionLeads({ institutionId, status = '' }) {
  const params = { institutionId };
  if (status) params.status = status;
  const { data } = await api.get(`${BASE_URL}/leads`, { params });
  return Array.isArray(data) ? data : [];
}

export async function createAdmissionLead(payload) {
  const { data } = await api.post(`${BASE_URL}/leads`, payload);
  return data;
}

export async function updateAdmissionLeadStatus(leadId, status, notes = '') {
  const params = { status };
  if (notes) params.notes = notes;
  const { data } = await api.patch(`${BASE_URL}/leads/${leadId}/status`, null, { params });
  return data;
}

export async function listAdmissionApplications({ institutionId, status = '', courseId = '', shift = '' }) {
  const params = { institutionId };
  if (status) params.status = status;
  if (courseId) params.courseId = courseId;
  if (shift) params.shift = shift;
  const { data } = await api.get(`${BASE_URL}/applications`, { params });
  return Array.isArray(data) ? data : [];
}

export async function createAdmissionApplication(payload) {
  const { data } = await api.post(`${BASE_URL}/applications`, payload);
  return data;
}

export async function getAdmissionApplication(applicationId) {
  const { data } = await api.get(`${BASE_URL}/applications/${applicationId}`);
  return data;
}

export async function submitAdmissionApplication(applicationId) {
  const { data } = await api.post(`${BASE_URL}/applications/${applicationId}/submit`);
  return data;
}

export async function updateAdmissionApplicationStatus(applicationId, payload) {
  const { data } = await api.patch(`${BASE_URL}/applications/${applicationId}/status`, payload);
  return data;
}

export async function reviewAdmissionDocuments(applicationId, payload) {
  const { data } = await api.patch(`${BASE_URL}/applications/${applicationId}/documents`, payload);
  return data;
}

export async function issueAdmissionInvoice(applicationId, payload) {
  const { data } = await api.post(`${BASE_URL}/applications/${applicationId}/invoice`, payload);
  return data;
}

export async function submitAdmissionPaymentProof(invoiceId, payload) {
  const { data } = await api.post(`${BASE_URL}/invoices/${invoiceId}/payment-proofs`, payload);
  return data;
}

export async function approveAdmissionPaymentProof(proofId, payload) {
  const { data } = await api.post(`${BASE_URL}/payment-proofs/${proofId}/approve`, payload);
  return data;
}

export async function rejectAdmissionPaymentProof(proofId, payload) {
  const { data } = await api.post(`${BASE_URL}/payment-proofs/${proofId}/reject`, payload);
  return data;
}

export async function confirmAdmissionInvoicePayment(invoiceId, payload) {
  const { data } = await api.post(`${BASE_URL}/invoices/${invoiceId}/confirm-payment`, payload);
  return data;
}

export async function getAdmissionsDashboard({ institutionId, courseId = '', shift = '' }) {
  const params = { institutionId };
  if (courseId) params.courseId = courseId;
  if (shift) params.shift = shift;
  const { data } = await api.get(`${BASE_URL}/dashboard`, { params });
  return data;
}
