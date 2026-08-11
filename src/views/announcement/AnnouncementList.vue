<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import {
  NTable,
  NButton,
  NTag,
  NSpace,
  NInput,
  NModal,
  NCard,
  NDrawer,
  NPagination,
  NPopconfirm,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSpin,
  useMessage,
  useDialog,
} from 'naive-ui';
import {
  getAnnouncementsApi,
  getAnnouncementApi,
  updateAnnouncementApi,
  deleteAnnouncementApi,
  syncAnnouncementsApi,
  getSyncLogsApi,
} from '@/api/announcement';
import { usePermissionStore } from '@/stores/permission';
import PageHeader from '@/components/PageHeader.vue';

const message = useMessage();
const dialog = useDialog();
const permStore = usePermissionStore();

const state = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  keyword: '',
  loading: false,
  syncing: false,
});

const canSync = permStore.hasPermission('announcement:sync');
const canUpdate = permStore.hasPermission('announcement:update');
const canDelete = permStore.hasPermission('announcement:delete');

// 详情抽屉
const detailVisible = ref(false);
const detail = ref<any>(null);
const detailLoading = ref(false);

// 抓取日志
const logVisible = ref(false);
const logState = reactive({ list: [] as any[], total: 0, page: 1, pageSize: 5, loading: false });

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getAnnouncementsApi({
      page: state.page,
      pageSize: state.pageSize,
      keyword: state.keyword || undefined,
    });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载公告列表失败');
  } finally {
    state.loading = false;
  }
}

function handleSearch() {
  state.page = 1;
  fetchData();
}

function onPageChange(page: number) {
  state.page = page;
  fetchData();
}

function handleSync() {
  dialog.warning({
    title: '一键抓取',
    content: '将从 xxsy.qq.com 官网抓取全部公告列表并补充最新公告内容，已存在的公告仅刷新同步状态。确定执行？',
    positiveText: '开始抓取',
    negativeText: '取消',
    // 不返回 Promise：弹窗立即关闭，抓取在后台异步执行
    onPositiveClick: () => {
      startSync();
    },
  });
}

async function startSync() {
  state.syncing = true;
  try {
    // 记录发起前的最大日志 ID，用于识别本次抓取任务
    const beforeRes: any = await getSyncLogsApi({ page: 1, pageSize: 1 });
    const beforeMaxId = beforeRes.data.list[0]?.id || 0;

    const res: any = await syncAnnouncementsApi();
    if (!res.data.started) {
      message.info('已有抓取任务正在执行，等待其完成后提示结果');
    }
    pollSyncResult(beforeMaxId);
  } catch {
    state.syncing = false;
    message.error('发起抓取失败，请稍后重试');
  }
}

/** 轮询抓取日志，直到出现本次任务（ID 大于发起前最大 ID）且已结束 */
function pollSyncResult(beforeMaxId: number) {
  const startedAt = Date.now();
  const tick = async () => {
    if (Date.now() - startedAt > 360000) {
      state.syncing = false;
      message.error('抓取超时（超过 6 分钟），请到「抓取日志」中查看最新状态');
      return;
    }
    try {
      const logsRes: any = await getSyncLogsApi({ page: 1, pageSize: 1 });
      const latest = logsRes.data.list[0];
      if (latest && latest.id > beforeMaxId && latest.finishedAt) {
        state.syncing = false;
        if (latest.result === 'success') {
          message.success(
            `抓取完成：官网发现 ${latest.totalFound} 条，新增 ${latest.totalNew} 条，更新 ${latest.totalUpdated} 条`,
          );
        } else {
          message.error(`抓取失败：${latest.message || '未知错误'}`);
        }
        fetchData();
        return;
      }
    } catch {
      // 轮询失败继续重试
    }
    setTimeout(tick, 2500);
  };
  tick();
}

async function handleView(id: number) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    const res: any = await getAnnouncementApi(id);
    detail.value = res.data;
  } catch {
    message.error('加载公告详情失败');
  } finally {
    detailLoading.value = false;
  }
}

