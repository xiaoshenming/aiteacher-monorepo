<script setup lang="ts">
import type { SystemStats, ExtendedStats } from '~/types/admin'

const userStore = useUserStore()
const { fetchHealth, fetchStats, fetchExtendedStats } = useAdminSystem()

const loading = ref(true)
const services = ref<{ name: string; status: string; latency?: number; message?: string }[]>([])
const stats = ref<SystemStats | null>(null)
const extended = ref<ExtendedStats | null>(null)

const statusTextColor: Record<string, string> = {
  healthy: 'text-green-500',
  unhealthy: 'text-red-500',
  unknown: 'text-yellow-500',
}
const statusBg: Record<string, string> = {
  healthy: 'bg-green-500',
  unhealthy: 'bg-red-500',
  unknown: 'bg-yellow-500',
}
const statusLabel: Record<string, string> = {
  healthy: '正常',
  unhealthy: '异常',
  unknown: '未知',
}
const statusCardBorder: Record<string, string> = {
  healthy: 'border-green-500/20',
  unhealthy: 'border-red-500/20',
  unknown: 'border-yellow-500/20',
}
const statusCardBg: Record<string, string> = {
  healthy: 'bg-green-500/5',
  unhealthy: 'bg-red-500/5',
  unknown: 'bg-yellow-500/5',
}

const roleNameMap: Record<string, string> = {
  '0': '学生',
  '1': '普通用户',
  '2': '教师',
  '3': '管理员',
  '4': '超级管理员',
}
const roleColorMap: Record<string, string> = {
  '0': 'success',
  '1': 'neutral',
  '2': 'info',
  '3': 'warning',
  '4': 'error',
}

async function load() {
  loading.value = true
  try {
    const [health, s, ext] = await Promise.all([
      fetchHealth(),
      fetchStats(),
      fetchExtendedStats(),
    ])
    services.value = health.services
    stats.value = s
    extended.value = ext
  }
  catch {}
  finally {
    loading.value = false
  }
}

const statCards = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { title: '总用户数', icon: 'i-lucide-users', value: s.totalUsers, color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
    { title: '教师数', icon: 'i-lucide-graduation-cap', value: s.totalTeachers, color: 'text-violet-500', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20' },
    { title: '学生数', icon: 'i-lucide-user', value: s.totalStudents, color: 'text-green-500', bg: 'bg-green-500/10', ring: 'ring-green-500/20' },
    { title: '课程数', icon: 'i-lucide-book-open', value: s.totalCourses, color: 'text-orange-500', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
    { title: '教案数', icon: 'i-lucide-file-text', value: s.totalLessonPlans, color: 'text-cyan-500', bg: 'bg-cyan-500/10', ring: 'ring-cyan-500/20' },
    { title: '录制数', icon: 'i-lucide-video', value: s.totalRecordings, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    { title: '文件数', icon: 'i-lucide-folder', value: s.totalFiles, color: 'text-yellow-500', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
    { title: '近7天活跃', icon: 'i-lucide-activity', value: s.todayActiveUsers, color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  ]
})

const aiTrendOption = computed(() => {
  const trend = extended.value?.aiTrend || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.map(t => t.date.slice(5)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [{
      name: 'AI调用次数',
      type: 'line',
      smooth: true,
      data: trend.map(t => t.calls),
      areaStyle: { opacity: 0.12, color: 'var(--ui-primary)' },
      lineStyle: { color: 'var(--ui-primary)', width: 2.5 },
      itemStyle: { color: 'var(--ui-primary)', borderWidth: 2, borderColor: '#fff' },
      showSymbol: false,
    }],
  }
})

const aiDistOption = computed(() => {
  const funcs = extended.value?.aiByFunction || []
  const nameMap: Record<string, string> = {
    ai_chat_stream: 'AI对话',
    editor_assistant: '编辑器助手',
    editor_completion: '编辑器补全',
    generate_lesson_plan: '教案生成',
    generate_print: '打印生成',
  }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: funcs.length
        ? funcs.map(f => ({ name: nameMap[f.name] || f.name, value: f.value }))
        : [{ name: '暂无数据', value: 1 }],
    }],
  }
})

const resourceOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['课程', '教案', '录制', '文件'],
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#9ca3af', fontSize: 12 },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#9ca3af', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  series: [{
    type: 'bar',
    data: [
      stats.value?.totalCourses || 0,
      stats.value?.totalLessonPlans || 0,
      stats.value?.totalRecordings || 0,
      stats.value?.totalFiles || 0,
    ],
    itemStyle: { borderRadius: [6, 6, 0, 0], color: 'var(--ui-primary)' },
    barMaxWidth: 56,
  }],
}))

function getAvatarLabel(username: string) {
  return username ? username.slice(0, 1).toUpperCase() : '?'
}

const totalAiCalls = computed(() => extended.value?.totalAiCalls ?? 0)
const totalTokens = computed(() => {
  const t = extended.value?.totalTokens ?? 0
  if (t >= 10000) return `${(t / 10000).toFixed(1)}w`
  return String(t)
})

onMounted(load)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="仪表盘">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="loading"
            @click="load"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">

        <!-- 欢迎横幅 -->
        <div class="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <!-- 装饰背景圆 -->
          <div class="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/8 blur-2xl" />
          <div class="pointer-events-none absolute right-20 bottom-0 w-24 h-24 rounded-full bg-violet-500/6 blur-xl" />

          <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <!-- 左侧信息 -->
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                <UIcon name="i-lucide-shield" class="text-3xl text-primary" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-highlighted">
                  欢迎回来，{{ userStore.userInfo.name || '管理员' }}
                </h1>
                <p class="text-sm text-muted mt-0.5">
                  {{ userStore.roleLabel }} · 管理后台
                </p>
                <div class="flex items-center gap-3 mt-2">
                  <div class="flex items-center gap-1.5 text-xs text-muted">
                    <UIcon name="i-lucide-zap" class="text-yellow-500 text-sm" />
                    <span>AI调用 <span class="font-semibold text-highlighted">{{ totalAiCalls }}</span> 次</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-muted">
                    <UIcon name="i-lucide-coins" class="text-blue-500 text-sm" />
                    <span>Token <span class="font-semibold text-highlighted">{{ totalTokens }}</span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧快捷操作 -->
            <div class="flex flex-wrap gap-2 shrink-0">
              <UButton
                icon="i-lucide-users"
                size="sm"
                variant="soft"
                color="primary"
                to="/admin/teachers"
              >
                管理教师
              </UButton>
              <UButton
                icon="i-lucide-bell"
                size="sm"
                variant="soft"
                color="neutral"
                to="/admin/notifications"
              >
                系统通知
              </UButton>
              <UButton
                icon="i-lucide-settings"
                size="sm"
                variant="soft"
                color="neutral"
                to="/admin/system"
              >
                系统设置
              </UButton>
            </div>
          </div>
        </div>

        <!-- 统计卡片 2排4列 -->
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">平台数据概览</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              v-for="card in statCards"
              :key="card.title"
              class="group relative overflow-hidden rounded-xl border border-default bg-default/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
            >
              <div class="flex items-start justify-between">
                <div :class="['p-2.5 rounded-xl ring-1', card.bg, card.ring]">
                  <UIcon :name="card.icon" :class="['text-xl', card.color]" />
                </div>
                <UIcon name="i-lucide-trending-up" class="text-sm text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="mt-3">
                <p class="text-2xl font-bold text-highlighted tracking-tight">
                  <span v-if="loading" class="inline-block w-10 h-6 bg-accented rounded animate-pulse" />
                  <span v-else>{{ card.value }}</span>
                </p>
                <p class="text-xs text-muted mt-0.5">{{ card.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 服务健康状态 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">服务健康状态</h3>
            <span class="text-xs text-muted">{{ loading ? '检测中...' : '实时状态' }}</span>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <template v-if="loading">
              <div
                v-for="i in 4"
                :key="i"
                class="h-16 rounded-xl bg-accented animate-pulse"
              />
            </template>
            <template v-else>
              <div
                v-for="svc in services"
                :key="svc.name"
                :class="[
                  'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                  statusCardBorder[svc.status] || 'border-default',
                  statusCardBg[svc.status] || 'bg-default/50',
                ]"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :class="[statusBg[svc.status] || 'bg-yellow-500', svc.status === 'healthy' ? 'animate-pulse' : '']"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-highlighted truncate">{{ svc.name }}</p>
                  <div class="flex items-center gap-1.5">
                    <p class="text-xs" :class="statusTextColor[svc.status] || 'text-yellow-500'">
                      {{ statusLabel[svc.status] || svc.status }}
                    </p>
                    <span v-if="svc.latency != null" class="text-xs text-muted">· {{ svc.latency }}ms</span>
                  </div>
                </div>
              </div>
              <div
                v-if="services.length === 0"
                class="col-span-4 text-center text-sm text-muted py-6 rounded-xl border border-dashed border-default"
              >
                暂无服务状态数据
              </div>
            </template>
          </div>
        </div>

        <!-- 图表区一：AI 趋势 + AI 功能分布 -->
        <ClientOnly>
          <div>
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">AI 使用分析</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <DashboardChartLazy
                title="AI 调用趋势"
                subtitle="近 30 天"
                :option="aiTrendOption"
                height="280px"
              />
              <DashboardChartLazy
                title="AI 功能分布"
                subtitle="按使用功能"
                :option="aiDistOption"
                height="280px"
              />
            </div>
          </div>
        </ClientOnly>

        <!-- 图表区二：资源统计 + 最近用户 -->
        <ClientOnly>
          <div>
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">资源 & 用户</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <!-- 资源统计柱图 -->
              <DashboardChartLazy
                title="资源统计"
                subtitle="平台内容总览"
                :option="resourceOption"
                height="280px"
              />

              <!-- 最近注册用户 -->
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wider mb-1">最近用户</p>
                      <p class="text-base font-semibold text-highlighted">最近注册</p>
                    </div>
                    <UButton
                      icon="i-lucide-arrow-right"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      to="/admin/users"
                    >
                      查看全部
                    </UButton>
                  </div>
                </template>

                <div class="space-y-2.5">
                  <!-- 骨架屏 -->
                  <template v-if="loading">
                    <div
                      v-for="i in 6"
                      :key="i"
                      class="flex items-center gap-3 animate-pulse"
                    >
                      <div class="w-8 h-8 rounded-full bg-accented shrink-0" />
                      <div class="flex-1 space-y-1.5">
                        <div class="h-3 bg-accented rounded w-28" />
                        <div class="h-2.5 bg-accented rounded w-20" />
                      </div>
                      <div class="h-5 bg-accented rounded w-14" />
                    </div>
                  </template>

                  <!-- 用户列表 -->
                  <template v-else>
                    <div
                      v-for="user in (extended?.recentUsers || [])"
                      :key="user.id"
                      class="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accented/50 transition-colors"
                    >
                      <UAvatar
                        :alt="getAvatarLabel(user.username)"
                        size="sm"
                        class="shrink-0"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-highlighted truncate">{{ user.username }}</p>
                        <p class="text-xs text-muted truncate">{{ user.schoolName || '未知学校' }}</p>
                      </div>
                      <UBadge
                        :color="(roleColorMap[user.role] as any) || 'neutral'"
                        variant="subtle"
                        size="xs"
                        class="shrink-0"
                      >
                        {{ roleNameMap[user.role] || '未知' }}
                      </UBadge>
                    </div>

                    <div
                      v-if="!extended?.recentUsers?.length"
                      class="text-center text-sm text-muted py-8"
                    >
                      暂无用户数据
                    </div>
                  </template>
                </div>
              </UCard>

            </div>
          </div>
        </ClientOnly>

      </div>
    </template>
  </UDashboardPanel>
</template>
