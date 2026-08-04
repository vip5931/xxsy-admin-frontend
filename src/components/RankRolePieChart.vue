<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { NSkeleton, NEmpty } from 'naive-ui';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = defineProps<{
  ranks: any[];
  loading?: boolean;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const chart = shallowRef<echarts.ECharts | null>(null);

const colors = [
  '#1677ff',
  '#18a058',
  '#f0a020',
  '#d03050',
  '#722ed1',
  '#13c2c2',
  '#fa8c16',
  '#2f54eb',
  '#eb2f96',
  '#a0d911',
];

const distribution = computed(() => {
  const map = new Map<string, number>();
  for (const row of props.ranks) {
    const key = row.rank || '未知职业';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
});

function renderChart() {
  if (!chart.value || distribution.value.length === 0) return;

  chart.value.setOption(
    {
      color: colors,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: 'rgba(31, 35, 41, 0.08)',
        textStyle: { color: '#1f2329', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 12px rgba(31, 35, 41, 0.08); border-radius: 8px;',
        formatter: '{b}：{c} 条（{d}%）',
      },
      legend: {
        bottom: 0,
        type: 'scroll',
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#4e5969', fontSize: 12 },
      },
      series: [
        {
          name: '角色分布',
          type: 'pie',
          radius: ['42%', '66%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c} 条',
            fontSize: 11,
            fontWeight: 600,
            color: '#1f2329',
            minShowLabelAngle: 10,
          },
          labelLine: {
            length: 24,
            length2: 18,
            lineStyle: { color: '#c9cdd4' },
          },
          data: distribution.value,
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
  await nextTick();
  renderChart();
});

watch(
  distribution,
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
  <div class="pie-box">
    <div
      ref="chartRef"
      class="pie-canvas"
      :style="{ visibility: loading || distribution.length === 0 ? 'hidden' : 'visible' }"
    />
    <n-skeleton v-if="loading" text :repeat="5" class="pie-placeholder" />
    <n-empty
      v-else-if="distribution.length === 0"
      description="暂无角色分布数据"
      class="pie-placeholder"
    />
  </div>
</template>

<style scoped>
.pie-box {
  position: relative;
  height: 440px;
}

.pie-canvas {
  width: 100%;
  height: 100%;
}

.pie-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
}
</style>
