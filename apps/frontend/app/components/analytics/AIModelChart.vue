<script setup lang="ts">
import type { AIUsageDetail } from '~/types/analytics'

const props = defineProps<{
  details: AIUsageDetail[]
  loading?: boolean
}>()

const chartRef = ref<HTMLElement | null>(null)

const chartOption = computed(() => {
  const modelMap = new Map<string, number>()
  for (const d of props.details) {
    const current = modelMap.get(d.model_name) ?? 0
    modelMap.set(d.model_name, current + Number(d.total_calls))
  }

  const data = Array.from(modelMap.entries()).map(([name, value]) => ({
    name: formatModelName(name),
    value,
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 次 ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data,
        color: ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4'],
      },
    ],
  }
})

function formatModelName(name: string): string {
  const map: Record<string, string> = {
    'deepseek-chat': 'DeepSeek Chat',
    'deepseek-reasoner': 'DeepSeek Reasoner',
  }
  return map[name] ?? name
}
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
    <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
      AI 模型调用分布
    </h3>

    <template v-if="loading">
      <div class="flex items-center justify-center h-64">
        <div class="w-32 h-32 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-teal-500 animate-spin" />
      </div>
    </template>

    <template v-else-if="details.length === 0">
      <div class="flex flex-col items-center justify-center h-64 text-zinc-400">
        <UIcon name="i-lucide-pie-chart" class="w-10 h-10 mb-2 opacity-40" />
        <p class="text-sm">暂无数据</p>
      </div>
    </template>

    <template v-else>
      <div ref="chartRef" class="h-64">
        <VChart :option="chartOption" autoresize />
      </div>
    </template>
  </div>
</template>
