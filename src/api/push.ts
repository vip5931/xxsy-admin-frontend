import request from './request';

export function getPushOverviewApi() {
  return request.get('/push/overview');
}

export function getPushPendingApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/push/pending', { params });
}

export function getPushLogsApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/push/logs', { params });
}

export function sendPushApi(data?: { announcementId?: number }) {
  return request.post('/push/send', data || {});
}

export function getPushArticlePendingApi(params?: { page?: number; pageSize?: number }) {
  return request.get('/push/article-pending', { params });
}

export function sendArticleApi(data?: { articleId?: number }) {
  return request.post('/push/article-send', data || {});
}

export function searchArticlesApi(params?: { keyword?: string; page?: number; pageSize?: number }) {
  return request.get('/push/article-search', { params });
}
