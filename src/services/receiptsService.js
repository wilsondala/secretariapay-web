import api from './api.js';
import { env } from '../config/env.js';

const RECEIPTS_ENDPOINT = '/api/v1/receipts';
const PUBLIC_RECEIPTS_ENDPOINT = '/api/v1/public/receipts';

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.receipts)) return data.receipts;
  return [];
}

function requireReceiptId(id) {
  if (!id) throw new Error('Identificador do recibo não informado.');
  return encodeURIComponent(String(id));
}

function requireReceiptCode(code) {
  const value = String(code || '').trim();
  if (!value) throw new Error('Código do recibo não informado.');
  return encodeURIComponent(value);
}

export async function listReceipts() {
  const response = await api.get(RECEIPTS_ENDPOINT);
  return asList(response.data);
}

export async function listReceiptsByStudent(studentId) {
  const id = requireReceiptId(studentId);
  const response = await api.get(`${RECEIPTS_ENDPOINT}/student/${id}`);
  return asList(response.data);
}

export async function getReceipt(id) {
  const response = await api.get(`${RECEIPTS_ENDPOINT}/${requireReceiptId(id)}`);
  return response.data;
}

export async function getReceiptByCode(receiptCode) {
  const response = await api.get(`${RECEIPTS_ENDPOINT}/code/${requireReceiptCode(receiptCode)}`);
  return response.data;
}

export function receiptPdfUrl(receipt) {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const code = receipt?.receiptCode || receipt?.receipt_code || receipt?.code;
  if (receipt?.pdfUrl || receipt?.pdf_url) return receipt.pdfUrl || receipt.pdf_url;
  if (!code) return null;
  return `${base}${PUBLIC_RECEIPTS_ENDPOINT}/${requireReceiptCode(code)}/pdf`;
}
