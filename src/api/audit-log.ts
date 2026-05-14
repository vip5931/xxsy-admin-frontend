import request from './request';

export function getAuditLogsApi(params?: { page?: number; pageSize?: number; username?: string; action?: string; resource?: string }) {
  return request.get('/audit-logs', { params });
}
