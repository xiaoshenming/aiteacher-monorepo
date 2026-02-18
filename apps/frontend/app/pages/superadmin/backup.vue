<script setup lang="ts">
const toast = useToast()
const { apiFetch } = useApi()
const config = useRuntimeConfig()

interface BackupItem {
  name: string
  size: string
  sizeBytes: number
  type: string
  time: string
}

const backups = ref<BackupItem[]>([])
const loading = ref(false)
const creating = ref(false)
const deletingName = ref<string | null>(null)

const columns = [
  { accessorKey: 'name', header: '文件名' },
  { accessorKey: 'size', header: '大小' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'formattedTime', header: '创建时间' },
]

const tableData = computed(() =>
  backups.value.map(b => ({
    ...b,
    formattedTime: new Date(b.time).toLocaleString('zh-CN'),
  })),
)

async function fetchBackups() {
  loading.value = true
  try {
    const res = await apiFetch<{ code: number, data: { backups: BackupItem[] } }>('admin/backups')
    if (res.code === 200 && res.data?.backups) {
      backups.value = res.data.backups
    }
  }
  catch {
    // API 不可用，保持空列表
  }
  finally {
    loading.value = false
  }
}

async function createBackup() {
  creating.value = true
  try {
    await apiFetch<{ code: number, message: string, data: BackupItem }>('admin/backups', {
      method: 'POST',
    })
    toast.add({ title: '备份创建成功', color: 'success' })
    await fetchBackups()
  }
  catch {
    // error handled by apiFetch
  }
  finally {
    creating.value = false
  }
}

async function deleteBackup(name: string) {
  deletingName.value = name
  try {
    await apiFetch<{ code: number, message: string }>(`admin/backups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
    toast.add({ title: '备份已删除', color: 'success' })
    backups.value = backups.value.filter(b => b.name !== name)
  }
  catch {
    // error handled by apiFetch
  }
  finally {
    deletingName.value = null
  }
}

function downloadBackup(name: string) {
  const baseURL = config.public.apiBase as string
  const token = useUserStore().token
  const url = `${baseURL}/admin/backups/${encodeURIComponent(name)}/download`
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', name)
  // 通过 fetch 下载以附带 token
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      a.href = blobUrl
      a.click()
      URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      toast.add({ title: '下载失败', color: 'error' })
    })
}

// 删除确认
const showDeleteConfirm = ref(false)
const pendingDeleteName = ref('')

function confirmDelete(name: string) {
  pendingDeleteName.value = name
  showDeleteConfirm.value = true
}

function doDelete() {
  showDeleteConfirm.value = false
  deleteBackup(pendingDeleteName.value)
}

onMounted(fetchBackups)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="数据备份">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="创建备份"
            :loading="creating"
            @click="createBackup"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable :data="tableData" :columns="columns" :loading="loading">
          <template #type-cell="{ row }">
            <UBadge :color="row.original.type === '手动' ? 'info' : 'neutral'" variant="subtle">
              {{ row.original.type }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-download"
                @click="downloadBackup(row.original.name)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :loading="deletingName === row.original.name"
                @click="confirmDelete(row.original.name)"
              />
            </div>
          </template>
        </UTable>

        <div v-if="!loading && backups.length === 0" class="text-center text-gray-500 py-12">
          暂无备份记录
        </div>
      </div>
    </template>

    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-2">
            确认删除
          </h3>
          <p class="text-sm text-gray-500 mb-4">
            确定要删除备份文件 {{ pendingDeleteName }} 吗？此操作不可恢复。
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" label="取消" @click="showDeleteConfirm = false" />
            <UButton color="error" label="删除" @click="doDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>
