<script setup lang="ts">
const {
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
} = useSystemLogs()
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
          <USelectMenu v-model="levelFilter" :items="levelOptions" value-key="value" class="w-40" />
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
