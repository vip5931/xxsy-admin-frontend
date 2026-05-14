<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, useMessage } from 'naive-ui';
import { getSchoolsApi } from '@/api/school';

const message = useMessage();
const state = reactive({ list: [] as any[], total: 0, loading: false });

onMounted(async () => {
  state.loading = true;
  try { const res: any = await getSchoolsApi(); state.list = res.data.list; state.total = res.data.total; } catch { message.error('加载失败'); }
  finally { state.loading = false; }
});
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">学校管理</h2>
    <n-table :loading="state.loading">
      <thead><tr><th>ID</th><th>学校名</th><th>服务器</th><th>战力</th><th>掌门</th></tr></thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.name || '-' }}</td>
          <td>{{ row.address || '-' }}</td>
          <td>{{ row.power?.toLocaleString() || '-' }}</td>
          <td>{{ row.type || '-' }}</td>
        </tr>
      </tbody>
    </n-table>
  </div>
</template>