async function handleToggleStatus(row: any) {
  try {
    await updateAnnouncementApi(row.id, { status: row.status === 1 ? 0 : 1 });
    message.success(row.status === 1 ? '已停用' : '已启用');
    fetchData();
  } catch {
    message.error('操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteAnnouncementApi(id);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
}

async function fetchLogs() {
  logState.loading = true;
  try {
    const res: any = await getSyncLogsApi({ page: logState.page, pageSize: logState.pageSize });
    logState.list = res.data.list;
    logState.total = res.data.total;
  } catch {
    message.error('加载抓取日志失败');
  } finally {
    logState.loading = false;
  }
}

function openLogs() {
  logVisible.value = true;
  logState.page = 1;
  fetchLogs();
}

function onLogPageChange(page: number) {
  logState.page = page;
  fetchLogs();
}

function fmtTime(v: string | null) {
  if (!v) return '-';
  return v.replace('T', ' ').slice(0, 19);
}

onMounted(fetchData);
</script>

<template>
  <n-card class="page-card" :bordered="false">
    <PageHeader title="公告管理" description="自动抓取 xxsy.qq.com 官网公告，支持定时同步与手动一键获取">
      <n-space>
        <n-button v-if="canSync" type="primary" :loading="state.syncing" @click="handleSync">
          一键抓取最新公告
        </n-button>
        <n-button @click="openLogs">抓取日志</n-button>
      </n-space>
    </PageHeader>

    <n-space style="margin-bottom: 12px" align="center">
      <n-input
        v-model:value="state.keyword"
        placeholder="搜索公告标题 / 正文"
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <n-button type="primary" secondary @click="handleSearch">查询</n-button>
    </n-space>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 64px">ID</th>
          <th>公告标题</th>
          <th style="width: 80px">栏目</th>
          <th style="width: 110px">发布日期</th>
          <th style="width: 80px">状态</th>
          <th style="width: 80px">同步次数</th>
          <th style="width: 150px">最近同步</th>
          <th style="width: 200px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td>
            <a
              class="ann-title"
              href="javascript:;"
              :title="row.title"
              @click="handleView(row.id)"
            >{{ row.title }}</a>
          </td>
          <td><n-tag size="small" :bordered="false">{{ row.category }}</n-tag></td>
          <td>{{ row.publishDate }}</td>
          <td>
            <n-tag :type="row.status === 1 ? 'success' : 'error'" size="small" :bordered="false">
              {{ row.status === 1 ? '启用' : '停用' }}
            </n-tag>
          </td>
          <td>{{ row.syncCount }}</td>
          <td>{{ fmtTime(row.lastSyncedAt) }}</td>
          <td>
            <n-space>
              <n-button size="small" @click="handleView(row.id)">查看</n-button>
              <n-button v-if="canUpdate" size="small" @click="handleToggleStatus(row)">
                {{ row.status === 1 ? '停用' : '启用' }}
              </n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger>
                  <n-button size="small" type="error">删除</n-button>
                </template>
                确定删除公告「{{ row.title }}」？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
        <tr v-if="!state.loading && state.list.length === 0">
          <td colspan="8" style="text-align: center; padding: 32px">
            <n-empty description="暂无公告，点击右上角「一键抓取最新公告」从官网获取" />
          </td>
        </tr>
      </tbody>
    </n-table>

    <div class="table-footer">
      <n-pagination
        :page="state.page"
        :page-size="state.pageSize"
        :item-count="state.total"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="onPageChange"
        @update:page-size="(size: number) => { state.pageSize = size; fetchData(); }"
      />
    </div>

    <!-- 公告详情抽屉 -->
    <n-drawer v-model:show="detailVisible" :width="640">
      <n-spin :show="detailLoading">
        <div class="drawer-body">
          <n-empty v-if="!detail && !detailLoading" description="加载中..." />
          <template v-else-if="detail">
            <h2 class="detail-title">{{ detail.title }}</h2>
            <div class="detail-meta">
              <n-tag size="small" :bordered="false">{{ detail.category }}</n-tag>
              <span>发布日期：{{ detail.publishDate }}</span>
              <a :href="detail.sourceUrl" target="_blank" rel="noopener">查看官网原文</a>
            </div>
            <n-descriptions bordered size="small" style="margin-bottom: 12px">
              <n-descriptions-item label="同步次数">{{ detail.syncCount }}</n-descriptions-item>
              <n-descriptions-item label="最近同步">{{ fmtTime(detail.lastSyncedAt) }}</n-descriptions-item>
              <n-descriptions-item label="入库时间">{{ fmtTime(detail.createdAt) }}</n-descriptions-item>
            </n-descriptions>
            <div v-if="detail.contentHtml" class="detail-content" v-html="detail.contentHtml"></div>
            <div v-else class="detail-content">
              <n-empty description="暂无正文内容（官网原文可能已下线）" />
            </div>
          </template>
        </div>
      </n-spin>
    </n-drawer>

    <!-- 抓取日志弹窗 -->
    <n-modal v-model:show="logVisible" style="width: 720px">
      <n-card title="抓取日志" style="width: 720px">
        <n-table :loading="logState.loading" size="small" :single-line="false">
          <thead>
            <tr>
              <th style="width: 140px">开始时间</th>
              <th style="width: 70px">触发</th>
              <th style="width: 70px">结果</th>
              <th style="width: 150px">发现/新增/更新</th>
              <th style="width: 70px">耗时</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logState.list" :key="log.id">
              <td>{{ fmtTime(log.startedAt) }}</td>
              <td>
                <n-tag size="small" :bordered="false" :type="log.triggerType === 'cron' ? 'info' : 'warning'">
                  {{ log.triggerType === 'cron' ? '定时' : '手动' }}
                </n-tag>
              </td>
              <td>
                <n-tag size="small" :bordered="false" :type="log.result === 'success' ? 'success' : 'error'">
                  {{ log.result === 'success' ? '成功' : '失败' }}
                </n-tag>
              </td>
              <td>{{ log.totalFound }} / {{ log.totalNew }} / {{ log.totalUpdated }}</td>
              <td>{{ (log.durationMs / 1000).toFixed(1) }}s</td>
              <td style="max-width: 200px" class="ellipsis" :title="log.message">{{ log.message }}</td>
            </tr>
            <tr v-if="!logState.loading && logState.list.length === 0">
              <td colspan="6" style="text-align: center; padding: 24px">
                <n-empty description="暂无抓取记录" />
              </td>
            </tr>
          </tbody>
        </n-table>
        <div class="table-footer">
          <n-pagination
            :page="logState.page"
            :page-size="logState.pageSize"
            :item-count="logState.total"
            @update:page="onLogPageChange"
          />
        </div>
      </n-card>
    </n-modal>
  </n-card>
</template>

<style scoped>
.ann-title {
  color: #18a058;
  text-decoration: none;
}
.ann-title:hover {
  text-decoration: underline;
}
.drawer-body {
  padding: 16px 20px;
}
.detail-title {
  margin: 0 0 10px;
  font-size: 20px;
  line-height: 1.4;
}
.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #999;
  font-size: 13px;
  margin-bottom: 14px;
}
.detail-content {
  line-height: 1.8;
  font-size: 14px;
  word-break: break-word;
}
.detail-content :deep(img) {
  max-width: 100%;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
