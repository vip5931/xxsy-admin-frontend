import request from './request';

export function getRanksApi(params?: { page?: number; pageSize?: number; server?: string; profession?: string }) {
  return request.get('/ranks', { params });
}

export function getRankApi(id: number) {
  return request.get(`/ranks/${id}`);
}

export function createRankApi(data: { role_name: string; server_name: string; profession?: string; combat_power?: number }) {
  return request.post('/ranks', data);
}

export function updateRankApi(id: number, data: { role_name?: string; profession?: string; combat_power?: number }) {
  return request.put(`/ranks/${id}`, data);
}

export function deleteRankApi(id: number) {
  return request.delete(`/ranks/${id}`);
}
