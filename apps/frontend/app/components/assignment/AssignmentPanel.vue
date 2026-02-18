<script setup lang="ts">
const toast = useToast()
const { assignments, loading, fetchAssignments, createAssignment, deleteAssignment, publishAssignment, closeAssignment, fetchTeacherClasses, fetchTeacherCourses } = useAssignments()

const statusColors: Record<string, string> = {
  draft: 'neutral',
  published: 'success',
  closed: 'warning',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  closed: '已截止',
}

const typeLabels: Record<string, string> = {
  homework: '作业',
  quiz: '测验',
  exam: '考试',
}

const columns = [
  { accessorKey: 'title', header: '标题' },
  { accessorKey: 'class_name', header: '班级' },
  { accessorKey: 'course_name', header: '课程' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'deadline', header: '截止日期' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'actions', header: '操作' },
]

const showModal = ref(false)
const classOptions = ref<{ label: string, value: number }[]>([])
const courseOptions = ref<{ label: string, value: number }[]>([])

async function loadOptions() {
  const [classes, courses] = await Promise.all([
    fetchTeacherClasses(),
    fetchTeacherCourses(),
  ])
  classOptions.value = classes.map((c: any) => ({ label: c.class_name, value: c.id }))
  courseOptions.value = courses.map((c: any) => ({ label: c.name, value: c.id }))
}

async function handleSubmit(form: { title: string, description: string, course_id: number | undefined, class_id: number | undefined, type: string, deadline: string, total_score: number, status: string }) {
  if (!form.title) {
    toast.add({ title: '请填写作业标题', color: 'error' })
    return
  }
  try {
    const res = await createAssignment(form as any)
    if (res.code === 200) {
      showModal.value = false
      toast.add({ title: '创建成功', color: 'success' })
      fetchAssignments()
    }
    else {
      toast.add({ title: res.message || '创建失败', color: 'error' })
    }
  }
  catch {
    toast.add({ title: '创建失败', color: 'error' })
  }
}

async function handlePublish(id: number) {
  try {
    const res = await publishAssignment(id)
    if (res.code === 200) {
      toast.add({ title: '发布成功', color: 'success' })
      fetchAssignments()
    }
  }
  catch {
    toast.add({ title: '发布失败', color: 'error' })
  }
}

async function handleClose(id: number) {
  try {
    const res = await closeAssignment(id)
    if (res.code === 200) {
      toast.add({ title: '已截止', color: 'success' })
      fetchAssignments()
    }
  }
  catch {
    toast.add({ title: '操作失败', color: 'error' })
  }
}

async function handleDelete(id: number) {
  try {
    const res = await deleteAssignment(id)
    if (res.code === 200) {
      toast.add({ title: '删除成功', color: 'success' })
      fetchAssignments()
    }
  }
  catch {
    toast.add({ title: '删除失败', color: 'error' })
  }
}

function formatDeadline(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchAssignments()
  loadOptions()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="作业发布">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="发布作业" @click="showModal = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <div v-else-if="assignments.length === 0" class="text-center py-12 text-muted">
          暂无作业，点击右上角按钮发布第一个作业
        </div>
        <UTable v-else :data="assignments" :columns="columns">
          <template #type-cell="{ row }">
            {{ typeLabels[row.original.type] || row.original.type }}
          </template>
          <template #deadline-cell="{ row }">
            {{ formatDeadline(row.original.deadline) }}
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="(statusColors[row.original.status] as any) || 'neutral'" variant="subtle">
              {{ statusLabels[row.original.status] || row.original.status }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex gap-1">
              <UButton v-if="row.original.status === 'draft'" size="xs" variant="ghost" icon="i-lucide-send" title="发布" @click="handlePublish(row.original.id)" />
              <UButton v-if="row.original.status === 'published'" size="xs" variant="ghost" icon="i-lucide-lock" title="截止" @click="handleClose(row.original.id)" />
              <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" title="删除" @click="handleDelete(row.original.id)" />
            </div>
          </template>
        </UTable>
      </div>

      <AssignmentCreateAssignmentModal
        v-model:open="showModal"
        :class-options="classOptions"
        :course-options="courseOptions"
        @submit="handleSubmit"
      />
    </template>
  </UDashboardPanel>
</template>
