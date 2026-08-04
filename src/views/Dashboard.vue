<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NCard, NGrid, NGi, NIcon, NSkeleton, useMessage } from 'naive-ui';
import {
  TrophyOutline,
  SchoolOutline,
  ServerOutline,
} from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/auth';
import { getRanksApi } from '@/api/rank';
import { getSchoolsApi } from '@/api/school';
import { getAllGameServersApi } from '@/api/game-server';
import ServerPowerChart from '@/components/ServerPowerChart.vue';
import RankRolePieChart from '@/components/RankRolePieChart.vue';

const authStore = useAuthStore();
const message = useMessage();
const loading = ref(true);
const allRanks = ref<any[]>([]);
const stats = ref<any>({
  rankCount: 0,
  schoolCount: 0,
  serverCount: 0,
});

const userName = computed(
  () => authStore.user?.realName || authStore.user?.username || '管理员',
);

const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

const statCards = computed(() => [
  {
    label: '战力记录',
    value: stats.value.rankCount ?? 0,
    icon: TrophyOutline,
    color: '#1677ff',
    bg: 'rgba(22, 119, 255, 0.1)',
  },
  {
    label: '门派排行',
    value: stats.value.schoolCount ?? 0,
    icon: SchoolOutline,
    color: '#18a058',
    bg: 'rgba(24, 160, 88, 0.1)',
  },
  {
    label: '区服数量',
    value: stats.value.serverCount ?? 0,
    icon: ServerOutline,
    color: '#f0a020',
    bg: 'rgba(240, 160, 32, 0.12)',
  },
]);

async function fetchAllRanks(): Promise<any[]> {
  const all: any[] = [];
  const pageSize = 200;
  let page = 1;
  let total = Infinity;

  while (all.length < total && page <= 50) {
    const res: any = await getRanksApi({ page, pageSize });
    const list = res.data?.list || [];
    total = res.data?.total ?? all.length;
    all.push(...list);
    if (!list.length || all.length >= total) break;
    page++;
  }
  return all;
}

onMounted(async () => {
  const results = await Promise.allSettled([
    getRanksApi({ page: 1, pageSize: 1 }),
    getSchoolsApi({ page: 1, pageSize: 1 }),
    getAllGameServersApi(),
    fetchAllRanks(),
  ]);

  if (results[0].status === 'fulfilled') {
    stats.value.rankCount = results[0].value.data?.total ?? 0;
  }
  if (results[1].status === 'fulfilled') {
    stats.value.schoolCount = results[1].value.data?.total ?? 0;
  }
  if (results[2].status === 'fulfilled') {
    stats.value.serverCount = (results[2].value.data || []).length;
  }
  if (results[3].status === 'fulfilled') {
    allRanks.value = results[3].value;
  }

  if (results.every((r) => r.status === 'rejected')) {
    message.error('统计数据加载失败，请检查后端服务');
  } else if (results[3].status === 'rejected') {
    message.warning('战力排行数据加载失败，图表暂不可用');
  }
  loading.value = false;
});
</script>

<template>
  <div>
    <div class="welcome-banner">
      <div>
        <h2>{{ userName }}，欢迎回来 👋</h2>
        <p>{{ today }}，祝您工作顺利</p>
      </div>
    </div>

    <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <n-gi span="1 m:1">
        <n-skeleton v-if="loading" text :repeat="3" style="height: 92px" />
        <n-card v-else class="stat-card" :bordered="false">
          <div class="stat-card-inner">
            <div class="stat-icon" :style="{ background: statCards[0].bg }">
              <n-icon :size="26" :color="statCards[0].color">
                <component :is="statCards[0].icon" />
              </n-icon>
            </div>
            <div>
              <div class="stat-label">{{ statCards[0].label }}</div>
              <div class="stat-value">{{ statCards[0].value }}</div>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi span="1 m:1">
        <n-skeleton v-if="loading" text :repeat="3" style="height: 92px" />
        <n-card v-else class="stat-card" :bordered="false">
          <div class="stat-card-inner">
            <div class="stat-icon" :style="{ background: statCards[1].bg }">
              <n-icon :size="26" :color="statCards[1].color">
                <component :is="statCards[1].icon" />
              </n-icon>
            </div>
            <div>
              <div class="stat-label">{{ statCards[1].label }}</div>
              <div class="stat-value">{{ statCards[1].value }}</div>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi span="1 m:1">
        <n-skeleton v-if="loading" text :repeat="3" style="height: 92px" />
        <n-card v-else class="stat-card" :bordered="false">
          <div class="stat-card-inner">
            <div class="stat-icon" :style="{ background: statCards[2].bg }">
              <n-icon :size="26" :color="statCards[2].color">
                <component :is="statCards[2].icon" />
              </n-icon>
            </div>
            <div>
              <div class="stat-label">{{ statCards[2].label }}</div>
              <div class="stat-value">{{ statCards[2].value }}</div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card class="page-card" :bordered="false" style="margin-top: 16px">
      <div class="page-header" style="margin-bottom: 4px">
        <div>
          <h2 class="page-title">角色分布统计</h2>
          <p class="page-desc">按职业统计战力排行数据中的角色分布</p>
        </div>
      </div>
      <RankRolePieChart :ranks="allRanks" :loading="loading" />
    </n-card>

    <n-card class="page-card" :bordered="false" style="margin-top: 16px">
      <div class="page-header" style="margin-bottom: 4px">
        <div>
          <h2 class="page-title">各区服总战力</h2>
          <p class="page-desc">按区服聚合排行榜数据，展示总战力</p>
        </div>
      </div>
      <ServerPowerChart :ranks="allRanks" />
    </n-card>

  </div>
</template>

<style scoped>
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: 12px;
  color: #fff;
  background:
    radial-gradient(1200px 240px at 90% -20%, rgba(54, 207, 201, 0.35), transparent),
    linear-gradient(120deg, #0d2d66, #1677ff);
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.18);
}

.welcome-banner h2 {
  font-size: 20px;
  font-weight: 600;
}

.welcome-banner p {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
}
</style>
