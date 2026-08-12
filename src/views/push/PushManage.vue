<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import {
  NCard,
  NStatistic,
  NGrid,
  NGi,
  NSpace,
  NTable,
  NButton,
  NTag,
  NPagination,
  NPopconfirm,
  NEmpty,
  NAlert,
  NModal,
  NInput,
  NTabs,
  NTabPane,
  useMessage,
  useDialog,
} from 'naive-ui';
import {
  getPushOverviewApi,
  getPushPendingApi,
  getPushLogsApi,
  sendPushApi,
  getPushArticlePendingApi,
  sendArticleApi,
  searchArticlesApi,
} from '@/api/push';
import { usePermissionStore } from '@/stores/permission';
import PageHeader from '@/components/PageHeader.vue';
import { getAnnouncementsApi } from '@/api/announcement';

const message = useMessage();
const dialog = useDialog();
const permStore = usePermissionStore();
const canSend = permStore.hasPermission('push:send');
const sendingId = ref<number | null>(null);
const manualSendingId = ref<number | null>(null);
const articlePendingSendingId = ref<number | null>(null);
const articleManualSendingId = ref<number | null>(null);

function unwrapData(res: any) {
  return res?.data?.data ?? res?.data ?? {};
}

function unwrapResult(res: any) {
  return res?.data?.data?.data ?? unwrapData(res);
}

const overview = reactive({
  activeSubscribers: 0,
  totalSubscribers: 0,
  remainingCount: 0,
  list: [] as any[],
});

const pending = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  sending: false,
});

const logs = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
});

const articlePending = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
});

const manualVisible = ref(false);
const manualTab = ref('announcement');
const manualState = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  keyword: '',
  loading: false,
});
const articleManualState = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  keyword: '',
  loading: false,
});

async function fetchOverview() {
  try {
    const res: any = await getPushOverviewApi();
    const data = unwrapData(res);
    overview.activeSubscribers = data.activeSubscribers || 0;
    overview.totalSubscribers = data.totalSubscribers || 0;
    overview.remainingCount = data.remainingCount || 0;
    overview.list = data.list || [];
  } catch {
    message.error('加载订阅统计失败');
  }
}

async function fetchPending() {
  pending.loading = true;
  try {
    const res: any = await getPushPendingApi({
      page: pending.page,
      pageSize: pending.pageSize,
    });
    const data = unwrapData(res);
    pending.list = data.list || [];
    pending.total = data.total || 0;
  } catch {
    message.error('加载待推送公告失败');
  } finally {
    pending.loading = false;
  }
}

async function fetchLogs() {
  logs.loading = true;
  try {
    const res: any = await getPushLogsApi({
      page: logs.page,
      pageSize: logs.pageSize,
    });
    const data = unwrapData(res);
    logs.list = data.list || [];
    logs.total = data.total || 0;
  } catch {
    message.error('加载发送记录失败');
  } finally {
    logs.loading = false;
  }
}

async function fetchArticlePending() {
  articlePending.loading = true;
  try {
    const res: any = await getPushArticlePendingApi({
      page: articlePending.page,
      pageSize: articlePending.pageSize,
    });
    const data = unwrapData(res);
    articlePending.list = data.list || [];
    articlePending.total = data.total || 0;
  } catch {
    message.error('加载待推送攻略失败');
  } finally {
    articlePending.loading = false;
  }
}

function refreshAll() {
  fetchOverview();
  fetchPending();
  fetchLogs();
  fetchArticlePending();
}

function openManual() {
  manualVisible.value = true;
  manualState.page = 1;
  fetchManualList();
}

async function fetchManualList() {
  manualState.loading = true;
  try {
    const res: any = await getAnnouncementsApi({
      page: manualState.page,
      pageSize: manualState.pageSize,
      keyword: manualState.keyword || undefined,
    });
    manualState.list = res?.data?.list || [];
    manualState.total = res?.data?.total || 0;
  } catch {
    message.error('加载公告列表失败');
  } finally {
    manualState.loading = false;
  }
}

function manualSearch() {
  manualState.page = 1;
  fetchManualList();
}

function onManualPageChange(page: number) {
  manualState.page = page;
  fetchManualList();
}

