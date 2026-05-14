import request from './request';

export function getProfessionsApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/professions', { params });
}

export function getAllProfessionsApi() {
  return request.get('/professions/all');
}

export function getProfessionApi(id: number) {
  return request.get(`/professions/${id}`);
}

export function createProfessionApi(data: { name: string }) {
  return request.post('/professions', data);
}

export function updateProfessionApi(id: number, data: { name?: string }) {
  return request.put(`/professions/${id}`, data);
}

export function deleteProfessionApi(id: number) {
  return request.delete(`/professions/${id}`);
}
