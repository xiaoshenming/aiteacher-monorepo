<script setup lang="ts">
const props = defineProps<{
  aiUsage: { details: Array<{ date: string, model_name: string, total_calls: number, total_tokens: number }> } | null
  totalCalls: number
  totalTokens: number
  popularFunctions: Array<{ function_name: string, total_calls: number }>
  loading?: boolean
}>()

const modelNames: Record<string, string> = {
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek R1',
  'qwen-turbo': 'Qwen Turbo',
  'qwen-plus': 'Qwen Plus',
  'qwen-max': 'Qwen Max',
}

const dailyAvg = computed(() => {
  if (!props.totalCalls) return '--'
  return Math.round(props.totalCalls / 30)
})

const topModel = computed(() => {
  if (!props.aiUsage?.details?.length) return '--'
  const map = new Map<string, number>()
  for (const d of props.aiUsage.details) {
    map.set(d.model_name, (map.get(d.model_name) || 0) + Number(d.total_calls))
  }
  let best = ''
  let max = 0
  for (const [name, calls] of map) {
    if (calls > max) { max = calls; best = name }
  }
  return modelNames[best] || best || '--'
})

const busiestDay = computed(() => {
  if (!props.aiUsage?.details?.length) return '--'
  const map = new Map<string, number>()
  for (const d of props.aiUsage.details) {
    map.set(d.date, (map.get(d.date) || 0) + Number(d.total_calls))
  }
  let best = ''
  let max = 0
  for (const [date, calls] of map) {
    if (calls > max) { max = calls; best = date }
  }
  if (!best) return '--'
  const parts = best.split('-')
  return `${parts[1]}-${parts[2]}`
})

const avgTokens = computed(() => {
  if (!props.totalCalls || !props.totalTokens) return '--'
  return Math.round(props.totalTokens / props.totalCalls)
})

const functionNames: Record<string, string> = {
  ai_chat_stream: 'AI 对话(流式)',
  ai_chat: 'AI 对话',
  editor_assistant: '编辑器助手',
  smart_complete: '智能补全',
  generate_lesson_plan: '生成教案',
  print_generate: '打印生成',
  ai_topic: 'AI 出题',
}

const topFunction = computed(() => {
  const name = props.popularFunctions?.[0]?.function_name
  if (!name) return '--'
  return functionNames[name] || name
})

const insights = computed(() => [
  { icon: 'i-lucide-activity', label: '日均调用', value: dailyAvg.value },
  { icon: 'i-lucide-cpu', label: '最常用模型', value: topModel.value },
  { icon: 'i-lucide-calendar-check', label: '最活跃日期', value: busiestDay.value },
  { icon: 'i-lucide-gauge', label: '平均 Token/次', value: avgTokens.value },
  { icon: 'i-lucide-flame', label: '最热功能', value: topFunction.value },
])
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border-accented)]/60 bg-gradient-to-br from-[var(--ui-bg)] to-[var(--ui-bg-elevated)]/50 p-5 dark:border-white/[0.06]">
    <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-lightbulb" class="w-4 h-4" />
      AI 使用洞察
    </h3>

    <template v-if="loading">
      <div class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <USkeleton class="w-8 h-8 rounded-lg shrink-0" />
          <div class="flex-1 flex items-center justify-between">
            <USkeleton class="h-3.5 w-16" />
            <USkeleton class="h-3.5 w-12" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="divide-y divide-[var(--ui-border)]/50">
        <div
          v-for="(item, index) in insights"
          :key="index"
          class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UIcon :name="item.icon" class="w-4 h-4 text-primary" />
          </div>
          <span class="text-sm text-[var(--ui-text-muted)] flex-1">{{ item.label }}</span>
          <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">{{ item.value }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
