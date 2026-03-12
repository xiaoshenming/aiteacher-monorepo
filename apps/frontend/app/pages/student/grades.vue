<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const grades = ref<any[]>([])
const summary = ref<any[]>([])

const typeLabels: Record<string, string> = {
  homework: '作业', quiz: '测验', exam: '考试',
}
const typeColors: Record<string, string> = {
  homework: 'info', quiz: 'neutral', exam: 'error',
}

const cardGradients = [
  'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
  'from-orange-500/10 to-amber-500/10 border-orange-500/20',
  'from-rose-500/10 to-red-500/10 border-rose-500/20',
  'from-indigo-500/10 to-violet-500/10 border-indigo-500/20',
]
const cardAccents = [
  'text-blue-600 dark:text-blue-400',
  'text-purple-600 dark:text-purple-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-orange-600 dark:text-orange-400',
  'text-rose-600 dark:text-rose-400',
  'text-indigo-600 dark:text-indigo-400',
]

const columns = [
  { accessorKey: 'title', header: '名称' },
  { accessorKey: 'course_name', header: '课程' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'score', header: '成绩' },
  { accessorKey: 'grade_time', header: '批改时间' },
  { accessorKey: 'feedback', header: '反馈' },
]

const totalAvg = computed(() => {
  if (!summary.value.length) return 0
  const sum = summary.value.reduce((a, s) => a + Number(s.avg_score || 0), 0)
  return (sum / summary.value.length).toFixed(1)
})

const totalExams = computed(() => {
  return summary.value.reduce((a, s) => a + Number(s.count || 0), 0)
})

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-blue-600 dark:text-blue-400'
  return 'text-orange-600 dark:text-orange-400'
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(async () => {
  try {
    const res = await apiFetch<{ code: number, data: { grades: any[], summary: any[] } }>('/students/grades')
    if (res.code === 200) {
      grades.value = res.data.grades
      summary.value = res.data.summary
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="成绩查询">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-8">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <template v-else>
          <!-- GPA 总览区域 -->
          <div
            v-if="summary.length"
            class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-900 p-8 text-white"
          >
            <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div class="relative z-10 flex flex-col sm:flex-row items-center gap-6">
              <div class="text-center sm:text-left">
                <p class="text-white/70 text-sm mb-1">总平均分</p>
                <p class="text-6xl font-bold tracking-tight">{{ totalAvg }}</p>
              </div>
              <div class="hidden sm:block w-px h-16 bg-white/20" />
              <div class="flex gap-8 text-center">
                <div>
                  <p class="text-3xl font-bold">{{ summary.length }}</p>
                  <p class="text-white/70 text-xs mt-1">科目数</p>
                </div>
                <div>
                  <p class="text-3xl font-bold">{{ totalExams }}</p>
                  <p class="text-white/70 text-xs mt-1">考核总次数</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 各科成绩汇总卡片 -->
          <div v-if="summary.length">
            <h2 class="text-base font-semibold text-highlighted mb-4">各科成绩汇总</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(s, i) in summary" :key="s.course_name"
                class="rounded-xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02] hover:shadow-lg"
                :class="cardGradients[i % cardGradients.length]"
              >
                <div class="flex items-start justify-between mb-3">
                  <p class="text-sm font-semibold text-highlighted">
                    {{ s.course_name || '未知课程' }}
                  </p>
                  <span class="text-xs text-muted bg-default/50 rounded-full px-2 py-0.5">
                    {{ s.count }} 次考核
                  </span>
                </div>
                <p class="text-4xl font-bold mb-3" :class="scoreColor(Number(s.avg_score))">
                  {{ s.avg_score }}
                </p>
                <!-- 进度条 -->
                <div class="w-full h-2 rounded-full bg-default/30 mb-3">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="Number(s.avg_score) >= 90 ? 'bg-emerald-500' : Number(s.avg_score) >= 70 ? 'bg-blue-500' : 'bg-orange-500'"
                    :style="{ width: `${Math.min(Number(s.avg_score), 100)}%` }"
                  />
                </div>
                <div class="flex justify-between text-xs text-muted">
                  <span>最高 <span class="font-medium" :class="cardAccents[i % cardAccents.length]">{{ s.max_score }}</span></span>
                  <span>最低 <span class="font-medium" :class="cardAccents[i % cardAccents.length]">{{ s.min_score }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 成绩明细表格 -->
          <div>
            <h2 class="text-base font-semibold text-highlighted mb-4">成绩明细</h2>
            <div v-if="grades.length === 0" class="text-center py-12 text-muted">
              暂无成绩记录
            </div>
            <UTable v-else :data="grades" :columns="columns">
              <template #type-cell="{ row }">
                <UBadge
                  :color="typeColors[row.original.type] || 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ typeLabels[row.original.type] || row.original.type }}
                </UBadge>
              </template>
              <template #score-cell="{ row }">
                <span class="font-bold text-lg" :class="scoreColor(Number(row.original.score))">
                  {{ row.original.score }}
                </span>
                <span class="text-muted text-xs">/{{ row.original.total_score }}</span>
              </template>
              <template #grade_time-cell="{ row }">
                {{ formatDate(row.original.grade_time) }}
              </template>
              <template #feedback-cell="{ row }">
                <span
                  v-if="row.original.feedback"
                  class="inline-block text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg px-3 py-1.5 max-w-xs"
                >
                  {{ row.original.feedback }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </UTable>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
