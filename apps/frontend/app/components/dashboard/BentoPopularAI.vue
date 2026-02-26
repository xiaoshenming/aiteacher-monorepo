<script setup lang="ts">
import type { PopularFunction } from '~/types/analytics'

const props = defineProps<{
  functions: PopularFunction[]
  loading?: boolean
}>()

function formatFunctionName(name: string): string {
  const map: Record<string, string> = {
    ai_chat_stream: 'AI 对话(流式)',
    ai_chat: 'AI 对话',
    generate_lesson_plan: '生成教案',
    generate_print: '打印生成',
    ai_generate_lesson: 'AI 生成教案',
    ai_generate_exam: 'AI 生成试卷',
    ai_analyze_data: 'AI 数据分析',
    ai_translate: 'AI 翻译',
    editor_assistant: '编辑器助手',
    editor_completion: '智能补全',
    ai_summary: 'AI 摘要',
    ai_rewrite: 'AI 改写',
    ai_polish: 'AI 润色',
    ai_outline: 'AI 大纲',
    ai_expand: 'AI 扩写',
    ppt_generate: 'PPT 生成',
    ppt_polish: 'PPT 美化',
  }
  return map[name] ?? map[name.toLowerCase()] ?? name.replace(/_/g, ' ')
}

function getBarWidth(calls: number, maxCalls: number): string {
  if (maxCalls === 0) return '0%'
  return `${Math.max((calls / maxCalls) * 100, 8)}%`
}

const top5 = computed(() => {
  // 合并同名函数（不同模型的调用次数合并）
  const merged = new Map<string, { function_name: string, total_calls: number }>()
  for (const fn of props.functions) {
    const name = fn.function_name
    const existing = merged.get(name)
    if (existing) {
      existing.total_calls += Number(fn.total_calls) || 0
    }
    else {
      merged.set(name, { function_name: name, total_calls: Number(fn.total_calls) || 0 })
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.total_calls - a.total_calls)
    .slice(0, 5)
})
const maxCalls = computed(() => Number(top5.value[0]?.total_calls ?? 0))

const rankColors = ['text-amber-500', 'text-zinc-400', 'text-amber-700']
const rankBg = ['bg-amber-50 dark:bg-amber-900/20', 'bg-zinc-100 dark:bg-zinc-800', 'bg-amber-50 dark:bg-amber-900/20']
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5">
    <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-flame" class="w-4 h-4" />
      热门AI功能
    </h3>

    <template v-if="loading">
      <div class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-[var(--ui-bg-elevated)] animate-pulse shrink-0" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3.5 bg-[var(--ui-bg-elevated)] rounded animate-pulse w-2/3" />
            <div class="h-1.5 bg-[var(--ui-bg-elevated)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="functions.length === 0">
      <div class="flex flex-col items-center justify-center py-10 text-[var(--ui-text-muted)]">
        <UIcon name="i-lucide-flame" class="w-10 h-10 mb-2 opacity-40" />
        <p class="text-sm">暂无数据</p>
      </div>
    </template>

    <template v-else>
      <div class="space-y-2.5">
        <div v-for="(fn, index) in top5" :key="fn.function_name" class="flex items-center gap-3">
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="index < 3 ? `${rankBg[index]} ${rankColors[index]}` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'"
          >
            {{ index + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-[var(--ui-text-highlighted)] truncate">
                {{ formatFunctionName(fn.function_name) }}
              </span>
              <span class="text-xs text-[var(--ui-text-muted)] shrink-0 ml-2">
                {{ Number(fn.total_calls).toLocaleString() }} 次
              </span>
            </div>
            <div class="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="index === 0 ? 'bg-primary' : index === 1 ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-500'"
                :style="{ width: getBarWidth(Number(fn.total_calls), maxCalls) }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
