import api from './api.js';

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function buildParams(filters = {}) {
  const params = {};
  if (filters.status && filters.status !== 'ALL') params.status = filters.status;
  if (filters.channel && filters.channel !== 'ALL') params.channel = filters.channel;
  if (filters.type && filters.type !== 'ALL') params.type = filters.type;
  if (filters.chargeCode) params.chargeCode = filters.chargeCode;
  if (filters.phone) params.phone = filters.phone;
  if (filters.limit) params.limit = filters.limit;
  return params;
}

async function tryGet(endpoints, options = {}) {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint, options);
      return {
        data: response.data,
        endpoint,
        available: true,
      };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 400) {
        try {
          const response = await api.get(endpoint);
          return {
            data: response.data,
            endpoint,
            available: true,
          };
        } catch (retryError) {
          lastError = retryError;
        }
      }

      if (status && ![400, 404, 405].includes(status)) {
        throw error;
      }
    }
  }

  return {
    data: [],
    endpoint: null,
    available: false,
    error: lastError,
  };
}

export async function fetchWhatsappMessages(filters = {}) {
  const result = await tryGet(
    [
      '/api/v1/admin/whatsapp/messages',
      '/api/v1/secretariapay/whatsapp/messages',
      '/api/v1/secretariapay/messages',
      '/api/v1/whatsapp/messages',
      '/api/v1/messages/whatsapp',
    ],
    { params: buildParams(filters) },
  );

  return {
    messages: asArray(result.data),
    endpoint: result.endpoint,
    available: result.available,
  };
}

export async function fetchWhatsappSessions(filters = {}) {
  const result = await tryGet(
    [
      '/api/v1/admin/whatsapp/sessions',
      '/api/v1/secretariapay/whatsapp/sessions',
      '/api/v1/whatsapp/sessions',
    ],
    { params: buildParams(filters) },
  );

  return {
    sessions: asArray(result.data),
    endpoint: result.endpoint,
    available: result.available,
  };
}

export async function resendPaymentGuide(chargeId) {
  const endpoints = [
    `/api/v1/secretariapay/financial-flow/charges/${chargeId}/send-guide`,
    `/api/v1/admin/charges/${chargeId}/send-guide`,
    `/api/v1/charges/${chargeId}/send-guide`,
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, {});
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 400) {
        try {
          const response = await api.get(endpoint);
          return {
            data: response.data,
            endpoint,
            available: true,
          };
        } catch (retryError) {
          lastError = retryError;
        }
      }

      if (status && ![400, 404, 405].includes(status)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Endpoint de reenvio de guia não disponível.');
}
