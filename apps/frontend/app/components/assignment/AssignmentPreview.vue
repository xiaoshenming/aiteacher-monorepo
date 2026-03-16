<script setup lang="ts">
const props = defineProps<{
  assignment: any
  questions: any[]
}>()
const emit = defineEmits<{ 'update:questions': [value: any[]] }>()

const typeLabels: Record<string, string> = {
  single_choice: '单选',
  multiple_choice: '多选',
  true_false: '判断',
  fill_blank: '填空',
  short_answer: '简答',
  essay: '论述',
}

function moveUp(index: number) {
  if (index <= 0) return
  const list = [...props.questions]
  ;[list[index - 1], list[index]] = [list[index], list[index - 1]]
  emit('update:questions', list)
}

function moveDown(index: number) {
  if (index >= props.questions.length - 1) return
  const list = [...props.questions]
  ;[list[index], list[index + 1]] = [list[index + 1], list[index]]
  emit('update:questions', list)
}

function updateScore(index: number, score: number) {
  const list = [...props.questions]
  list[index] = { ...list[index], score }
  emit('update:questions', list)
}

function removeQuestion(index: number) {
  const list = [...props.questions]
  list.splice(index, 1)
  emit('update:questions', list)
}

const totalScore = computed(() => props.questions.reduce((sum, q) => sum + (q.score || 0), 0))
</script>

<template>
  <div class="space-y-4">
    <div v-if="assignment" class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50">
      <h4 class="font-semibold text-highlighted mb-2">{{ assignment.title }}</h4>
      <p v-if="assignment.description" class="text-sm text-muted">{{ assignment.description }}</p>
    </div>

    <div v-if="questions.length === 0" class="text-center py-6 text-muted">
      未选择题目
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="(q, i) in questions" :key="q.id"
        class="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50"
      >
        <span class="text-sm font-medium text-muted w-6 text-center">{{ i + 1 }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <UBadge variant="subtle" size="xs" color="primary">{{ typeLabels[q.type] || q.type }}</UBadge>
          </div>
          <p class="text-sm text-highlighted line-clamp-1">{{ q.content }}</p>
        </div>
        <div class="flex items-center gap-1">
          <UInput v-model.number="q.score" type="number" class="w-16" size="xs" @update:model-value="(v: any) => updateScore(i, Number(v))" />
          <span class="text-xs text-muted">分</span>
        </div>
        <div class="flex gap-0.5">
          <UButton size="xs" variant="ghost" icon="i-lucide-chevron-up" :disabled="i === 0" @click="moveUp(i)" />
          <UButton size="xs" variant="ghost" icon="i-lucide-chevron-down" :disabled="i === questions.length - 1" @click="moveDown(i)" />
          <UButton size="xs" variant="ghost" color="error" icon="i-lucide-x" @click="removeQuestion(i)" />
        </div>
      </div>
    </div>

    <div class="flex justify-end text-sm text-muted">
      共 {{ questions.length }} 题，总分 {{ totalScore }}
    </div>
  </div>
</template>
