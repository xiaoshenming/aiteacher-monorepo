<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const grades = ref<any[]>([])
const summary = ref<any[]>([])

const typeLabels: Record<string, string> = {
  homework: '作业', quiz: '测验', exam: '考试',
}

const columns = [
  { accessorKey: 'title', header: '名称' },
  { accessorKey: 'course_name', header: '课程' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'score', header: '成绩' },
  { accessorKey: 'grade_time', header: '批改时间' },
  { accessorKey: 'feedback', header: '反馈' },
]

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
      <div class="p-6 space-y-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <template v-else>
          <div v-if="summary.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard v-for="s in summary" :key="s.course_name">
              <div class="space-y-1">
                <p class="text-sm font-medium text-highlighted">{{ s.course_name || '未知课程' }}</p>
                <div class="flex items-center gap-4 text-xs text-muted">
                  <span>平均分 <span class="text-primary font-semibold">{{ s.avg_score }}</span></span>
                  <span>最高 {{ s.max_score }}</span>
                  <span>最低 {{ s.min_score }}</span>
                  <span>共 {{ s.count }} 次</span>
                </div>
              </div>
            </UCard>
          </div>

          <div v-if="grades.length === 0" class="text-center py-12 text-muted">
            暂无成绩记录
          </div>
          <UTable v-else :data="grades" :columns="columns">
            <template #type-cell="{ row }">
              {{ typeLabels[row.original.type] || row.original.type }}
            </template>
            <template #score-cell="{ row }">
              <span class="font-medium">{{ row.original.score }}/{{ row.original.total_score }}</span>
            </template>
            <template #grade_time-cell="{ row }">
              {{ formatDate(row.original.grade_time) }}
            </template>
            <template #feedback-cell="{ row }">
              <span class="text-sm">{{ row.original.feedback || '-' }}</span>
            </template>
          </UTable>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
