<script setup lang="ts">
import type { LessonPlan } from '~/composables/useLessonPlans'

defineProps<{
  plan: LessonPlan
}>()

const emit = defineEmits<{
  open: [plan: LessonPlan]
  delete: [plan: LessonPlan]
  share: [plan: LessonPlan]
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div
    class="group relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer"
    @click="emit('open', plan)"
  >
    <div class="p-4">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 flex-1 mr-2">
          {{ plan.name }}
        </h3>
        <button
          class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
          title="删除"
          @click.stop="emit('delete', plan)"
        >
          <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-500" />
        </button>
      </div>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-3 mb-3 min-h-[3rem]">
        {{ plan.content ? plan.content.replace(/[#*`>\-\[\]]/g, '').slice(0, 120) : '暂无内容' }}
      </p>
      <div class="flex items-center justify-between text-xs text-zinc-400">
        <span>{{ formatDate(plan.updated_at) }}</span>
        <div class="flex items-center gap-2">
          <button
            class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer"
            title="分享"
            @click.stop="emit('share', plan)"
          >
            <UIcon name="i-lucide-share-2" class="w-4 h-4 text-primary-500" />
          </button>
          <span
            class="px-1.5 py-0.5 rounded text-xs"
            :class="plan.status === 3 ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'"
          >
            {{ plan.status === 3 ? '已归档' : '编辑中' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
