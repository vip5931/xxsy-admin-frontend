import request from './request';

export function getAiRecordsApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/ai-records', { params });
}