async function fetchArticleManualList() {
  articleManualState.loading = true;
  try {
    const res: any = await searchArticlesApi({
      keyword: articleManualState.keyword || undefined,
      page: articleManualState.page,
      pageSize: articleManualState.pageSize,
    });
    const data = unwrapData(res);
    articleManualState.list = data.list || [];
    articleManualState.total = data.total || 0;
  } catch {
    message.error('加载攻略列表失败');
  } finally {
    articleManualState.loading = false;
  }
}

function articleManualSearch() {
  articleManualState.page = 1;
  fetchArticleManualList();
}

function onArticleManualPageChange(page: number) {
  articleManualState.page = page;
  fetchArticleManualList();
}

function onManualTabChange(name: string) {
  if (name === 'article' && articleManualState.list.length === 0 && !articleManualState.loading) {
    articleManualState.page = 1;
    fetchArticleManualList();
  }
}

async function handleManualSend(row: any) {
  manualSendingId.value = row.id;
  try {
    const res: any = await sendPushApi({ announcementId: row.id });
    const data = unwrapResult(res);
    if (typeof data.success === 'number') {
      message.success(`推送完成：成功 ${data.success}，失败 ${data.fail || 0}`);
    } else if (data.reason) {
      message.warning(`未发送：${data.reason}`);
    } else {
      message.success('推送任务已执行');
    }
    refreshAll();
  } catch {
    message.error('推送失败，请稍后重试');
  } finally {
    manualSendingId.value = null;
  }
}

async function handleArticlePendingSend(row: any) {
  if (!row.id) {
    message.warning('该攻略缺少 ID，无法推送');
    return;
  }
  articlePendingSendingId.value = row.id;
  try {
    const res: any = await sendArticleApi({ articleId: row.id });
    const data = unwrapResult(res);
    if (typeof data.success === 'number') {
      message.success(`推送完成：成功 ${data.success}，失败 ${data.fail || 0}`);
    } else if (data.reason) {
      message.warning(`未发送：${data.reason}`);
    } else {
      message.success('推送任务已执行');
    }
    refreshAll();
  } catch {
    message.error('推送失败，请稍后重试');
  } finally {
    articlePendingSendingId.value = null;
  }
}

async function handleArticleManualSend(row: any) {
  if (!row.id) {
    message.warning('该攻略缺少 ID，无法推送');
    return;
  }
  articleManualSendingId.value = row.id;
  try {
    const res: any = await sendArticleApi({ articleId: row.id });
    const data = unwrapResult(res);
    if (typeof data.success === 'number') {
      message.success(`推送完成：成功 ${data.success}，失败 ${data.fail || 0}`);
    } else if (data.reason) {
      message.warning(`未发送：${data.reason}`);
    } else {
      message.success('推送任务已执行');
    }
    refreshAll();
  } catch {
    message.error('推送失败，请稍后重试');
  } finally {
    articleManualSendingId.value = null;
  }
}

async function handleSendOne(row: any) {
  sendingId.value = row.id;
  try {
    const res: any = await sendPushApi({ announcementId: row.id });
    const data = unwrapResult(res);
    if (typeof data.success === 'number') {
      message.success(`推送完成：成功 ${data.success}，失败 ${data.fail || 0}`);
    } else if (data.reason) {
      message.warning(`未发送：${data.reason}`);
    } else {
      message.success('推送任务已执行');
    }
    refreshAll();
  } catch {
    message.error('推送失败，请稍后重试');
  } finally {
    sendingId.value = null;
  }
}

function handleSendAll() {
  dialog.warning({
    title: '推送全部待发公告',
    content: `将把所有未推送过的公告（当前 ${pending.total} 条）按最新到最旧依次推送给订阅用户。每个用户每次授权只有 1 次推送机会，推完即止。确定继续？`,
    positiveText: '开始推送',
    negativeText: '取消',
    onPositiveClick: () => sendAll(),
  });
}

async function sendAll() {
  pending.sending = true;
  try {
    const res: any = await sendPushApi({});
    const data = unwrapResult(res);
    message.success(`已处理 ${data.processed ?? 0} 条公告`);
    refreshAll();
  } catch {
    message.error('推送失败，请稍后重试');
  } finally {
    pending.sending = false;
  }
}

