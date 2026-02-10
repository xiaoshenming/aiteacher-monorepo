<script setup lang="ts">
import type { Recommendation } from '~/types/analytics'

defineProps<{
  recommendations: Recommendation[]
  loading?: boolean
}>()

function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    course: 'i-lucide-book-open',
    lesson: 'i-lucide-file-text',
    resource: 'i-lucide-folder',
    tool: 'i-lucide-wrench',
  }
  return map[type] ?? 'i-lucide-sparkles'
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    course: '课程',
    lesson: '教案',
    resource: '资源',
    tool: '工具',
  }
  return map[type] ?? type
}

function getMatchColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
  if (score >= 60) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20'
  return 'text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800'
}
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
    <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
      智能推荐
    </h3>

    <template v-if="loading">
      <div class="space-y-3">
        <div v-for="i in 4" :key="i" class="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <div class="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
            <div class="h-3 bg-zinc-100 dark:bg-zinc-700/50 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="recommendations.length === 0">
      <div class="flex flex-col items-center justify-center py-12 text-zinc-400">
        <UIcon name="i-lucide-sparkles" class="w-10 h-10 mb-2 opacity-40" />
        <p class="text-sm">暂无推荐</p>
      </div>
    </template>

    <template v-else>
      <div class="space-y-2">
        <div
          v-for="rec in recommendations"
          :key="rec.id"
          class="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors cursor-pointer"
        >
          <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
            <UIcon :name="getTypeIcon(rec.type)" class="w-4.5 h-4.5 text-indigo-500" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                {{ rec.title }}
              </p>
              <span
                class="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                :class="getMatchColor(rec.match_score)"
              >
                {{ rec.match_score }}%
              </span>
            </div>
            <p class="text-xs text-zinc-400 mt-0.5">
              {{ getTypeLabel(rec.type) }}
              <template v-if="rec.description">
                · {{ rec.description }}
              </template>
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
