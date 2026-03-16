<script setup lang="ts">
const props = defineProps<{
  question: any
  selected: boolean
}>()

defineEmits<{ toggle: [] }>()

const difficultyColors: Record<string, string> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
}
const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}
const typeLabels: Record<string, string> = {
  single_choice: '单选',
  multiple_choice: '多选',
  true_false: '判断',
  fill_blank: '填空',
  short_answer: '简答',
  essay: '论述',
}
</script>

<template>
  <div
    class="p-3 rounded-xl border cursor-pointer transition-all duration-200"
    :class="selected
      ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700'"
    @click="$emit('toggle')"
  >
    <div class="flex items-start gap-3">
      <UCheckbox :model-value="selected" class="mt-0.5 pointer-events-none" :tabindex="-1" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <UBadge variant="subtle" size="xs" color="primary">
            {{ typeLabels[question.type] || question.type }}
          </UBadge>
          <UBadge variant="subtle" size="xs" :color="(difficultyColors[question.difficulty] as any) || 'neutral'">
            {{ difficultyLabels[question.difficulty] || question.difficulty }}
          </UBadge>
        </div>
        <p class="text-sm text-highlighted line-clamp-2">{{ question.content }}</p>
      </div>
    </div>
  </div>
</template>
