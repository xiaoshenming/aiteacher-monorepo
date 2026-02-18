export interface LogEntry {
  level: string
  message: string
  timestamp: string
  service: string
  stack: string | null
}

export function useSystemLogs() {
  const { apiFetch } = useApi()

  const levelFilter = ref('')
  const keyword = ref('')
  const page = ref(1)
  const pageSize = ref(50)
  const total = ref(0)
  const logs = ref<LogEntry[]>([])
  const loading = ref(false)
  const autoRefresh = ref(false)
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const levelOptions = [
    { label: '全部级别', value: '' },
    { label: 'Info', value: 'info' },
    { label: 'Warn', value: 'warn' },
    { label: 'Error', value: 'error' },
  ]

  const levelColors: Record<string, string> = {
    info: 'info',
    warn: 'warning',
    error: 'error',
  }

  const columns = [
    { accessorKey: 'level', header: '级别' },
    { accessorKey: 'message', header: '消息' },
    { accessorKey: 'service', header: '服务' },
    { accessorKey: 'timestamp', header: '时间' },
  ]

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  async function loadLogs() {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (levelFilter.value) params.set('level', levelFilter.value)
      if (keyword.value) params.set('keyword', keyword.value)
      params.set('page', String(page.value))
      params.set('pageSize', String(pageSize.value))

      const res = await apiFetch<{ code: number, data: { total: number, logs: LogEntry[] } }>(`admin/logs?${params}`)
      logs.value = res.data?.logs || []
      total.value = res.data?.total || 0
    }
    catch {
      logs.value = []
    }
    finally {
      loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    loadLogs()
  }

  function toggleAutoRefresh() {
    autoRefresh.value = !autoRefresh.value
    if (autoRefresh.value) {
      refreshTimer = setInterval(loadLogs, 30000)
    }
    else if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('zh-CN')
  }

  watch([levelFilter], () => {
    page.value = 1
    loadLogs()
  })

  onMounted(loadLogs)

  onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer)
  })

  return {
    levelFilter,
    keyword,
    page,
    total,
    logs,
    loading,
    autoRefresh,
    levelOptions,
    levelColors,
    columns,
    totalPages,
    loadLogs,
    handleSearch,
    toggleAutoRefresh,
    formatTime,
  }
}
