import api from './api.js';

const BASE_URL = '/api/v1/academic-services';

export async function listAcademicServices({ activeOnly = false, category = '' } = {}) {
  const params = { activeOnly };
  if (category) params.category = category;
  const { data } = await api.get(BASE_URL, { params });
  return Array.isArray(data) ? data : [];
}

export async function saveAcademicService(payload) {
  if (payload.id) {
    const { id, ...body } = payload;
    const { data } = await api.put(`${BASE_URL}/${id}`, body);
    return data;
  }
  const { data } = await api.post(BASE_URL, payload);
  return data;
}

export async function setAcademicServiceActive(id, active) {
  const { data } = await api.patch(`${BASE_URL}/${id}/active`, null, { params: { active } });
  return data;
}
