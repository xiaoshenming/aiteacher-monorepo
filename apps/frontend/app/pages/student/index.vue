<script setup lang="ts">
import type { Stat } from '~/types/dashboard'

const { apiFetch } = useApi()
const userStore = useUserStore()

const loading = ref(true)
const dashData = ref<any>(null)

const stats = computed<Stat[]>(() => {
  if (!dashData.value) return []
  return [
    { title: '我的课程', icon: 'i-lucide-book-open', value: dashData.value.courseCount || 0 },
    { title: '作业完成率', icon: 'i-lucide-check-circle', value: `${dashData.value.completionRate || 0}%` },
    { title: '平均分', icon: 'i-lucide-trophy', value: dashData.value.avgScore || 0 },
  ]
})

const shortcuts = [
  { label: '我的课程', icon: 'i-lucide-book-open', to: '/student/courses' },
  { label: '作业中心', icon: 'i-lucide-clipboard-list', to: '/student/assignments' },
  { label: '考试中心', icon: 'i-lucide-file-check', to: '/student/exams' },
  { label: '成绩查询', icon: 'i-lucide-trophy', to: '/student/grades' },
  { label: '课程表', icon: 'i-lucide-calendar-days', to: '/student/schedule' },
  { label: '学情数据', icon: 'i-lucide-bar-chart-3', to: '/student/data' },
]

function formatDate(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN')
}

const statusLabels: Record<string, string> = {
  pending: '待提交', submitted: '已提交', graded: '已批改',
}
const statusColors: Record<string, string> = {
  pending: 'warning', submitted: 'info', graded: 'success',
}

onMounted(async () => {
  try {
    const res = await apiFetch<{ code: number, data: any }>('/students/dashboard-stats')
    if (res.code === 200) dashData.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="首页">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-graduation-cap" class="text-2xl text-primary" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-highlighted">
              欢迎回来，{{ userStore.userInfo.name || '同学' }}
            </h1>
            <p class="text-sm text-muted">{{ userStore.roleLabel }} · 学生中心</p>
          </div>
        </div>

        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <template v-else>
          <ClientOnly>
            <DashboardStats v-if="stats.length" :stats="stats" />
          </ClientOnly>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <NuxtLink
              v-for="item in shortcuts" :key="item.to" :to="item.to"
              class="flex flex-col items-center gap-2 p-4 rounded-lg border border-default hover:bg-elevated transition-colors"
            >
              <UIcon :name="item.icon" class="text-2xl text-primary" />
              <span class="text-sm text-highlighted">{{ item.label }}</span>
            </NuxtLink>
          </div>

          <div v-if="dashData?.recentAssignments?.length" class="space-y-3">
            <h2 class="text-sm font-medium text-muted">近期作业</h2>
            <div class="space-y-2">
              <div
                v-for="a in dashData.recentAssignments" :key="a.id"
                class="flex items-center justify-between p-3 rounded-lg border border-default"
              >
                <div>
                  <p class="text-sm font-medium text-highlighted">{{ a.title }}</p>
                  <p class="text-xs text-muted">{{ a.course_name }} · 截止 {{ formatDate(a.deadline) }}</p>
                </div>
                <UBadge :color="(statusColors[a.submission_status] as any) || 'neutral'" variant="subtle">
                  {{ statusLabels[a.submission_status] || a.submission_status }}
                </UBadge>
              </div>
            </div>
          </div>

          <div v-if="dashData?.recentGrades?.length" class="space-y-3">
            <h2 class="text-sm font-medium text-muted">最近成绩</h2>
            <div class="space-y-2">
              <div
                v-for="(g, i) in dashData.recentGrades" :key="i"
                class="flex items-center justify-between p-3 rounded-lg border border-default"
              >
                <div>
                  <p class="text-sm font-medium text-highlighted">{{ g.title }}</p>
                  <p class="text-xs text-muted">{{ g.course_name }}</p>
                </div>
                <span class="text-sm font-semibold text-primary">{{ g.score }}/{{ g.total_score }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
