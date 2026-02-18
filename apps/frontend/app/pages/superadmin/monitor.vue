<script setup lang="ts">
const { apiFetch } = useApi()

interface SystemData {
  cpu: { usage: number; cores: number; model: string; loadAvg: number[] }
  memory: { total: number; used: number; free: number; usage: number }
  disk: { total: string; used: string; available: string; usage: number }
  system: {
    platform: string
    arch: string
    hostname: string
    uptime: number
    nodeVersion: string
    processUptime: number
    processMemory: { rss: number; heapUsed: number; heapTotal: number }
  }
}

interface ServiceItem {
  name: string
  status: 'online' | 'offline'
  message: string
}

interface BusinessStats {
  totalUsers: number
  todayActive: number
  totalCourses: number
  aiCalls: number
}

const systemData = ref<SystemData | null>(null)
const services = ref<ServiceItem[]>([])
const bizStats = ref<BusinessStats | null>(null)
const loading = ref(true)
const autoRefresh = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  parts.push(`${minutes}分钟`)
  return parts.join(' ')
}

function getUsageColor(usage: number): string {
  if (usage >= 90) return 'text-red-500'
  if (usage >= 70) return 'text-amber-500'
  return 'text-green-500'
}

function getProgressColor(usage: number): 'error' | 'warning' | 'success' {
  if (usage >= 90) return 'error'
  if (usage >= 70) return 'warning'
  return 'success'
}

function gaugeColor(value: number): string {
  if (value >= 90) return '#ef4444'
  if (value >= 70) return '#f59e0b'
  return '#22c55e'
}

function buildGaugeOption(title: string, value: number) {
  const color = gaugeColor(value)
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        radius: '90%',
        progress: { show: true, width: 14, roundCap: true, itemStyle: { color } },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 14, color: [[1, '#e5e7eb']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: true, offsetCenter: [0, '70%'], fontSize: 14, color: '#9ca3af' },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '30%'],
          fontSize: 28,
          fontWeight: 'bold',
          formatter: '{value}%',
          color,
        },
        data: [{ value, name: title }],
      },
    ],
  }
}

const cpuGaugeOption = computed(() => buildGaugeOption('CPU', systemData.value?.cpu.usage ?? 0))
const memGaugeOption = computed(() => buildGaugeOption('内存', systemData.value?.memory.usage ?? 0))

async function fetchData() {
  try {
    const [sysRes, svcRes, statsRes] = await Promise.all([
      apiFetch<{ code: number; data: SystemData }>('admin/monitor/system'),
      apiFetch<{ code: number; data: { services: ServiceItem[] } }>('admin/monitor/services'),
      apiFetch<{ code: number; data: BusinessStats }>('admin/monitor/stats'),
    ])
    if (sysRes.code === 200) systemData.value = sysRes.data
    if (svcRes.code === 200) services.value = svcRes.data.services
    if (statsRes.code === 200) bizStats.value = statsRes.data
  }
  catch (e) {
    console.error('监控数据加载失败', e)
  }
  finally {
    loading.value = false
  }
}

watch(autoRefresh, (val) => {
  if (val) {
    timer = setInterval(fetchData, 10000)
  }
  else {
    if (timer) clearInterval(timer)
    timer = null
  }
})

