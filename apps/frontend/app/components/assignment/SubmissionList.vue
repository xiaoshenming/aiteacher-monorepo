<script setup lang="ts">
defineProps<{
  submissions: any[]
  currentId?: number
}>()
defineEmits<{ select: [submission: any] }>()

const statusColors: Record<string, string> = {
  pending: 'neutral',
  submitted: 'warning',
  graded: 'success',
}
const statusLabels: Record<string, string> = {
  pending: '未提交',
  submitted: '待批改',
  graded: '已批改',
}

function formatTime(t: string | null) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="s in submissions" :key="s.id"
      class="p-3 rounded-lg cursor-pointer transition-all duration-150"
      :class="currentId === s.id
        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700'
        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent'"
      @click="$emit('select', s)"
    >
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium text-highlighted">{{ s.student_name || s.username || '学生' }}</span>
        <UBadge variant="subtle" size="xs" :color="(statusColors[s.status] as any) || 'neutral'">
          {{ statusLabels[s.status] || s.status }}
        </UBadge>
      </div>
      <div class="flex items-center justify-between text-xs text-muted">
        <span>{{ formatTime(s.submit_time) }}</span>
        <span v-if="s.score != null" class="font-medium" :class="s.score >= 90 ? 'text-green-600' : s.score >= 70 ? 'text-primary' : 'text-amber-600'">
          {{ s.score }}分
        </span>
      </div>
    </div>
    <div v-if="submissions.length === 0" class="text-center py-6 text-sm text-muted">
      暂无提交
    </div>
  </div>
</template>
