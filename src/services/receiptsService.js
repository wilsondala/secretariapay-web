import api from './api.js';
import { env } from '../config/env.js';

const RECEIPT_ENDPOINT_CANDIDATES = [
  '/api/v1/receipts',
  '/api/v1/financial/receipts',
  '/api/v1/secretariapay/receipts',
];

async function firstSuccessful(requestFactory) {
  let lastError;
  for (const endpoint of RECEIPT_ENDPOINT_CANDIDATES) {
    try {
      const response = await requestFactory(endpoint);
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 405) throw error;
    }
  }
  throw lastError || new Error('Endpoint de recibos não disponível.');
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.receipts)) return data.receipts;
  return [];
}

export async function listReceipts() {
  const data = await firstSuccessful((endpoint) => api.get(endpoint));
  return asList(data);
}

export async function listReceiptsByStudent(studentId) {
  const data = await firstSuccessful((endpoint) => api.get(`${endpoint}/student/${studentId}`));
  return asList(data);
}

export async function getReceipt(id) {
  return firstSuccessful((endpoint) => api.get(`${endpoint}/${id}`));
}

export function receiptPdfUrl(receipt) {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const code = receipt?.receiptCode || receipt?.receipt_code || receipt?.code;
  const id = receipt?.id;
  if (receipt?.pdfUrl || receipt?.pdf_url) return receipt.pdfUrl || receipt.pdf_url;
  if (code) return `${base}/api/v1/public/receipts/${code}/pdf`;
  if (id) return `${base}/api/v1/receipts/${id}/pdf`;
  return null;
}
