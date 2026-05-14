import request from './request';

export function getGameServersApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/game-servers', { params });
}

export function getAllGameServersApi() {
  return request.get('/game-servers/all');
}

export function getGameServerApi(id: number) {
  return request.get(`/game-servers/${id}`);
}

export function createGameServerApi(data: { name: string; code: string; sortOrder?: number; status?: number }) {
  return request.post('/game-servers', data);
}

export function updateGameServerApi(id: number, data: { name?: string; code?: string; sortOrder?: number; status?: number }) {
  return request.put(`/game-servers/${id}`, data);
}

export function deleteGameServerApi(id: number) {
  return request.delete(`/game-servers/${id}`);
}
