import request from './request';

export function getRolesApi() {
  return request.get('/roles');
}

export function getRoleApi(id: number) {
  return request.get(`/roles/${id}`);
}

export function createRoleApi(data: any) {
  return request.post('/roles', data);
}

export function updateRoleApi(id: number, data: any) {
  return request.put(`/roles/${id}`, data);
}

export function deleteRoleApi(id: number) {
  return request.delete(`/roles/${id}`);
}

export function getAllPermissionsApi() {
  return request.get('/roles/permissions');
}

export function assignPermissionsApi(id: number, permissionIds: number[]) {
  return request.put(`/roles/${id}/permissions`, { permissionIds });
}
