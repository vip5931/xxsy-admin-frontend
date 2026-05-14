import request from './request';

export function getRanksApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/ranks', { params });
}
