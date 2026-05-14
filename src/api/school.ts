import request from './request';

export function getSchoolsApi(params?: { page?: number; pageSize?: number; server?: string }) {
  return request.get('/schools', { params });
}

export function getSchoolApi(id: number) {
  return request.get(`/schools/${id}`);
}

export function createSchoolApi(data: { name: string; server: string; power?: number; master_name?: string }) {
  return request.post('/schools', data);
}

export function updateSchoolApi(id: number, data: { name?: string; server?: string; power?: number; master_name?: string }) {
  return request.put(`/schools/${id}`, data);
}

export function deleteSchoolApi(id: number) {
  return request.delete(`/schools/${id}`);
}
