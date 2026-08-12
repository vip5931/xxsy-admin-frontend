import request from './request';

export interface NoticePayload {
  title: string;
  content?: string;
  images?: string[];
  type?: string;
  status?: number;
  sort?: number;
  publishedAt?: string | null;
}

export function getNoticesApi(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get('/notices', { params });
}

export function getNoticeApi(id: number) {
  return request.get(`/notices/${id}`);
}

export function createNoticeApi(data: NoticePayload) {
  return request.post('/notices', data);
}

export function updateNoticeApi(id: number, data: Partial<NoticePayload>) {
  return request.put(`/notices/${id}`, data);
}

export function deleteNoticeApi(id: number) {
  return request.delete(`/notices/${id}`);
}

export function uploadNoticeImageApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/notices/upload', formData, { timeout: 60000 });
}
