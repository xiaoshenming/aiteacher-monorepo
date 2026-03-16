export function useResourceShare() {
  const { apiFetch } = useApi()
  const myShares = ref<any[]>([])
  const sharedToMe = ref<any[]>([])
  const publicShares = ref<any[]>([])
  const schoolShares = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)

  async function fetchMyShares(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const res = await apiFetch<any>('/api/share/my-shares', {
        params: { page, pageSize },
      })
      myShares.value = res.data || []
      total.value = res.total || 0
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSharedToMe(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const res = await apiFetch<any>('/api/share/shared-to-me', {
        params: { page, pageSize },
      })
      sharedToMe.value = res.data || []
      total.value = res.total || 0
    }
    finally {
      loading.value = false
    }
  }

  async function fetchPublicShares(page = 1, pageSize = 20, resourceType = '') {
    loading.value = true
    try {
      const params: any = { page, pageSize }
      if (resourceType) params.resource_type = resourceType
      const res = await apiFetch<any>('/api/share/public', { params })
      publicShares.value = res.data || []
      total.value = res.total || 0
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSchoolShares(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const userStore = useUserStore()
      const schoolId = (userStore.userInfo as any)?.school_id
      const res = await apiFetch<any>('/api/share/school', {
        params: { page, pageSize, school_id: schoolId },
      })
      schoolShares.value = res.data || []
      total.value = res.total || 0
    }
    finally {
      loading.value = false
    }
  }

  async function createShare(data: {
    resource_type: string
    resource_id: number
    share_scope: string
    target_user_id?: number
    school_id?: number
    permission?: string
    message?: string
  }) {
    return await apiFetch<any>('/api/share', {
      method: 'POST',
      body: data,
    })
  }

  async function deleteShare(id: number) {
    return await apiFetch<any>(`/api/share/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    myShares,
    sharedToMe,
    publicShares,
    schoolShares,
    loading,
    total,
    fetchMyShares,
    fetchSharedToMe,
    fetchPublicShares,
    fetchSchoolShares,
    createShare,
    deleteShare,
  }
}
