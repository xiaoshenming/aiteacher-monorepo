<script setup lang="ts">
import type { PopularFunction } from '~/types/analytics'

defineProps<{
  functions: PopularFunction[]
  loading?: boolean
}>()

function formatFunctionName(name: string): string {
  const map: Record<string, string> = {
    ai_chat_stream: 'AI 对话',
    ai_generate_lesson: 'AI 生成教案',
    ai_generate_exam: 'AI 生成试卷',
    ai_analyze_data: 'AI 数据分析',
    ai_translate: 'AI 翻译',
  }
  return map[name] ?? name.replace(/_/g, ' ')
}

function getBarWidth(calls: number, maxCalls: number): string {
  if (maxCalls === 0) return '0%'
  return `${Math.max((calls / maxCalls) * 100, 8)}%`
}

const rankColors = ['text-amber-500', 'text-zinc-400', 'text-amber-700']
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
    <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
      AI 功能热度榜
    </h3>

    <template v-if="loading">
      <div class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-2/3" />
            <div class="h-2 bg-zinc-100 dark:bg-zinc-700/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="functions.length === 0">
      <div class="flex flex-col items-center justify-center py-12 text-zinc-400">
        <UIcon name="i-lucide-flame" class="w-10 h-10 mb-2 opacity-40" />
        <p class="text-sm">暂无数据</p>
      </div>
    </template>

    <template v-else>
      <div class="space-y-3">
        <div
          v-for="(fn, index) in functions"
          :key="fn.function_name"
          class="flex items-center gap-3"
        >
          <!-- 排名 -->
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="
              index < 3
                ? 'bg-amber-50 dark:bg-amber-900/20 ' + rankColors[index]
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            "
          >
            {{ index + 1 }}
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                {{ formatFunctionName(fn.function_name) }}
              </span>
              <span class="text-xs text-zinc-400 shrink-0 ml-2">
                {{ Number(fn.total_calls).toLocaleString() }} 次
              </span>
            </div>
            <!-- 进度条 -->
            <div class="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="index === 0 ? 'bg-teal-500' : index === 1 ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-500'"
                :style="{ width: getBarWidth(Number(fn.total_calls), Number(functions[0]?.total_calls ?? 0)) }"
              />
            </div>
            <p class="text-xs text-zinc-400 mt-0.5">
              {{ Number(fn.unique_users) }} 位用户使用
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
