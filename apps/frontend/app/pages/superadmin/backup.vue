<script setup lang="ts">
const toast = useToast()

const backups = ref([
  { id: 1, name: 'backup_20260210_auto.sql.gz', size: '128 MB', type: '自动', time: '2026-02-10 03:00:00' },
  { id: 2, name: 'backup_20260208_manual.sql.gz', size: '125 MB', type: '手动', time: '2026-02-08 15:30:00' },
  { id: 3, name: 'backup_20260205_auto.sql.gz', size: '120 MB', type: '自动', time: '2026-02-05 03:00:00' },
  { id: 4, name: 'backup_20260201_auto.sql.gz', size: '118 MB', type: '自动', time: '2026-02-01 03:00:00' },
])

const columns = [
  { accessorKey: 'name', header: '文件名' },
  { accessorKey: 'size', header: '大小' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'time', header: '创建时间' },
]

function createBackup() {
  const now = new Date()
  const name = `backup_${now.toISOString().slice(0, 10).replace(/-/g, '')}_manual.sql.gz`
  backups.value.unshift({
    id: Date.now(),
    name,
    size: '130 MB',
    type: '手动',
    time: now.toLocaleString('zh-CN'),
  })
  toast.add({ title: '备份创建成功', color: 'success' })
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="数据备份">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="创建备份" @click="createBackup" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable :data="backups" :columns="columns">
          <template #type-cell="{ row }">
            <UBadge :color="row.original.type === '手动' ? 'info' : 'neutral'" variant="subtle">
              {{ row.original.type }}
            </UBadge>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
