import request from './request';

export function getAnnouncementsApi(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  return request.get('/announcements', { params });
}

export function getAnnouncementApi(id: number) {
  return request.get(`/announcements/${id}`);
}

export function updateAnnouncementApi(
  id: number,
  data: { title?: string; status?: number },
) {
  return request.put(`/announcements/${id}`, data);
}

export function deleteAnnouncementApi(id: number) {
  return request.delete(`/announcements/${id}`);
}

/** 一键抓取官网最新公告 */
export function syncAnnouncementsApi() {
  return request.post('/announcements/sync');
}

export function getSyncLogsApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/announcements/sync-logs', { params });
}
