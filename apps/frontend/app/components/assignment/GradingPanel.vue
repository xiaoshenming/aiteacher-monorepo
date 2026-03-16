<script setup lang="ts">
const props = defineProps<{
  assignmentId: number
}>()

const toast = useToast()
const { apiFetch } = useApi()
const {
  submissions, currentSubmission, summary, loading, grading,
  fetchSubmissions, fetchSubmissionDetail, autoGrade, aiGrade,
  manualGrade, batchGrade, fetchSummary,
} = useGrading(computed(() => props.assignmentId))

const questions = ref<any[]>([])
const showSummary = ref(false)
const selectedSubmission = ref<any>(null)

async function loadQuestions() {
  try {
    const res = await apiFetch<{ code: number, data: any }>(`/assignments/${props.assignmentId}/questions`)
    if (res.code === 200) {
      questions.value = res.data || []
    }
  }
  catch {}
}

async function handleSelect(s: any) {
  selectedSubmission.value = s
  await fetchSubmissionDetail(s.id)
}

async function handleAutoGrade() {
  try {
    await autoGrade()
    toast.add({ title: '自动批改完成', color: 'success' })
  }
  catch {
    toast.add({ title: '自动批改失败', color: 'error' })
  }
}

async function handleAIGrade() {
  try {
    await aiGrade()
    toast.add({ title: 'AI 批改完成', color: 'success' })
  }
  catch {
    toast.add({ title: 'AI 批改失败', color: 'error' })
  }
}

async function handleBatchGrade() {
  const ids = submissions.value.filter((s: any) => s.status === 'submitted').map((s: any) => s.id)
  if (ids.length === 0) {
    toast.add({ title: '没有待确认的提交', color: 'warning' })
    return
  }
  try {
    await batchGrade(ids)
    toast.add({ title: '批量确认完成', color: 'success' })
  }
  catch {
    toast.add({ title: '批量确认失败', color: 'error' })
  }
}

async function handleShowSummary() {
  showSummary.value = !showSummary.value
  if (showSummary.value && !summary.value) {
    await fetchSummary()
  }
}

onMounted(() => {
  fetchSubmissions()
  loadQuestions()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700">
      <UButton size="sm" variant="soft" icon="i-lucide-zap" label="自动批改" :loading="grading" @click="handleAutoGrade" />
      <UButton size="sm" variant="soft" icon="i-lucide-sparkles" label="AI 批改" :loading="grading" @click="handleAIGrade" />
      <UButton size="sm" variant="soft" icon="i-lucide-check-check" label="批量确认" @click="handleBatchGrade" />
      <div class="flex-1" />
      <UButton size="sm" variant="ghost" icon="i-lucide-bar-chart-3" label="统计" @click="handleShowSummary" />
    </div>

    <!-- 统计面板 -->
    <div v-if="showSummary" class="p-4 border-b border-zinc-200 dark:border-zinc-700">
      <AssignmentGradeSummaryChart :summary="summary" />
    </div>

    <!-- 主内容区 -->
    <div class="flex flex-1 min-h-0">
      <!-- 左侧提交列表 -->
      <div class="w-[35%] border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto p-2">
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-xl" />
        </div>
        <AssignmentSubmissionList
          v-else
          :submissions="submissions"
          :current-id="selectedSubmission?.id"
          @select="handleSelect"
        />
      </div>
      <!-- 右侧详情 -->
      <div class="w-[65%] overflow-y-auto p-4">
        <AssignmentSubmissionDetail :submission="currentSubmission" :questions="questions" />
      </div>
    </div>
  </div>
</template>
