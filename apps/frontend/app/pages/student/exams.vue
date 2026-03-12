<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const exams = ref<any[]>([])

const statusLabels: Record<string, string> = {
  pending: '未参加', submitted: '已提交', graded: '已批改',
}
const statusColors: Record<string, string> = {
  pending: 'warning', submitted: 'info', graded: 'success',
}

const columns = [
  { accessorKey: 'title', header: '考试名称' },
  { accessorKey: 'course_name', header: '科目' },
  { accessorKey: 'deadline', header: '考试时间' },
  { accessorKey: 'total_score', header: '满分' },
  { accessorKey: 'submission_status', header: '状态' },
  { accessorKey: 'score', header: '成绩' },
]

function formatDate(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(async () => {
  try {
    const res = await apiFetch<{ code: number, data: { exams: any[] } }>('/students/exams')
    if (res.code === 200) exams.value = res.data.exams
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="考试中心">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <div v-else-if="exams.length === 0" class="text-center py-12 text-muted">
          暂无考试
        </div>
        <UTable v-else :data="exams" :columns="columns">
          <template #deadline-cell="{ row }">
            {{ formatDate(row.original.deadline) }}
          </template>
          <template #submission_status-cell="{ row }">
            <UBadge :color="(statusColors[row.original.submission_status] as any) || 'neutral'" variant="subtle">
              {{ statusLabels[row.original.submission_status] || row.original.submission_status }}
            </UBadge>
          </template>
          <template #score-cell="{ row }">
            <span v-if="row.original.score !== null" class="font-medium">
              {{ row.original.score }}/{{ row.original.total_score }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
