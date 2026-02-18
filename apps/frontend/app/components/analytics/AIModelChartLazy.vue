<script setup lang="ts">
import type { AIUsageDetail } from '~/types/analytics'

defineProps<{
  details: AIUsageDetail[]
  loading?: boolean
}>()

const AIModelChart = defineAsyncComponent(() =>
  import('./AIModelChart.vue')
)
</script>

<template>
  <Suspense>
    <AIModelChart :details="details" :loading="loading" />
    <template #fallback>
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
        <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
          AI 模型调用分布
        </h3>
        <div class="flex items-center justify-center h-64">
          <div class="w-10 h-10 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-teal-500 animate-spin" />
        </div>
      </div>
    </template>
  </Suspense>
</template>
