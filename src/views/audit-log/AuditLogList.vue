<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import {
  NTable,
  NTag,
  NInput,
  NSpace,
  NButton,
  NCard,
  useMessage,
  NPagination,
} from 'naive-ui';
import { getAuditLogsApi } from '@/api/audit-log';
import PageHeader from '@/components/PageHeader.vue';

const message = useMessage();
const state = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
});
const filters = reactive({ username: '', action: '' });

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getAuditLogsApi({
      page: state.page,
      pageSize: state.pageSize,
      username: filters.username || undefined,
      action: filters.action || undefined,
    });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载失败');
  } finally {
    state.loading = false;
  }
}

function onPageChange(page: number) {
  state.page = page;
  fetchData();
}

function resetFilters() {
  filters.username = '';
  filters.action = '';
  state.page = 1;
  fetchData();
}

onMounted(fetchData);
</script>

<template>
  <n-card class="page-card" :bordered="false">
    <PageHeader title="操作日志" description="审计后台用户的关键操作行为，保障系统安全" />

    <div class="filter-bar">
      <n-input
        v-model:value="filters.username"
        placeholder="用户名"
        clearable
        style="width: 180px"
        @keyup.enter="fetchData"
      />
      <n-input
        v-model:value="filters.action"
        placeholder="操作类型，如 CREATE"
        clearable
        style="width: 220px"
        @keyup.enter="fetchData"
      />
      <n-button type="primary" @click="fetchData">搜索</n-button>
      <n-button @click="resetFilters">重置</n-button>
    </div>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 64px">ID</th>
          <th>用户</th>
          <th style="width: 110px">操作</th>
          <th>资源</th>
          <th style="width: 140px">IP</th>
          <th style="width: 180px">时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.username }}</td>
          <td>
            <n-tag
              :type="
                row.action === 'DELETE'
                  ? 'error'
                  : row.action === 'CREATE'
                    ? 'success'
                    : 'info'
              "
              size="small"
              :bordered="false"
            >
              {{ row.action }}
            </n-tag>
          </td>
          <td>{{ row.resource }}</td>
          <td>{{ row.ip }}</td>
          <td>{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</td>
        </tr>
      </tbody>
    </n-table>

    <div class="table-footer">
      <n-pagination
        :page="state.page"
        :page-size="state.pageSize"
        :item-count="state.total"
        @update:page="onPageChange"
      />
    </div>
  </n-card>
</template>
