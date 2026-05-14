<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NGrid, NGi, NStatistic } from 'naive-ui';
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
    <n-grid :cols="3" :x-gap="16" style="margin-bottom: 24px">
      <n-gi><n-card><n-statistic label="用户总数" :value="stats.userCount" /></n-card></n-gi>
      <n-gi><n-card><n-statistic label="角色总数" :value="stats.roleCount" /></n-card></n-gi>
      <n-gi><n-card><n-statistic label="今日操作" :value="stats.todayLogs" /></n-card></n-gi>
    </n-grid>
  </div>
</template>
