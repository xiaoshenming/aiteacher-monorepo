<script setup lang="ts">
import type { ServiceHealth, SystemStats } from '~/types/admin'

const userStore = useUserStore()
const { fetchHealth, fetchStats } = useAdminSystem()

const services = ref<ServiceHealth[]>([])
const stats = ref<SystemStats | null>(null)
const loading = ref(true)

const statusColor: Record<string, string> = {
  healthy: 'bg-green-500',
  unhealthy: 'bg-red-500',
  unknown: 'bg-yellow-500',
}

const statusLabel: Record<string, string> = {
  healthy: '正常',
  unhealthy: '异常',
  unknown: '未知',
}

async function load() {
  loading.value = true
  try {
    const [health, s] = await Promise.all([fetchHealth(), fetchStats()])
    services.value = health.services
    stats.value = s
  }
  catch {
    // silent
  }
  finally {
    loading.value = false
  }
}

const statCards = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { title: '总用户数', icon: 'i-lucide-users', value: s.totalUsers },
    { title: '教师数', icon: 'i-lucide-graduation-cap', value: s.totalTeachers },
    { title: '学生数', icon: 'i-lucide-user', value: s.totalStudents },
    { title: '课程数', icon: 'i-lucide-book-open', value: s.totalCourses },
    { title: '教案数', icon: 'i-lucide-file-text', value: s.totalLessonPlans },
    { title: '文件数', icon: 'i-lucide-folder', value: s.totalFiles },
    { title: '录制数', icon: 'i-lucide-video', value: s.totalRecordings },
    { title: '今日活跃', icon: 'i-lucide-activity', value: s.todayActiveUsers },
  ]
})

const userDistOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '0' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: stats.value?.totalTeachers || 0, name: '教师' },
        { value: stats.value?.totalStudents || 0, name: '学生' },
        { value: Math.max(0, (stats.value?.totalUsers || 0) - (stats.value?.totalTeachers || 0) - (stats.value?.totalStudents || 0)), name: '其他' },
      ],
    },
  ],
}))

const resourceOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['课程', '教案', '文件', '录制'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: [
        stats.value?.totalCourses || 0,
        stats.value?.totalLessonPlans || 0,
        stats.value?.totalFiles || 0,
        stats.value?.totalRecordings || 0,
      ],
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: 'var(--ui-primary)',
      },
    },
  ],
}))

onMounted(load)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="首页">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="loading" @click="load" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Welcome -->
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-shield" class="text-2xl text-primary" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-highlighted">
              欢迎回来，{{ userStore.userInfo.name || '管理员' }}
            </h1>
            <p class="text-sm text-muted">
              {{ userStore.roleLabel }} · 管理后台
            </p>
          </div>
        </div>

        <USeparator />

        <!-- Service Health -->
        <div>
          <h3 class="text-sm font-medium text-muted mb-3">服务健康状态</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard v-for="svc in services" :key="svc.name">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full shrink-0" :class="statusColor[svc.status] || 'bg-gray-400'" />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">{{ svc.name }}</p>
                  <p class="text-xs text-muted">
                    {{ statusLabel[svc.status] || svc.status }}
                    <span v-if="svc.latency != null"> · {{ svc.latency }}ms</span>
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Stats -->
        <div>
          <h3 class="text-sm font-medium text-muted mb-3">平台统计</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <UCard v-for="card in statCards" :key="card.title">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon :name="card.icon" class="text-lg text-primary" />
                </div>
                <div>
                  <p class="text-xs text-muted">{{ card.title }}</p>
                  <p class="text-xl font-semibold text-highlighted">{{ card.value }}</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Charts -->
        <ClientOnly>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardChart title="用户分布" subtitle="角色" :option="userDistOption" />
            <DashboardChart title="资源统计" subtitle="平台" :option="resourceOption" />
          </div>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
