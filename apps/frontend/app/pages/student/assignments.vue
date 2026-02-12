<script setup lang="ts">
const { assignments, loading, fetchAssignments } = useStudentAssignments()

const statusColors: Record<string, string> = {
  pending: 'warning',
  submitted: 'info',
  graded: 'success',
}

const statusLabels: Record<string, string> = {
  pending: '待提交',
  submitted: '已提交',
  graded: '已批改',
}

const columns = [
  { accessorKey: 'title', header: '作业标题' },
  { accessorKey: 'course_name', header: '课程' },
  { accessorKey: 'deadline', header: '截止日期' },
  { accessorKey: 'submission_status', header: '状态' },
  { accessorKey: 'score', header: '成绩' },
]

function formatDeadline(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchAssignments()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="作业中心">
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
        <div v-else-if="assignments.length === 0" class="text-center py-12 text-muted">
          暂无作业
        </div>
        <UTable v-else :data="assignments" :columns="columns">
          <template #deadline-cell="{ row }">
            {{ formatDeadline(row.original.deadline) }}
          </template>
          <template #submission_status-cell="{ row }">
            <UBadge :color="(statusColors[row.original.submission_status] as any) || 'neutral'" variant="subtle">
              {{ statusLabels[row.original.submission_status] || row.original.submission_status }}
            </UBadge>
          </template>
          <template #score-cell="{ row }">
            <span v-if="row.original.score !== null" class="font-medium">{{ row.original.score }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
