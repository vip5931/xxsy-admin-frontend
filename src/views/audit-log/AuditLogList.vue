<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, NTag, NInput, NSpace, NButton, useMessage, NPagination } from 'naive-ui';
import { getAuditLogsApi } from '@/api/audit-log';

const message = useMessage();
const state = reactive({ list: [] as any[], total: 0, page: 1, pageSize: 20, loading: false });
const filters = reactive({ username: '', action: '' });

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getAuditLogsApi({ page: state.page, pageSize: state.pageSize, username: filters.username || undefined, action: filters.action || undefined });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch { message.error('加载失败'); }
  finally { state.loading = false; }
}

function onPageChange(page: number) { state.page = page; fetchData(); }

onMounted(fetchData);
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">操作日志</h2>
    <n-space style="margin-bottom: 16px">
      <n-input v-model:value="filters.username" placeholder="用户名" style="width: 160px" />
      <n-button @click="fetchData">搜索</n-button>
    </n-space>
    <n-table :loading="state.loading">
      <thead><tr><th>ID</th><th>用户</th><th>操作</th><th>资源</th><th>IP</th><th>时间</th></tr></thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.username }}</td>
          <td><n-tag :type="row.action === 'DELETE' ? 'error' : row.action === 'CREATE' ? 'success' : 'info'" size="small">{{ row.action }}</n-tag></td>
          <td>{{ row.resource }}</td>
          <td>{{ row.ip }}</td>
          <td>{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</td>
        </tr>
      </tbody>
    </n-table>
    <n-pagination :page="state.page" :page-size="state.pageSize" :item-count="state.total" @update:page="onPageChange" style="margin-top: 16px; justify-content: flex-end" />
  </div>
</template>
