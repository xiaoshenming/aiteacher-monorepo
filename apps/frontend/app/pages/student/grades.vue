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
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 70) return 'text-primary'
  return 'text-amber-600 dark:text-amber-400'
}

function barColor(score: number) {
  if (score >= 90) return 'bg-green-500'
  if (score >= 70) return 'bg-primary'
  return 'bg-amber-500'
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
            class="rounded-xl border border-default p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
          >
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <div class="text-center sm:text-left">
                <p class="text-sm text-muted mb-1">总平均分</p>
                <p class="text-4xl font-bold text-primary">{{ totalAvg }}</p>
              </div>
              <div class="hidden sm:block w-px h-12 bg-zinc-200 dark:bg-zinc-700" />
              <div class="flex gap-8 text-center">
                <div>
                  <p class="text-2xl font-bold text-highlighted">{{ summary.length }}</p>
                  <p class="text-sm text-muted mt-0.5">科目数</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-highlighted">{{ totalExams }}</p>
                  <p class="text-sm text-muted mt-0.5">考核次数</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 各科成绩汇总卡片 -->
          <div v-if="summary.length">
            <h2 class="text-base font-semibold text-highlighted mb-4">各科成绩汇总</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="s in summary" :key="s.course_name"
                class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4"
              >
                <div class="flex items-start justify-between mb-3">
                  <p class="text-highlighted font-medium">
                    {{ s.course_name || '未知课程' }}
                  </p>
                  <span class="text-xs text-muted">
                    {{ s.count }} 次考核
                  </span>
                </div>
                <p class="text-2xl font-bold mb-3" :class="scoreColor(Number(s.avg_score))">
                  {{ s.avg_score }}
                </p>
                <div class="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 mb-3">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="barColor(Number(s.avg_score))"
                    :style="{ width: `${Math.min(Number(s.avg_score), 100)}%` }"
                  />
                </div>
                <div class="flex justify-between text-xs text-muted">
                  <span>最高 <span class="font-medium text-highlighted">{{ s.max_score }}</span></span>
                  <span>最低 <span class="font-medium text-highlighted">{{ s.min_score }}</span></span>
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
                  size="xs"
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
                  class="text-sm text-muted italic max-w-xs inline-block"
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
