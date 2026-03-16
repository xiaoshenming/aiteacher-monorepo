<script setup lang="ts">
const props = defineProps<{
  question: any
  studentAnswer: string
  standardAnswer: string
  score: number
  maxScore: number
  aiSuggestion?: { score: number, feedback: string } | null
}>()

const emit = defineEmits<{
  'update:score': [value: number]
  'update:feedback': [value: string]
}>()

const localScore = ref(props.score)
const localFeedback = ref('')

watch(() => props.score, (v) => { localScore.value = v })

function handleAcceptAI() {
  if (props.aiSuggestion) {
    localScore.value = props.aiSuggestion.score
    localFeedback.value = props.aiSuggestion.feedback
    emit('update:score', props.aiSuggestion.score)
    emit('update:feedback', props.aiSuggestion.feedback)
  }
}

const typeLabels: Record<string, string> = {
  single_choice: '单选', multiple_choice: '多选', true_false: '判断',
  fill_blank: '填空', short_answer: '简答', essay: '论述',
}
</script>

<template>
  <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UBadge variant="subtle" size="xs" color="primary">{{ typeLabels[question?.type] || question?.type }}</UBadge>
        <span class="text-xs text-muted">满分 {{ maxScore }}</span>
      </div>
      <div class="flex items-center gap-2">
        <UInput v-model.number="localScore" type="number" class="w-16" size="xs" :max="maxScore" :min="0"
          @update:model-value="emit('update:score', Number(localScore))" />
        <span class="text-xs text-muted">分</span>
      </div>
    </div>

    <p class="text-sm text-highlighted">{{ question?.content }}</p>

    <div class="grid grid-cols-2 gap-3">
      <div class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <p class="text-xs text-muted mb-1">学生答案</p>
        <p class="text-sm">{{ studentAnswer || '未作答' }}</p>
      </div>
      <div class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <p class="text-xs text-muted mb-1">标准答案</p>
        <p class="text-sm">{{ standardAnswer || '无' }}</p>
      </div>
    </div>

    <AssignmentAIGradeSuggestion v-if="aiSuggestion" :suggestion="aiSuggestion" @accept="handleAcceptAI" />

    <div>
      <label class="text-xs text-muted mb-1 block">评语</label>
      <UTextarea v-model="localFeedback" :rows="2" placeholder="输入评语..."
        @update:model-value="emit('update:feedback', localFeedback)" />
    </div>
  </div>
</template>
