<script setup lang="ts">
import type { AIUsageDetail } from '~/types/analytics'

const props = defineProps<{
  details: AIUsageDetail[]
  loading?: boolean
}>()

const chartOption = computed(() => {
  // 按日期聚合
  const dateMap = new Map<string, { calls: number, tokens: number }>()
  for (const d of props.details) {
    const existing = dateMap.get(d.date) ?? { calls: 0, tokens: 0 }
    existing.calls += Number(d.total_calls)
    existing.tokens += Number(d.total_tokens)
    dateMap.set(d.date, existing)
  }

  const sortedDates = Array.from(dateMap.keys()).sort()
  const callsData = sortedDates.map(d => dateMap.get(d)!.calls)
  const tokensData = sortedDates.map(d => dateMap.get(d)!.tokens)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sortedDates.map(d => d.slice(5)), // MM-DD
      axisLabel: { fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '调用次数',
        axisLabel: { fontSize: 11 },
      },
      {
        type: 'value',
        name: 'Token 消耗',
        axisLabel: { fontSize: 11 },
      },
    ],
    series: [
      {
        name: '调用次数',
        type: 'bar',
        yAxisIndex: 0,
        data: callsData,
        itemStyle: { color: '#14b8a6', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: 'Token 消耗',
        type: 'line',
        yAxisIndex: 1,
        data: tokensData,
        smooth: true,
        lineStyle: { color: '#6366f1', width: 2 },
        itemStyle: { color: '#6366f1' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.15)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0)' },
            ],
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
    <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
      AI 使用趋势
    </h3>

    <template v-if="loading">
      <div class="flex items-center justify-center h-72">
        <div class="space-y-3 w-full">
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
          <div class="h-48 bg-zinc-100 dark:bg-zinc-700/50 rounded animate-pulse" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </template>

    <template v-else-if="details.length === 0">
      <div class="flex flex-col items-center justify-center h-72 text-zinc-400">
        <UIcon name="i-lucide-bar-chart-3" class="w-10 h-10 mb-2 opacity-40" />
        <p class="text-sm">暂无数据</p>
      </div>
    </template>

    <template v-else>
      <div class="h-72">
        <VChart :option="chartOption" autoresize />
      </div>
    </template>
  </div>
</template>
