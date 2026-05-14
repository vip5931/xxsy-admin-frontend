import request from './request';

export function getSchoolsApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/schools', { params });
}
