<script setup lang="ts">
const { apiFetch } = useApi()

interface LogEntry {
  level: string
  message: string
  timestamp: string
  service: string
  stack: string | null
}

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
  } catch {
    logs.value = []
  } finally {
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
  } else if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

watch([levelFilter], () => {
  page.value = 1
  loadLogs()
})

onMounted(loadLogs)

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const columns = [
  { accessorKey: 'level', header: '级别' },
  { accessorKey: 'message', header: '消息' },
  { accessorKey: 'service', header: '服务' },
  { accessorKey: 'timestamp', header: '时间' },
]

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('zh-CN')
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="系统日志">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UBadge :color="autoRefresh ? 'success' : 'neutral'" variant="subtle" class="text-xs">
              {{ total }} 条日志
            </UBadge>
            <UButton
              :icon="autoRefresh ? 'i-lucide-pause' : 'i-lucide-play'"
              :label="autoRefresh ? '停止刷新' : '自动刷新'"
              size="xs"
              :color="autoRefresh ? 'success' : 'neutral'"
              variant="outline"
              @click="toggleAutoRefresh"
            />
            <UButton icon="i-lucide-refresh-cw" size="xs" variant="ghost" color="neutral" :loading="loading" @click="loadLogs" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <div class="flex gap-3 items-center">
          <USelectMenu v-model="levelFilter" :items="levelOptions" class="w-40" />
          <UInput v-model="keyword" placeholder="搜索日志内容..." icon="i-lucide-search" class="w-64" @keyup.enter="handleSearch" />
          <UButton label="搜索" size="sm" @click="handleSearch" />
        </div>

        <UTable :data="logs" :columns="columns" :loading="loading">
          <template #level-cell="{ row }">
            <UBadge :color="(levelColors[row.original.level] as any) || 'neutral'" variant="subtle" class="uppercase">
              {{ row.original.level }}
            </UBadge>
          </template>
          <template #message-cell="{ row }">
            <div class="max-w-lg truncate" :title="row.original.message">
              {{ row.original.message }}
            </div>
          </template>
          <template #timestamp-cell="{ row }">
            {{ formatTime(row.original.timestamp) }}
          </template>
        </UTable>

        <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
          <span class="text-sm text-muted">第 {{ page }} / {{ totalPages }} 页</span>
          <div class="flex gap-2">
            <UButton size="xs" variant="outline" :disabled="page <= 1" @click="page--; loadLogs()">上一页</UButton>
            <UButton size="xs" variant="outline" :disabled="page >= totalPages" @click="page++; loadLogs()">下一页</UButton>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