function onPendingPageChange(page: number) {
  pending.page = page;
  fetchPending();
}

function onPendingSizeChange(size: number) {
  pending.pageSize = size;
  pending.page = 1;
  fetchPending();
}

function onLogPageChange(page: number) {
  logs.page = page;
  fetchLogs();
}

function onArticlePageChange(page: number) {
  articlePending.page = page;
  fetchArticlePending();
}

function fmtTime(v: string | null | undefined) {
  if (!v) return '-';
  return String(v).replace('T', ' ').slice(0, 19);
}

onMounted(refreshAll);
</script>

<template>
  <n-card class="page-card" :bordered="false">
    <PageHeader title="推送管理" description="自动检测官网公告与公众号攻略更新并推送给订阅用户；也可手动选择公告/攻略推送">
      <n-space>
        <n-button v-if="canSend" type="primary" :loading="pending.sending" @click="handleSendAll">
          推送全部待发
        </n-button>
        <n-button v-if="canSend" type="warning" @click="openManual">手动推送</n-button>
        <n-button @click="refreshAll">刷新</n-button>
      </n-space>
    </PageHeader>

    <n-alert
      v-if="overview.activeSubscribers === 0"
      type="warning"
      :show-icon="true"
      style="margin-bottom: 16px"
    >
      当前没有有效订阅用户（剩余推送次数为 0），手动推送不会送达；需用户在小程序公告页重新授权后再试。
    </n-alert>

    <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive style="margin-bottom: 16px">
      <n-gi span="1 m:1">
        <n-card :bordered="false" class="stat-card">
          <n-statistic label="有效订阅用户" :value="overview.activeSubscribers" />
        </n-card>
      </n-gi>
      <n-gi span="1 m:1">
        <n-card :bordered="false" class="stat-card">
          <n-statistic label="待推送公告" :value="pending.total" />
        </n-card>
      </n-gi>
    </n-grid>

    <n-card title="订阅用户" size="small" :bordered="false" class="section-card">
      <n-table size="small" :single-line="false">
        <thead>
          <tr>
            <th>用户（脱敏）</th>
            <th style="width: 80px">类型</th>
            <th style="width: 140px">剩余推送次数</th>
            <th style="width: 100px">状态</th>
            <th style="width: 180px">最近授权时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in overview.list" :key="`${u.openid}-${u.templateId}`">
            <td>{{ u.openid }}</td>
            <td>
              <n-tag size="small" :bordered="false" :type="u.templateId === 'opqsP5yZKTe-eSPbR0-UZcf6qvAgwbxJF_UsA77-zow' ? 'warning' : 'info'">
                {{ u.templateId === 'opqsP5yZKTe-eSPbR0-UZcf6qvAgwbxJF_UsA77-zow' ? '攻略' : '公告' }}
              </n-tag>
            </td>
            <td>
              <n-tag size="small" :bordered="false" :type="u.subscribeCount > 0 ? 'success' : 'default'">
                {{ u.subscribeCount }}
              </n-tag>
            </td>
            <td>
              <n-tag size="small" :bordered="false" :type="u.status === 1 ? 'success' : 'error'">
                {{ u.status === 1 ? '有效' : '已停用' }}
              </n-tag>
            </td>
            <td>{{ fmtTime(u.lastSubscribedAt) }}</td>
          </tr>
          <tr v-if="overview.list.length === 0">
            <td colspan="5" style="text-align: center; padding: 24px">
              <n-empty description="暂无订阅用户" />
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-card>

    <n-card title="待推送公告" size="small" :bordered="false" class="section-card">
      <n-table :loading="pending.loading" size="small" :single-line="false">
        <thead>
          <tr>
            <th style="width: 70px">ID</th>
            <th>标题</th>
            <th style="width: 90px">分类</th>
            <th style="width: 120px">发布日期</th>
            <th v-if="canSend" style="width: 110px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pending.list" :key="row.id">
            <td>{{ row.id }}</td>
            <td class="ellipsis" :title="row.title">{{ row.title }}</td>
            <td><n-tag size="small" :bordered="false">{{ row.category }}</n-tag></td>
            <td>{{ row.publishDate }}</td>
            <td v-if="canSend">
              <n-popconfirm @positive-click="() => handleSendOne(row)">
                <template #trigger>
                  <n-button size="small" type="primary" secondary :loading="sendingId === row.id">推送</n-button>
                </template>
                确认推送《{{ row.title }}》？
              </n-popconfirm>
            </td>
          </tr>
          <tr v-if="!pending.loading && pending.list.length === 0">
            <td :colspan="canSend ? 5 : 4" style="text-align: center; padding: 24px">
              <n-empty description="暂无待推送公告" />
            </td>
          </tr>
        </tbody>
      </n-table>
      <div class="table-footer">
        <n-pagination
          :page="pending.page"
          :page-size="pending.pageSize"
          :item-count="pending.total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          @update:page="onPendingPageChange"
          @update:page-size="onPendingSizeChange"
        />
      </div>
    </n-card>

    <n-card title="待推送攻略" size="small" :bordered="false" class="section-card">
      <n-table :loading="articlePending.loading" size="small" :single-line="false">
        <thead>
          <tr>
            <th style="width: 70px">ID</th>
            <th>标题</th>
            <th style="width: 140px">所属专辑</th>
            <th style="width: 150px">发布时间</th>
            <th v-if="canSend" style="width: 110px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in articlePending.list" :key="row.id">
            <td>{{ row.id }}</td>
            <td class="ellipsis" :title="row.title">{{ row.title }}</td>
            <td><n-tag size="small" :bordered="false">{{ row.albumName || '-' }}</n-tag></td>
            <td>{{ fmtTime(row.publishTime) }}</td>
            <td v-if="canSend">
              <n-popconfirm @positive-click="() => handleArticlePendingSend(row)">
                <template #trigger>
                  <n-button size="small" type="warning" secondary :loading="articlePendingSendingId === row.id">推送</n-button>
                </template>
                确认推送《{{ row.title }}》？
              </n-popconfirm>
            </td>
          </tr>
          <tr v-if="!articlePending.loading && articlePending.list.length === 0">
            <td :colspan="canSend ? 5 : 4" style="text-align: center; padding: 24px">
              <n-empty description="暂无待推送攻略" />
            </td>
          </tr>
        </tbody>
      </n-table>
      <div class="table-footer">
        <n-pagination
          :page="articlePending.page"
          :page-size="articlePending.pageSize"
          :item-count="articlePending.total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          @update:page="onArticlePageChange"
          @update:page-size="(size: number) => { articlePending.pageSize = size; articlePending.page = 1; fetchArticlePending(); }"
        />
      </div>
    </n-card>

    <n-card title="发送记录" size="small" :bordered="false">
      <n-table :loading="logs.loading" size="small" :single-line="false">
        <thead>
          <tr>
            <th style="width: 70px">ID</th>
            <th style="width: 90px">公告ID</th>
            <th style="width: 90px">类型</th>
            <th style="width: 90px">目标数</th>
            <th style="width: 80px">成功</th>
            <th style="width: 80px">失败</th>
            <th>备注</th>
            <th style="width: 160px">发送时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs.list" :key="log.id">
            <td>{{ log.id }}</td>
            <td>{{ log.announcementId }}</td>
            <td>
              <n-tag size="small" :bordered="false" :type="log.targetType === 'article' ? 'warning' : 'info'">
                {{ log.targetType === 'article' ? '攻略' : '公告' }}
              </n-tag>
            </td>
            <td>{{ log.totalTargets }}</td>
            <td>
              <n-tag size="small" :bordered="false" :type="log.successCount > 0 ? 'success' : 'default'">
                {{ log.successCount }}
              </n-tag>
            </td>
            <td>
              <n-tag size="small" :bordered="false" :type="log.failCount > 0 ? 'error' : 'default'">
                {{ log.failCount }}
              </n-tag>
            </td>
            <td class="ellipsis" :title="log.message">{{ log.message || '-' }}</td>
            <td>{{ fmtTime(log.sentAt) }}</td>
          </tr>
          <tr v-if="!logs.loading && logs.list.length === 0">
            <td colspan="8" style="text-align: center; padding: 24px">
              <n-empty description="暂无发送记录" />
            </td>
          </tr>
        </tbody>
      </n-table>
      <div class="table-footer">
        <n-pagination
          :page="logs.page"
          :page-size="logs.pageSize"
          :item-count="logs.total"
          @update:page="onLogPageChange"
        />
      </div>
    </n-card>

    <n-modal
      v-model:show="manualVisible"
      preset="card"
      title="手动推送"
      style="width: 760px"
      :bordered="false"
    >
      <n-tabs v-model:value="manualTab" type="line" @update:value="onManualTabChange">
        <n-tab-pane name="announcement" tab="公告">
      <n-space style="margin-bottom: 12px" align="center">
        <n-input
          v-model:value="manualState.keyword"
          placeholder="搜索公告标题"
          clearable
          style="width: 280px"
          @keyup.enter="manualSearch"
          @clear="manualSearch"
        />
        <n-button type="primary" secondary @click="manualSearch">查询</n-button>
      </n-space>
      <n-table :loading="manualState.loading" size="small" :single-line="false">
        <thead>
          <tr>
            <th style="width: 70px">ID</th>
            <th>标题</th>
            <th style="width: 90px">分类</th>
            <th style="width: 120px">发布日期</th>
            <th style="width: 110px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in manualState.list" :key="row.id">
            <td>{{ row.id }}</td>
            <td class="ellipsis" :title="row.title">{{ row.title }}</td>
            <td><n-tag size="small" :bordered="false">{{ row.category }}</n-tag></td>
            <td>{{ row.publishDate }}</td>
            <td>
              <n-popconfirm @positive-click="() => handleManualSend(row)">
                <template #trigger>
                  <n-button size="small" type="warning" :loading="manualSendingId === row.id">推送</n-button>
                </template>
                确认推送《{{ row.title }}》？
              </n-popconfirm>
            </td>
          </tr>
          <tr v-if="!manualState.loading && manualState.list.length === 0">
            <td colspan="5" style="text-align: center; padding: 24px">
              <n-empty description="未找到公告" />
            </td>
          </tr>
        </tbody>
      </n-table>
      <div class="table-footer">
        <n-pagination
          :page="manualState.page"
          :page-size="manualState.pageSize"
          :item-count="manualState.total"
          @update:page="onManualPageChange"
        />
        </div>
        </n-tab-pane>
        <n-tab-pane name="article" tab="攻略">
          <n-space style="margin-bottom: 12px" align="center">
            <n-input
              v-model:value="articleManualState.keyword"
              placeholder="搜索攻略标题"
              clearable
              style="width: 280px"
              @keyup.enter="articleManualSearch"
              @clear="articleManualSearch"
            />
            <n-button type="primary" secondary @click="articleManualSearch">查询</n-button>
          </n-space>
          <n-table :loading="articleManualState.loading" size="small" :single-line="false">
            <thead>
              <tr>
                <th style="width: 70px">ID</th>
                <th>标题</th>
                <th style="width: 140px">所属专辑</th>
                <th style="width: 150px">发布时间</th>
                <th style="width: 110px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in articleManualState.list" :key="row.id">
                <td>{{ row.id }}</td>
                <td class="ellipsis" :title="row.title">{{ row.title }}</td>
                <td><n-tag size="small" :bordered="false">{{ row.albumName || '-' }}</n-tag></td>
                <td>{{ fmtTime(row.publishTime) }}</td>
                <td>
                  <n-popconfirm @positive-click="() => handleArticleManualSend(row)">
                    <template #trigger>
                      <n-button size="small" type="warning" :loading="articleManualSendingId === row.id">推送</n-button>
                    </template>
                    确认推送《{{ row.title }}》？
                  </n-popconfirm>
                </td>
              </tr>
              <tr v-if="!articleManualState.loading && articleManualState.list.length === 0">
                <td colspan="5" style="text-align: center; padding: 24px">
                  <n-empty description="未找到攻略" />
                </td>
              </tr>
            </tbody>
          </n-table>
          <div class="table-footer">
            <n-pagination
              :page="articleManualState.page"
              :page-size="articleManualState.pageSize"
              :item-count="articleManualState.total"
              @update:page="onArticleManualPageChange"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-modal>
  </n-card>
</template>

<style scoped>
.stat-card {
  background: #f7f8fa;
}
.section-card {
  margin-bottom: 16px;
}
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
.ellipsis {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
