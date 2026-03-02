<script setup lang="ts">
import type { ExtendedStats, MonitorSystemData, MonitorService, MonitorStats } from '~/types/admin'

const userStore = useUserStore()
const { fetchExtendedStats, fetchMonitorSystem, fetchMonitorServices, fetchMonitorStats } = useAdminSystem()

const loading = ref(true)
const extended = ref<ExtendedStats | null>(null)
const systemData = ref<MonitorSystemData | null>(null)
const services = ref<MonitorService[]>([])
const monitorStats = ref<MonitorStats | null>(null)

async function load() {
  loading.value = true
  try {
    const [ext, sys, svcs, mStats] = await Promise.all([
      fetchExtendedStats(),
      fetchMonitorSystem(),
      fetchMonitorServices(),
      fetchMonitorStats(),
    ])
    extended.value = ext
    systemData.value = sys
    services.value = svcs
    monitorStats.value = mStats
  } catch {}
  finally { loading.value = false }
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 格式化运行时间
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天 ${h}时`
  if (h > 0) return `${h}时 ${m}分`
  return `${m}分`
}

// AI功能分布图
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
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: funcs.length
        ? funcs.map(f => ({ name: nameMap[f.name] || f.name, value: f.value }))
        : [{ name: '暂无数据', value: 1 }],
    }],
  }
})

// 学校用户分布横向柱图
const schoolOption = computed(() => {
  const schools = extended.value?.schoolStats || []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: schools.map(s => s.schoolName || '未知学校'),
    },
    series: [{
      type: 'bar',
      data: schools.map(s => s.userCount),
      itemStyle: { borderRadius: [0, 4, 4, 0], color: 'var(--ui-primary)' },
    }],
  }
})

// AI Token 消耗趋势折线图
const tokenTrendOption = computed(() => {
  const trend = extended.value?.aiTrend || []
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const p = params[0]
        return `${p.name}<br/>Token 消耗: ${p.value.toLocaleString()}`
      },
    },
    grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: trend.map(t => t.date.slice(5)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: 'Token消耗',
      type: 'line',
      smooth: true,
      data: trend.map(t => t.tokens),
      areaStyle: { opacity: 0.1, color: '#8b5cf6' },
      lineStyle: { color: '#8b5cf6', width: 2 },
      itemStyle: { color: '#8b5cf6' },
    }],
  }
})

// 快捷导航项
const navItems = [
  { title: '系统监控', desc: '实时资源监控', icon: 'i-lucide-monitor', to: '/superadmin/monitor', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { title: '安全审计', desc: '登录与权限', icon: 'i-lucide-shield-check', to: '/superadmin/security', color: 'text-red-500', bg: 'bg-red-500/10' },
  { title: '数据备份', desc: '备份与恢复', icon: 'i-lucide-database', to: '/superadmin/backup', color: 'text-green-500', bg: 'bg-green-500/10' },
  { title: '系统日志', desc: '日志查询', icon: 'i-lucide-scroll-text', to: '/superadmin/logs', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { title: '用户管理', desc: '全平台用户', icon: 'i-lucide-users', to: '/superadmin/users', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { title: 'PPT配置', desc: 'AI PPT 设置', icon: 'i-lucide-presentation', to: '/superadmin/ppt-config', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
]

// 获取资源使用率颜色
function resourceColor(usage: number): string {
  if (usage < 50) return 'success'
  if (usage < 80) return 'warning'
  return 'error'
}

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
          <UButton icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="loading" @click="load" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">

        <!-- 欢迎横幅 -->
        <div class="rounded-2xl bg-gradient-to-r from-violet-500/15 via-violet-500/5 to-transparent border border-violet-500/20 p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center ring-2 ring-violet-500/30">
                <UIcon name="i-lucide-crown" class="text-3xl text-violet-500" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-highlighted">
                  欢迎回来，{{ userStore.userInfo.name || '超级管理员' }}
                </h1>
                <p class="text-sm text-muted mt-0.5">
                  {{ userStore.roleLabel }} · 超级管理后台
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 text-xs text-muted">
              <div class="flex items-center gap-1.5">
                <UIcon name="i-lucide-server" class="text-sm" />
                <span>{{ systemData?.system.hostname || '...' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UIcon name="i-lucide-clock" class="text-sm" />
                <span>运行 {{ systemData ? formatUptime(systemData.system.uptime) : '...' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UIcon name="i-lucide-code-2" class="text-sm" />
                <span>{{ systemData?.system.nodeVersion || '...' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4个核心业务指标 -->
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">业务概览</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="rounded-xl border border-default bg-default/50 p-4">
              <div class="p-2 rounded-lg bg-blue-500/10 w-fit">
                <UIcon name="i-lucide-users" class="text-lg text-blue-500" />
              </div>
              <p class="text-2xl font-bold text-highlighted mt-3">{{ loading ? '—' : (monitorStats?.totalUsers ?? 0) }}</p>
              <p class="text-xs text-muted mt-0.5">平台总用户</p>
            </div>
            <div class="rounded-xl border border-default bg-default/50 p-4">
              <div class="p-2 rounded-lg bg-green-500/10 w-fit">
                <UIcon name="i-lucide-activity" class="text-lg text-green-500" />
              </div>
              <p class="text-2xl font-bold text-highlighted mt-3">{{ loading ? '—' : (monitorStats?.todayActive ?? 0) }}</p>
              <p class="text-xs text-muted mt-0.5">今日活跃用户</p>
            </div>
            <div class="rounded-xl border border-default bg-default/50 p-4">
              <div class="p-2 rounded-lg bg-orange-500/10 w-fit">
                <UIcon name="i-lucide-book-open" class="text-lg text-orange-500" />
              </div>
              <p class="text-2xl font-bold text-highlighted mt-3">{{ loading ? '—' : (monitorStats?.totalCourses ?? 0) }}</p>
              <p class="text-xs text-muted mt-0.5">平台总课程</p>
            </div>
            <div class="rounded-xl border border-default bg-default/50 p-4">
              <div class="p-2 rounded-lg bg-violet-500/10 w-fit">
                <UIcon name="i-lucide-cpu" class="text-lg text-violet-500" />
              </div>
              <p class="text-2xl font-bold text-highlighted mt-3">
                {{ loading ? '—' : ((extended?.totalAiCalls ?? monitorStats?.aiCalls ?? 0).toLocaleString()) }}
              </p>
              <p class="text-xs text-muted mt-0.5">AI 总调用次数</p>
            </div>
          </div>
        </div>

        <!-- 系统资源监控 -->
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">系统资源</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- CPU -->
            <UCard>
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 rounded-lg bg-blue-500/10">
                  <UIcon name="i-lucide-cpu" class="text-xl text-blue-500" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-highlighted">CPU</p>
                  <p class="text-xs text-muted">{{ systemData?.cpu.cores || '—' }} 核心</p>
                </div>
              </div>
              <div class="text-center my-2">
                <span class="text-4xl font-bold text-highlighted">{{ loading ? '—' : (systemData?.cpu.usage ?? 0) }}</span>
                <span class="text-lg text-muted">%</span>
              </div>
              <UProgress
                :value="systemData?.cpu.usage ?? 0"
                :color="resourceColor(systemData?.cpu.usage ?? 0) as any"
                class="mt-3"
              />
              <p class="text-xs text-muted mt-2 text-center">
                负载: {{ systemData?.cpu.loadAvg?.map((v: number) => v.toFixed(2)).join(' / ') || '—' }}
              </p>
            </UCard>

            <!-- 内存 -->
            <UCard>
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 rounded-lg bg-green-500/10">
                  <UIcon name="i-lucide-memory-stick" class="text-xl text-green-500" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-highlighted">内存</p>
                  <p class="text-xs text-muted">{{ systemData ? formatBytes(systemData.memory.total) : '—' }}</p>
                </div>
              </div>
              <div class="text-center my-2">
                <span class="text-4xl font-bold text-highlighted">{{ loading ? '—' : (systemData?.memory.usage ?? 0) }}</span>
                <span class="text-lg text-muted">%</span>
              </div>
              <UProgress
                :value="systemData?.memory.usage ?? 0"
                :color="resourceColor(systemData?.memory.usage ?? 0) as any"
                class="mt-3"
              />
              <p class="text-xs text-muted mt-2 text-center">
                已用 {{ systemData ? formatBytes(systemData.memory.used) : '—' }} / 可用 {{ systemData ? formatBytes(systemData.memory.free) : '—' }}
              </p>
            </UCard>

            <!-- 磁盘 -->
            <UCard>
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 rounded-lg bg-orange-500/10">
                  <UIcon name="i-lucide-hard-drive" class="text-xl text-orange-500" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-highlighted">磁盘</p>
                  <p class="text-xs text-muted">{{ systemData?.disk.total || '—' }}</p>
                </div>
              </div>
              <div class="text-center my-2">
                <span class="text-4xl font-bold text-highlighted">{{ loading ? '—' : (systemData?.disk.usage ?? 0) }}</span>
                <span class="text-lg text-muted">%</span>
              </div>
              <UProgress
                :value="systemData?.disk.usage ?? 0"
                :color="resourceColor(systemData?.disk.usage ?? 0) as any"
                class="mt-3"
              />
              <p class="text-xs text-muted mt-2 text-center">
                已用 {{ systemData?.disk.used || '—' }} / 可用 {{ systemData?.disk.available || '—' }}
              </p>
            </UCard>
          </div>
        </div>

        <!-- 服务状态 -->
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">服务状态</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="svc in services"
              :key="svc.name"
              :class="[
                'rounded-xl border p-4 flex items-center gap-3',
                svc.status === 'online' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
              ]"
            >
              <span
                class="w-3 h-3 rounded-full shrink-0 animate-pulse"
                :class="svc.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-highlighted">{{ svc.name }}</p>
                <p class="text-xs" :class="svc.status === 'online' ? 'text-green-600' : 'text-red-600'">
                  {{ svc.status === 'online' ? '运行中' : '离线' }} · {{ svc.message }}
                </p>
              </div>
              <UBadge :color="svc.status === 'online' ? 'success' : 'error'" variant="subtle" size="xs">
                {{ svc.status === 'online' ? 'OK' : 'ERR' }}
              </UBadge>
            </div>
            <div
              v-if="!loading && services.length === 0"
              class="col-span-3 text-center text-sm text-muted py-4 rounded-xl border border-default"
            >
              服务状态加载中...
            </div>
          </div>
        </div>

        <!-- 图表区：AI分布 + 学校分布 -->
        <ClientOnly>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardChartLazy
              title="AI 功能分布"
              subtitle="按功能分类"
              :option="aiDistOption"
              height="280px"
            />
            <DashboardChartLazy
              title="学校用户分布"
              subtitle="各学校用户数"
              :option="schoolOption"
              height="280px"
            />
          </div>
        </ClientOnly>

        <!-- AI Token 消耗趋势（全宽） -->
        <ClientOnly>
          <DashboardChartLazy
            title="AI Token 消耗趋势"
            subtitle="近 30 天 Token 消耗量"
            :option="tokenTrendOption"
            height="240px"
          />
        </ClientOnly>

        <!-- 快捷导航 -->
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">快捷导航</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-xl border border-default bg-default/50 p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer text-center group"
            >
              <div :class="['p-2.5 rounded-xl w-fit mx-auto mb-2', item.bg]">
                <UIcon :name="item.icon" :class="['text-xl', item.color]" />
              </div>
              <p class="text-xs font-semibold text-highlighted group-hover:text-primary transition-colors">{{ item.title }}</p>
              <p class="text-xs text-muted mt-0.5">{{ item.desc }}</p>
            </NuxtLink>
          </div>
        </div>

      </div>
    </template>
  </UDashboardPanel>
</template>
