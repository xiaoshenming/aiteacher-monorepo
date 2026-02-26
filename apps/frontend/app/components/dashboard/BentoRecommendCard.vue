<script setup lang="ts">
import type { Recommendation } from '~/types/analytics'

const props = defineProps<{
  recommendations: Recommendation[]
  loading?: boolean
}>()

const top4 = computed(() => props.recommendations.slice(0, 4))

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
  <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5">
    <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
      智能推荐
    </h3>

    <template v-if="loading">
      <div class="space-y-2.5">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3 p-2.5 rounded-lg">
          <div class="w-8 h-8 rounded-lg bg-[var(--ui-bg-elevated)] animate-pulse shrink-0" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3.5 bg-[var(--ui-bg-elevated)] rounded animate-pulse w-3/4" />
            <div class="h-3 bg-[var(--ui-bg-elevated)] rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="recommendations.length === 0">
      <div class="flex flex-col items-center justify-center py-10 text-[var(--ui-text-muted)]">
        <UIcon name="i-lucide-sparkles" class="w-10 h-10 mb-2 opacity-40" />
        <p class="text-sm">暂无推荐</p>
      </div>
    </template>

    <template v-else>
      <div class="space-y-1.5">
        <div
          v-for="rec in top4"
          :key="rec.id"
          class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
        >
          <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
            <UIcon :name="getTypeIcon(rec.type)" class="w-4 h-4 text-indigo-500" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-[var(--ui-text-highlighted)] truncate">
                {{ rec.title }}
              </p>
              <span
                class="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                :class="getMatchColor(rec.match_score)"
              >
                {{ rec.match_score }}%
              </span>
            </div>
            <p class="text-xs text-[var(--ui-text-muted)] mt-0.5">
              {{ getTypeLabel(rec.type) }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
