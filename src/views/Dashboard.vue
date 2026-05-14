<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NGrid, NGi, NStatistic, NTable, NTag } from 'naive-ui';
import { getDashboardStatsApi } from '@/api/dashboard';

const stats = ref<any>({ userCount: 0, roleCount: 0, todayLogs: 0, recentLogs: [] });

onMounted(async () => {
  try {
    const res: any = await getDashboardStatsApi();
    stats.value = res.data;
  } catch {}
});
</script>

<template>
  <div>
    <n-grid :cols="4" :x-gap="16" style="margin-bottom: 24px">
      <n-gi><n-card><n-statistic label="用户总数" :value="stats.userCount" /></n-card></n-gi>
      <n-gi><n-card><n-statistic label="角色总数" :value="stats.roleCount" /></n-card></n-gi>
      <n-gi><n-card><n-statistic label="今日操作" :value="stats.todayLogs" /></n-card></n-gi>
    </n-grid>

    <n-card title="最近操作日志" style="margin-top: 16px">
      <n-table :single-line="false">
        <thead>
          <tr><th>用户</th><th>操作</th><th>资源</th><th>时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in stats.recentLogs" :key="log.id">
            <td>{{ log.username }}</td>
            <td><n-tag size="small">{{ log.action }}</n-tag></td>
            <td>{{ log.resource }}</td>
            <td>{{ new Date(log.createdAt).toLocaleString('zh-CN') }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-card>
  </div>
</template>
