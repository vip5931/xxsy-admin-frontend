<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, NTag, useMessage } from 'naive-ui';
import { getAiRecordsApi } from '@/api/ai-record';

const message = useMessage();
const state = reactive({ list: [] as any[], total: 0, loading: false });

onMounted(async () => {
  state.loading = true;
  try { const res: any = await getAiRecordsApi(); state.list = res.data.list; state.total = res.data.total; } catch { message.error('加载失败'); }
  finally { state.loading = false; }
});
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">AI分析记录</h2>
    <n-table :loading="state.loading">
      <thead><tr><th>ID</th><th>类型</th><th>结果</th><th>时间</th></tr></thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td><n-tag size="small">{{ row.type || row.analysis_type || '-' }}</n-tag></td>
          <td>{{ row.result || '-' }}</td>
          <td>{{ row.created_at || '-' }}</td>
        </tr>
      </tbody>
    </n-table>
  </div>
</template>
