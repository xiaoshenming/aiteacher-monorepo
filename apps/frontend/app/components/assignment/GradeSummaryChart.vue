<script setup lang="ts">
const props = defineProps<{
  summary: any
}>()

const chartOption = computed(() => {
  if (!props.summary) return {}
  const dist = props.summary.score_distribution || {}
  const ranges = ['0-59', '60-69', '70-79', '80-89', '90-100']
  const data = ranges.map(r => dist[r] || 0)

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ranges,
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data,
      itemStyle: {
        color: '#14b8a6',
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: '50%',
    }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
  }
})
</script>

<template>
  <div v-if="summary" class="space-y-4">
    <div class="grid grid-cols-3 gap-3">
      <div class="p-3 rounded-xl bg-teal-500/10 text-center">
        <p class="text-xs text-muted mb-1">平均分</p>
        <p class="text-xl font-semibold text-teal-600 dark:text-teal-400">{{ summary.avg_score ?? '-' }}</p>
      </div>
      <div class="p-3 rounded-xl bg-green-500/10 text-center">
        <p class="text-xs text-muted mb-1">最高分</p>
        <p class="text-xl font-semibold text-green-600 dark:text-green-400">{{ summary.max_score ?? '-' }}</p>
      </div>
      <div class="p-3 rounded-xl bg-amber-500/10 text-center">
        <p class="text-xs text-muted mb-1">最低分</p>
        <p class="text-xl font-semibold text-amber-600 dark:text-amber-400">{{ summary.min_score ?? '-' }}</p>
      </div>
    </div>

    <ClientOnly>
      <DashboardDashboardChartLazy title="分数分布" :option="chartOption" height="240px" />
    </ClientOnly>
  </div>
  <div v-else class="text-center py-8 text-muted">
    暂无统计数据
  </div>
</template>
