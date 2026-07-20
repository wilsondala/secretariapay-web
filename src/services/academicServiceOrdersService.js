import api from './api.js';

const BASE_URL = '/api/v1/academic-service-orders';

export async function listAcademicServiceOrders({ status = '', studentId = '' } = {}) {
  const params = {};
  if (status) params.status = status;
  if (studentId) params.studentId = studentId;
  const { data } = await api.get(BASE_URL, { params });
  return Array.isArray(data) ? data : [];
}

export async function listAcademicServiceOrderArchive() {
  const { data } = await api.get(`${BASE_URL}/archive`);
  return Array.isArray(data) ? data : [];
}

export async function createAcademicServiceOrder(payload) {
  const { data } = await api.post(BASE_URL, payload);
  return data;
}

export async function requestAcademicServiceOrderPayment(id, dueDate) {
  const { data } = await api.post(`${BASE_URL}/${id}/request-payment`, dueDate ? { dueDate } : null);
  return data;
}

async function postAction(id, action, payload = null) {
  const { data } = await api.post(`${BASE_URL}/${id}/${action}`, payload);
  return data;
}

function showPickupEmailFeedback(message) {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  }
}

export const generateAcademicServiceOrderDocument = (id) => postAction(id, 'generate-document');
export const markAcademicServiceOrderReadyForPrint = (id) => postAction(id, 'ready-for-print');
export const markAcademicServiceOrderPrinted = (id) => postAction(id, 'print');
export const submitAcademicServiceOrderSignature = (id) => postAction(id, 'submit-signature');
export const signAcademicServiceOrder = (id) => postAction(id, 'sign');
export const markAcademicServiceOrderReadyForPickup = (id, payload) => postAction(id, 'ready-for-pickup', payload);
export const sendAcademicServiceOrderPickupWhatsapp = (id) => postAction(id, 'send-pickup-whatsapp');

export async function sendAcademicServiceOrderPickupEmail(id) {
  try {
    const result = await postAction(id, 'send-pickup-email');
    if (result?.sent) {
      showPickupEmailFeedback(`E-mail de levantamento enviado para ${result.recipient || 'o endereço cadastrado'}.`);
    } else {
      showPickupEmailFeedback(result?.detail || `O e-mail não foi enviado. Estado do canal: ${result?.status || 'indisponível'}.`);
    }
    return result;
  } catch (error) {
    const message = error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || 'Não foi possível enviar o e-mail de levantamento.';
    showPickupEmailFeedback(message);
    throw error;
  }
}

export const deliverAcademicServiceOrder = (id, payload) => postAction(id, 'deliver', payload);
