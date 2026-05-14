import request from './request';

export function loginApi(data: { username: string; password: string }) {
  return request.post('/auth/login', data);
}

export function refreshApi(refreshToken: string) {
  return request.post('/auth/refresh', { refresh_token: refreshToken });
}

export function getMeApi() {
  return request.get('/auth/me');
}

export function changePasswordApi(data: { oldPassword: string; newPassword: string }) {
  return request.post('/auth/change-password', data);
}
