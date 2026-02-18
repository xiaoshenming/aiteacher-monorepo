export interface SystemData {
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

export interface ServiceItem {
  name: string
  status: 'online' | 'offline'
  message: string
}

export interface BusinessStats {
  totalUsers: number
  todayActive: number
  totalCourses: number
  aiCalls: number
}

export function useSystemMonitor() {
  const { apiFetch } = useApi()

  const systemData = ref<SystemData | null>(null)
  const services = ref<ServiceItem[]>([])
  const bizStats = ref<BusinessStats | null>(null)
  const loading = ref(true)
  const autoRefresh = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  // --- 格式化工具 ---
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

  // --- 颜色工具 ---
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

  // --- 图表配置 ---
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

  // --- 数据获取 ---
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

  // --- 自动刷新 ---
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

  return {
    systemData,
    services,
    bizStats,
    loading,
    autoRefresh,
    cpuGaugeOption,
    memGaugeOption,
    formatBytes,
    formatUptime,
    getUsageColor,
    getProgressColor,
    fetchData,
  }
}
