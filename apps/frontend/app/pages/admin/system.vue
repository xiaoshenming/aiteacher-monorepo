<script setup lang="ts">
import type { AuthRequest } from '~/types/admin'

const { fetchAuthRequests, approveAuth, rejectAuth } = useAdminSystem()

const requests = ref<AuthRequest[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    requests.value = await fetchAuthRequests()
  }
  catch {
    // silent
  }
  finally {
    loading.value = false
  }
}

async function handleApprove(id: number) {
  await approveAuth(id)
  const item = requests.value.find(r => r.id === id)
  if (item) item.status = 'approved'
}

async function handleReject(id: number) {
  await rejectAuth(id)
  const item = requests.value.find(r => r.id === id)
  if (item) item.status = 'rejected'
}

const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'school', header: '学校' },
  { accessorKey: 'reason', header: '申请原因' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'created_at', header: '申请时间' },
  { accessorKey: 'actions', header: '操作' },
]

const statusMap: Record<string, { label: string, color: 'warning' | 'success' | 'error' }> = {
  pending: { label: '待审核', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已拒绝', color: 'error' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="系统管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="loading" @click="load" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <h3 class="text-sm font-medium text-muted mb-4">认证审核</h3>

        <div v-if="loading" class="flex items-center justify-center py-24">
          <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-muted" />
        </div>

        <div v-else-if="requests.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
          <UIcon name="i-lucide-check-circle" class="text-4xl mb-3" />
          <p>暂无认证申请</p>
        </div>

        <UTable v-else :data="requests" :columns="columns">
          <template #name-cell="{ row }">
            {{ row.original.name || '-' }}
          </template>
          <template #school-cell="{ row }">
            {{ row.original.school || '-' }}
          </template>
          <template #reason-cell="{ row }">
            {{ row.original.reason || '-' }}
          </template>
          <template #status-cell="{ row }">
            <UBadge
              :color="statusMap[row.original.status]?.color || 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ statusMap[row.original.status]?.label || row.original.status }}
            </UBadge>
          </template>
          <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template>
          <template #actions-cell="{ row }">
            <div v-if="row.original.status === 'pending'" class="flex gap-1">
              <UButton
                label="通过"
                icon="i-lucide-check"
                size="xs"
                color="success"
                variant="subtle"
                @click="handleApprove(row.original.id)"
              />
              <UButton
                label="拒绝"
                icon="i-lucide-x"
                size="xs"
                color="error"
                variant="subtle"
                @click="handleReject(row.original.id)"
              />
            </div>
            <span v-else class="text-xs text-dimmed">已处理</span>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
