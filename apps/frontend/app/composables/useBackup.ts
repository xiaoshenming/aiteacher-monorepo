export interface BackupItem {
  name: string
  size: string
  sizeBytes: number
  type: string
  time: string
}

export function useBackup() {
  const toast = useToast()
  const { apiFetch } = useApi()
  const config = useRuntimeConfig()

  const backups = ref<BackupItem[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const deletingName = ref<string | null>(null)

  // 删除确认
  const showDeleteConfirm = ref(false)
  const pendingDeleteName = ref('')

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

  function confirmDelete(name: string) {
    pendingDeleteName.value = name
    showDeleteConfirm.value = true
  }

  function doDelete() {
    showDeleteConfirm.value = false
    deleteBackup(pendingDeleteName.value)
  }

  onMounted(fetchBackups)

  return {
    backups,
    loading,
    creating,
    deletingName,
    showDeleteConfirm,
    pendingDeleteName,
    columns,
    tableData,
    createBackup,
    downloadBackup,
    confirmDelete,
    doDelete,
  }
}
