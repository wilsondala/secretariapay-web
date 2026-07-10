import api from './api.js';

export async function fetchAdminUsers() {
  const { data } = await api.get('/api/v1/admin/users');
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminUserRoles() {
  const { data } = await api.get('/api/v1/admin/users/roles');
  return Array.isArray(data) ? data : [];
}

export async function fetchAdminUserStatuses() {
  const { data } = await api.get('/api/v1/admin/users/statuses');
  return Array.isArray(data) ? data : [];
}

export async function createAdminUser(payload) {
  const { data } = await api.post('/api/v1/admin/users', payload);
  return data;
}

export async function updateAdminUser(id, payload) {
  const { data } = await api.put(`/api/v1/admin/users/${id}`, payload);
  return data;
}

export async function changeAdminUserStatus(id, status) {
  const { data } = await api.patch(`/api/v1/admin/users/${id}/status`, null, { params: { status } });
  return data;
}
