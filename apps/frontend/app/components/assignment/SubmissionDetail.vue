<script setup lang="ts">
const props = defineProps<{
  submission: any
  questions: any[]
}>()

const answers = computed(() => {
  if (!props.submission?.answers) return []
  try {
    return typeof props.submission.answers === 'string'
      ? JSON.parse(props.submission.answers)
      : props.submission.answers
  }
  catch { return [] }
})

const detailScores = computed(() => {
  if (!props.submission?.detail_scores) return []
  try {
    return typeof props.submission.detail_scores === 'string'
      ? JSON.parse(props.submission.detail_scores)
      : props.submission.detail_scores
  }
  catch { return [] }
})

function getStudentAnswer(index: number) {
  return answers.value[index]?.answer || answers.value[index] || ''
}

function getStandardAnswer(q: any) {
  return q?.answer || q?.correct_answer || ''
}

function getQuestionScore(index: number) {
  return detailScores.value[index]?.score ?? 0
}

function getMaxScore(q: any) {
  return q?.score || q?.points || 0
}

function getAISuggestion(index: number) {
  const ds = detailScores.value[index]
  if (ds?.ai_score != null) {
    return { score: ds.ai_score, feedback: ds.ai_feedback || '' }
  }
  return null
}
</script>

<template>
  <div v-if="!submission" class="flex items-center justify-center h-full text-muted">
    请选择一个提交查看详情
  </div>
  <div v-else class="space-y-4">
    <div class="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
      <div>
        <span class="font-medium text-highlighted">{{ submission.student_name || '学生' }}</span>
        <span class="text-sm text-muted ml-3">总分：{{ submission.score ?? '未评' }}</span>
      </div>
      <UBadge v-if="submission.status === 'graded'" variant="subtle" color="success">已批改</UBadge>
      <UBadge v-else variant="subtle" color="warning">待批改</UBadge>
    </div>

    <div class="space-y-3">
      <AssignmentQuestionGradeCard
        v-for="(q, i) in questions" :key="q.id || i"
        :question="q"
        :student-answer="getStudentAnswer(i)"
        :standard-answer="getStandardAnswer(q)"
        :score="getQuestionScore(i)"
        :max-score="getMaxScore(q)"
        :ai-suggestion="getAISuggestion(i)"
      />
    </div>

    <div v-if="submission.feedback" class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
      <p class="text-xs text-muted mb-1">总评</p>
      <p class="text-sm">{{ submission.feedback }}</p>
    </div>
  </div>
</template>
