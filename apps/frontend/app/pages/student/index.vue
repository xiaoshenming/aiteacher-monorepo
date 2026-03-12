<script setup lang="ts">
const { apiFetch } = useApi()
const userStore = useUserStore()

const loading = ref(true)
const dashData = ref<any>(null)
const schedule = ref<any[]>([])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayStr = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
})

const todayDayNum = computed(() => {
  const d = new Date().getDay()
  return d === 0 ? 7 : d
})

const todayCourses = computed(() => {
  return schedule.value
    .filter(s => s.schedule_day === todayDayNum.value)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
})

const statCards = computed(() => {
  if (!dashData.value) return []
  return [
    { label: '我的课程', value: dashData.value.courseCount || 0, icon: 'i-lucide-book-open', color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
    { label: '作业完成率', value: `${dashData.value.completionRate || 0}%`, icon: 'i-lucide-check-circle', color: 'text-green-500', bg: 'bg-green-500/10', ring: 'ring-green-500/20' },
    { label: '平均分', value: dashData.value.avgScore || 0, icon: 'i-lucide-trophy', color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    { label: '待办作业', value: pendingCount.value, icon: 'i-lucide-clock', color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
  ]
})

const pendingCount = computed(() => {
  if (!dashData.value?.recentAssignments) return 0
  return dashData.value.recentAssignments.filter((a: any) => a.submission_status === 'pending').length
})

const completionProgress = computed(() => dashData.value?.completionRate || 0)

const shortcuts = [
  { label: '我的课程', icon: 'i-lucide-book-open', to: '/student/courses', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: '作业中心', icon: 'i-lucide-clipboard-list', to: '/student/assignments', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: '考试中心', icon: 'i-lucide-file-check', to: '/student/exams', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: '成绩查询', icon: 'i-lucide-trophy', to: '/student/grades', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: '课程表', icon: 'i-lucide-calendar-days', to: '/student/schedule', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { label: '学情数据', icon: 'i-lucide-bar-chart-3', to: '/student/data', color: 'text-pink-500', bg: 'bg-pink-500/10' },
]

const statusLabels: Record<string, string> = { pending: '待提交', submitted: '已提交', graded: '已批改' }
const statusColors: Record<string, string> = { pending: 'warning', submitted: 'info', graded: 'success' }

function formatDate(d: string | null) {
  if (!d) return '未设置'
  return new Date(d).toLocaleDateString('zh-CN')
}

function deadlineCountdown(d: string | null) {
  if (!d) return ''
  const diff = new Date(d).getTime() - Date.now()
  if (diff < 0) return '已截止'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `剩余 ${days}天${hours}小时`
  if (hours > 0) return `剩余 ${hours}小时`
  return '即将截止'
}

function scoreColor(score: number, total: number) {
  const pct = total > 0 ? (score / total) * 100 : 0
  if (pct >= 90) return 'text-green-500'
  if (pct >= 70) return 'text-blue-500'
  if (pct >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function formatTime(t: string | null) {
  if (!t) return ''
  return t.slice(0, 5)
}

onMounted(async () => {
  try {
    const [dashRes, scheduleRes] = await Promise.all([
      apiFetch<{ code: number, data: any }>('/students/dashboard-stats'),
      apiFetch<{ code: number, data: { schedule: any[] } }>('/students/schedule', { showError: false }),
    ])
    if (dashRes.code === 200) dashData.value = dashRes.data
    if (scheduleRes.code === 200) schedule.value = scheduleRes.data.schedule || []
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
        <!-- Welcome banner -->
        <div class="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div class="relative flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80">{{ todayStr }}</p>
              <h1 class="text-2xl font-bold mt-1">{{ greeting }}，{{ userStore.userInfo.name || '同学' }}</h1>
              <p class="text-sm text-white/70 mt-1">{{ userStore.roleLabel }} · 学生中心</p>
            </div>
            <div class="hidden sm:flex w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <UIcon name="i-lucide-graduation-cap" class="text-3xl" />
            </div>
          </div>
        </div>

        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-primary" />
        </div>

        <template v-else>
          <!-- Stat cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="s in statCards" :key="s.label"
              class="p-4 rounded-xl border border-default bg-default/50 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center ring-1" :class="[s.bg, s.ring]">
                  <UIcon :name="s.icon" class="text-lg" :class="s.color" />
                </div>
                <div>
                  <p class="text-xs text-muted">{{ s.label }}</p>
                  <p class="text-xl font-bold text-highlighted">{{ s.value }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Shortcuts -->
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <NuxtLink
              v-for="item in shortcuts" :key="item.to" :to="item.to"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-default hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="item.bg">
                <UIcon :name="item.icon" class="text-lg" :class="item.color" />
              </div>
              <span class="text-xs text-highlighted">{{ item.label }}</span>
            </NuxtLink>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Today's courses -->
            <div class="rounded-xl border border-default p-5">
              <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-calendar-clock" class="text-indigo-500" />
                今日课程
              </h2>
              <div v-if="todayCourses.length === 0" class="text-center py-6 text-muted text-sm">
                今天没有课程安排
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="(c, i) in todayCourses" :key="i"
                  class="flex items-center gap-3 p-3 rounded-lg bg-default/50"
                >
                  <div class="text-center shrink-0 w-14">
                    <p class="text-xs font-mono text-primary">{{ formatTime(c.start_time) }}</p>
                    <p class="text-xs text-muted">{{ formatTime(c.end_time) }}</p>
                  </div>
                  <div class="w-px h-8 bg-primary/30" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-highlighted truncate">{{ c.course_name }}</p>
                    <p class="text-xs text-muted">{{ c.teacher_name }} · {{ c.classroom }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Learning progress -->
            <div class="rounded-xl border border-default p-5">
              <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-trending-up" class="text-green-500" />
                学习进度
              </h2>
              <div class="flex flex-col items-center py-4">
                <div class="relative w-32 h-32">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="10" class="text-gray-200 dark:text-gray-700" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" class="text-primary" :stroke-dasharray="`${completionProgress * 3.267} 326.7`" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-2xl font-bold text-highlighted">{{ completionProgress }}%</span>
                  </div>
                </div>
                <p class="text-sm text-muted mt-3">本学期作业完成进度</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent assignments -->
            <div v-if="dashData?.recentAssignments?.length" class="rounded-xl border border-default p-5">
              <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-clipboard-list" class="text-orange-500" />
                近期作业
              </h2>
              <div class="space-y-2">
                <div
                  v-for="a in dashData.recentAssignments" :key="a.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-default/50"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-highlighted truncate">{{ a.title }}</p>
                    <p class="text-xs text-muted">{{ a.course_name }} · 截止 {{ formatDate(a.deadline) }}</p>
                    <p v-if="a.submission_status === 'pending'" class="text-xs text-red-500 mt-0.5">
                      {{ deadlineCountdown(a.deadline) }}
                    </p>
                  </div>
                  <UBadge :color="(statusColors[a.submission_status] as any) || 'neutral'" variant="subtle" class="shrink-0 ml-2">
                    {{ statusLabels[a.submission_status] || a.submission_status }}
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Recent grades -->
            <div v-if="dashData?.recentGrades?.length" class="rounded-xl border border-default p-5">
              <h2 class="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-award" class="text-amber-500" />
                最近成绩
              </h2>
              <div class="space-y-2">
                <div
                  v-for="(g, i) in dashData.recentGrades" :key="i"
                  class="flex items-center justify-between p-3 rounded-lg bg-default/50"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-highlighted truncate">{{ g.title }}</p>
                    <p class="text-xs text-muted">{{ g.course_name }}</p>
                  </div>
                  <span class="text-sm font-bold shrink-0 ml-2" :class="scoreColor(g.score, g.total_score)">
                    {{ g.score }}/{{ g.total_score }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