onMounted(fetchData)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="性能监控">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted">自动刷新</span>
            <USwitch v-model="autoRefresh" />
            <UButton icon="i-lucide-refresh-cw" variant="ghost" :loading="loading" @click="fetchData" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- 资源使用概览 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- CPU Gauge -->
          <ClientOnly>
            <DashboardChartLazy title="CPU 使用率" :subtitle="`${systemData?.cpu.cores ?? '-'} 核心`" :option="cpuGaugeOption" height="220px" />
          </ClientOnly>

          <!-- 内存 Gauge -->
          <ClientOnly>
            <DashboardChartLazy
              title="内存使用率"
              :subtitle="systemData ? `${formatBytes(systemData.memory.used)} / ${formatBytes(systemData.memory.total)}` : '-'"
              :option="memGaugeOption"
              height="220px"
            />
          </ClientOnly>

          <UCard>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted">磁盘使用率</span>
              <UIcon name="i-lucide-hard-drive" class="text-lg text-primary" />
            </div>
            <div class="text-2xl font-bold" :class="getUsageColor(systemData?.disk.usage ?? 0)">
              {{ systemData?.disk.usage ?? '-' }}%
            </div>
            <UProgress :value="systemData?.disk.usage ?? 0" :color="getProgressColor(systemData?.disk.usage ?? 0)" class="mt-2" />
            <p class="text-xs text-muted mt-1">
              {{ systemData?.disk.used ?? '-' }} / {{ systemData?.disk.total ?? '-' }}
            </p>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted">系统运行时间</span>
              <UIcon name="i-lucide-clock" class="text-lg text-primary" />
            </div>
            <div class="text-2xl font-bold text-highlighted">
              {{ systemData ? formatUptime(systemData.system.uptime) : '-' }}
            </div>
            <p class="text-xs text-muted mt-3">
              进程运行: {{ systemData ? formatUptime(systemData.system.processUptime) : '-' }}
            </p>
          </UCard>
        </div>

        <!-- 服务状态 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-activity" class="text-primary" />
              <span class="font-semibold">服务状态</span>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              v-for="svc in services"
              :key="svc.name"
              class="flex items-center gap-3 p-3 rounded-lg border border-default"
            >
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :class="svc.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
              />
              <div class="min-w-0">
                <div class="font-medium text-sm">
                  {{ svc.name }}
                </div>
                <div class="text-xs text-muted truncate">
                  {{ svc.message }}
                </div>
              </div>
              <UBadge
                :color="svc.status === 'online' ? 'success' : 'error'"
                variant="subtle"
                size="xs"
                class="ml-auto shrink-0"
              >
                {{ svc.status === 'online' ? '在线' : '离线' }}
              </UBadge>
            </div>
          </div>
          <div v-if="services.length === 0" class="text-center text-muted py-4">
            加载中...
          </div>
        </UCard>

        <!-- 业务统计 -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-users" class="text-2xl text-primary mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.totalUsers ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                总用户数
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-user-check" class="text-2xl text-green-500 mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.todayActive ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                今日活跃
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-book-open" class="text-2xl text-amber-500 mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.totalCourses ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                总课程数
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <UIcon name="i-lucide-bot" class="text-2xl text-violet-500 mb-2" />
              <div class="text-2xl font-bold text-highlighted">
                {{ bizStats?.aiCalls ?? '-' }}
              </div>
              <div class="text-sm text-muted">
                AI 调用次数
              </div>
            </div>
          </UCard>
        </div>

        <!-- 系统信息 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-server" class="text-primary" />
              <span class="font-semibold">系统信息</span>
            </div>
          </template>
          <div v-if="systemData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">主机名</span>
              <span class="font-medium">{{ systemData.system.hostname }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">平台</span>
              <span class="font-medium">{{ systemData.system.platform }} / {{ systemData.system.arch }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Node 版本</span>
              <span class="font-medium">{{ systemData.system.nodeVersion }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">CPU 型号</span>
              <span class="font-medium truncate ml-4">{{ systemData.cpu.model }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">负载均值</span>
              <span class="font-medium">{{ systemData.cpu.loadAvg.map(v => v.toFixed(2)).join(' / ') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">进程 RSS</span>
              <span class="font-medium">{{ formatBytes(systemData.system.processMemory.rss) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">堆内存使用</span>
              <span class="font-medium">{{ formatBytes(systemData.system.processMemory.heapUsed) }} / {{ formatBytes(systemData.system.processMemory.heapTotal) }}</span>
            </div>
          </div>
          <div v-else class="text-center text-muted py-4">
            加载中...
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
