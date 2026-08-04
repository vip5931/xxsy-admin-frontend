<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { NSkeleton, NEmpty, useMessage } from 'naive-ui';
import { getAllGameServersApi, getGameServersApi } from '@/api/game-server';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{ ranks: any[] }>();

const message = useMessage();
const chartRef = ref<HTMLDivElement | null>(null);
const chart = shallowRef<echarts.ECharts | null>(null);
const loading = ref(true);
const servers = ref<string[]>([]);
const data = ref<{ server: string; totalPower: number }[]>([]);
const chartHeight = 440;

function formatPower(value: number): string {
  if (value === 0) return '0亿';
  return `${(value / 100000000).toFixed(2)}亿`;
}

function uniqueNames(list: string[]): string[] {
  return Array.from(new Set(list.filter((name) => !!name)));
}

async function fetchAllServers(): Promise<string[]> {
  // 优先使用「全部区服」接口
  try {
    const res: any = await getAllGameServersApi();
    const list = res.data || [];
    if (list.length) {
      return list.map((s: any) => s.name).filter(Boolean);
    }
  } catch {
    /* 继续走分页兜底 */
  }

  // 兜底：分页拉取区服管理列表，确保所有区服都能显示
  const names: string[] = [];
  const pageSize = 200;
  let page = 1;
  let total = Infinity;

  while (names.length < total && page <= 50) {
    const res: any = await getGameServersApi({ page, pageSize });
    const list = res.data?.list || [];
    total = res.data?.total ?? names.length;
    for (const s of list) {
      if (s?.name) names.push(s.name);
    }
    if (!list.length || names.length >= total) break;
    page++;
  }
  return uniqueNames(names);
}

function buildData() {
  const totals = new Map<string, number>();
  for (const row of props.ranks) {
    if (!row.server) continue;
    totals.set(row.server, (totals.get(row.server) || 0) + (Number(row.score) || 0));
  }

  const names = servers.value.length
    ? uniqueNames(servers.value)
    : Array.from(totals.keys());

  data.value = names.map((name: string) => ({
    server: name,
    totalPower: totals.get(name) || 0,
  }));
}

async function loadData() {
  loading.value = true;
  try {
    servers.value = await fetchAllServers();
  } catch {
    message.error('区服数据加载失败');
  } finally {
    buildData();
    loading.value = false;
  }
}

watch(
  () => props.ranks,
  () => buildData(),
  { deep: true },
);

function renderChart() {
  if (!chart.value || data.value.length === 0) return;

  const names = data.value.map((d) => d.server);
  const values = data.value.map((d) => d.totalPower);
  const labelRotate = names.length > 14 ? 45 : names.length > 8 ? 30 : 0;

  chart.value.setOption(
    {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: 'rgba(31, 35, 41, 0.08)',
        textStyle: { color: '#1f2329', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(31, 35, 41, 0.08); border-radius: 8px;',
        valueFormatter: (value: number) => Number(value || 0).toLocaleString(),
      },
      grid: {
        left: 16,
        right: 20,
        top: 44,
        bottom: 8,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: names,
        axisLine: { lineStyle: { color: '#e5e6eb' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#86909c',
          fontSize: 12,
          interval: 0,
          rotate: labelRotate,
        },
      },
      yAxis: {
        type: 'value',
        name: '总战力',
        nameTextStyle: { color: '#1f2329', fontSize: 13, fontWeight: 600 },
        nameGap: 12,
        axisLabel: {
          color: '#4e5969',
          fontSize: 12,
          fontWeight: 600,
          formatter: (value: number) => formatPower(value),
        },
        splitLine: { lineStyle: { color: '#e8e8e8' } },
      },
      series: [
        {
          name: '总战力',
          type: 'bar',
          data: values,
          barMaxWidth: 28,
          barCategoryGap: '35%',
          barBorderRadius: [6, 6, 0, 0],
          itemStyle: { color: '#1677ff' },
          label: {
            show: true,
            position: 'top',
            color: '#1f2329',
            fontSize: 10,
            formatter: (params: any) => formatPower(Number(params.value || 0)),
          },
          labelLayout: { hideOverlap: true },
        },
      ],
    },
    true,
  );
}

function handleResize() {
  chart.value?.resize();
}

onMounted(async () => {
  if (chartRef.value) {
    chart.value = echarts.init(chartRef.value);
    window.addEventListener('resize', handleResize);
  }
  await loadData();
  await nextTick();
  renderChart();
});

watch(
  data,
  async () => {
    await nextTick();
    chart.value?.resize();
    renderChart();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chart.value?.dispose();
  chart.value = null;
});
</script>

<template>
  <div class="chart-box" :style="{ height: chartHeight + 'px' }">
    <div
      ref="chartRef"
      class="chart-canvas"
      :style="{ visibility: loading || data.length === 0 ? 'hidden' : 'visible' }"
    />
    <n-skeleton v-if="loading" text :repeat="5" class="chart-placeholder" />
    <n-empty
      v-else-if="data.length === 0"
      description="暂无战力数据"
      class="chart-placeholder"
    />
  </div>
</template>

<style scoped>
.chart-box {
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
}
</style>
