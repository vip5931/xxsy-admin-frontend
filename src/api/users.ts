import request from './request';

export function getUsersApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/users', { params });
}

export function getUserApi(id: number) {
  return request.get(`/users/${id}`);
}

export function createUserApi(data: any) {
  return request.post('/users', data);
}

export function updateUserApi(id: number, data: any) {
  return request.put(`/users/${id}`, data);
}

export function updateUserStatusApi(id: number, status: number) {
  return request.patch(`/users/${id}/status`, { status });
}

export function assignRolesApi(id: number, roleIds: number[]) {
  return request.put(`/users/${id}/roles`, { roleIds });
}
