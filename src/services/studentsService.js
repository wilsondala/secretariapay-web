import api from './api.js';

const ENDPOINT = '/api/v1/students';

export async function listStudents(params = {}) {
  const response = await api.get(ENDPOINT, { params });
  return Array.isArray(response.data) ? response.data : response.data?.content || [];
}

export async function getStudent(id) {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
}

export async function getStudentByNumber(studentNumber) {
  const response = await api.get(`${ENDPOINT}/number/${studentNumber}`);
  return response.data;
}

export async function updateStudent(id, payload) {
  const response = await api.put(`${ENDPOINT}/${id}`, payload);
  return response.data;
}
