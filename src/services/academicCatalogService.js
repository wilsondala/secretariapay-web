import api from './api.js';

export async function fetchCourses(institutionId) {
  const { data } = await api.get(`/api/v1/academic-catalog/institutions/${institutionId}/courses`);
  return Array.isArray(data) ? data : [];
}

export async function saveCourse(payload) {
  if (payload.id) {
    const { data } = await api.put(`/api/v1/academic-catalog/courses/${payload.id}`, payload);
    return data;
  }
  const { data } = await api.post('/api/v1/academic-catalog/courses', payload);
  return data;
}

export async function fetchClasses(institutionId) {
  const { data } = await api.get(`/api/v1/academic-catalog/institutions/${institutionId}/classes`);
  return Array.isArray(data) ? data : [];
}

export async function saveClass(payload) {
  if (payload.id) {
    const { data } = await api.put(`/api/v1/academic-catalog/classes/${payload.id}`, payload);
    return data;
  }
  const { data } = await api.post('/api/v1/academic-catalog/classes', payload);
  return data;
}
