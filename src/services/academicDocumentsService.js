import api from './api.js';

const BASE_URL = '/api/v1/academic-documents';

export async function listAcademicDocuments() {
  const { data } = await api.get(BASE_URL);
  return Array.isArray(data) ? data : [];
}

export async function createDemoDeclaration(payload) {
  const { data } = await api.post(`${BASE_URL}/demo/simple-declaration`, payload);
  return data;
}

export async function updateAcademicDocument(id, payload) {
  const { data } = await api.put(`${BASE_URL}/${id}`, payload);
  return data;
}

export async function markAcademicDocumentReady(id) {
  const { data } = await api.post(`${BASE_URL}/${id}/ready-for-signature`);
  return data;
}

export async function signAcademicDocumentDemo(id) {
  const { data } = await api.post(`${BASE_URL}/${id}/sign-demo`);
  return data;
}

export async function sendAcademicDocumentWhatsapp(id) {
  const { data } = await api.post(`${BASE_URL}/${id}/send-whatsapp`);
  return data;
}

export async function downloadAcademicDocumentPdf(id) {
  const { data } = await api.get(`${BASE_URL}/${id}/pdf`, { responseType: 'blob' });
  return data;
}
