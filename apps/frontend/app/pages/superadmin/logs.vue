<script setup lang="ts">
const levelFilter = ref('')

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

const logs = [
  { id: 1, level: 'info', message: '用户 admin 登录系统', source: 'auth', time: '2026-02-12 09:15:23' },
  { id: 2, level: 'info', message: '课程"高等数学"创建成功', source: 'course', time: '2026-02-12 09:20:11' },
  { id: 3, level: 'warn', message: 'Redis 连接延迟超过 200ms', source: 'cache', time: '2026-02-12 10:05:44' },
  { id: 4, level: 'error', message: 'AI 服务调用超时', source: 'ai', time: '2026-02-12 10:12:08' },
  { id: 5, level: 'info', message: '文件上传完成: report.pdf', source: 'cloud', time: '2026-02-12 10:30:55' },
  { id: 6, level: 'warn', message: '磁盘使用率达到 80%', source: 'system', time: '2026-02-12 11:00:00' },
  { id: 7, level: 'error', message: '数据库连接池耗尽', source: 'database', time: '2026-02-12 11:15:33' },
  { id: 8, level: 'info', message: '定时备份任务执行成功', source: 'backup', time: '2026-02-12 12:00:00' },
  { id: 9, level: 'info', message: '用户 teacher01 修改密码', source: 'auth', time: '2026-02-12 13:22:10' },
  { id: 10, level: 'warn', message: 'RabbitMQ 队列积压超过 100', source: 'mq', time: '2026-02-12 14:05:18' },
]

const columns = [
  { accessorKey: 'level', header: '级别' },
  { accessorKey: 'message', header: '消息' },
  { accessorKey: 'source', header: '来源' },
  { accessorKey: 'time', header: '时间' },
]

const filteredLogs = computed(() => {
  if (!levelFilter.value) return logs
  return logs.filter(l => l.level === levelFilter.value)
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="系统日志">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <div class="flex gap-3 items-center">
          <USelectMenu v-model="levelFilter" :items="levelOptions" class="w-40" />
        </div>

        <UTable :data="filteredLogs" :columns="columns">
          <template #level-cell="{ row }">
            <UBadge :color="(levelColors[row.original.level] as any) || 'neutral'" variant="subtle" class="uppercase">
              {{ row.original.level }}
            </UBadge>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
