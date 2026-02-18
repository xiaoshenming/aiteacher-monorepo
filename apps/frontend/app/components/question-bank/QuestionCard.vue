<script setup lang="ts">
interface QuestionRow {
  id: number
  type: string
  difficulty: string
  subject: string
  content: string
  answer: string
  options?: string[] | null
  explanation?: string | null
  createTime?: string
}

const props = defineProps<{
  question: QuestionRow
  expanded: boolean
}>()

const emit = defineEmits<{
  toggle: [id: number]
  delete: [id: number]
}>()

const difficultyColors: Record<string, string> = {
  '简单': 'success',
  '中等': 'warning',
  '困难': 'error',
}
</script>

<template>
  <div class="border border-default rounded-lg overflow-hidden">
    <div
      class="flex items-center justify-between p-4 cursor-pointer hover:bg-elevated transition-colors"
      @click="emit('toggle', props.question.id)"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <UBadge variant="subtle" color="neutral">{{ props.question.type }}</UBadge>
        <UBadge variant="subtle" :color="(difficultyColors[props.question.difficulty] as any) || 'neutral'">{{ props.question.difficulty }}</UBadge>
        <span class="text-sm text-highlighted truncate">{{ props.question.content }}</span>
      </div>
      <div class="flex items-center gap-2 ml-2">
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          @click.stop="emit('delete', props.question.id)"
        />
        <UIcon
          :name="props.expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="text-muted"
        />
      </div>
    </div>
    <div v-if="props.expanded" class="px-4 pb-4 space-y-2 border-t border-default pt-3">
      <p class="text-sm"><span class="text-muted">科目：</span>{{ props.question.subject }}</p>
      <p class="text-sm"><span class="text-muted">题目：</span>{{ props.question.content }}</p>
      <div v-if="props.question.options && props.question.options.length" class="text-sm space-y-1">
        <p class="text-muted">选项：</p>
        <p v-for="opt in props.question.options" :key="opt" class="ml-4">{{ opt }}</p>
      </div>
      <p class="text-sm"><span class="text-muted">答案：</span><span class="text-primary font-medium">{{ props.question.answer }}</span></p>
      <p v-if="props.question.explanation" class="text-sm"><span class="text-muted">解析：</span>{{ props.question.explanation }}</p>
    </div>
  </div>
</template>
