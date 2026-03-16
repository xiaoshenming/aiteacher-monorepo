export function useClassroom() {
  const { apiFetch } = useApi()
  const sessions = ref<any[]>([])
  const currentSession = ref<any>(null)
  const stats = ref<any>(null)
  const loading = ref(false)

  async function fetchSessions(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const res = await apiFetch<any>('/api/classroom/sessions', {
        params: { page, pageSize },
      })
      sessions.value = res.data?.list || res.data || []
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSessionDetail(id: number) {
    const res = await apiFetch<any>(`/api/classroom/sessions/${id}`)
    currentSession.value = res.data
    return res.data
  }

  async function fetchSessionStats(id: number) {
    const res = await apiFetch<any>(`/api/classroom/sessions/${id}/stats`)
    stats.value = res.data
    return res.data
  }

  return {
    sessions, currentSession, stats, loading,
    fetchSessions, fetchSessionDetail, fetchSessionStats,
  }
}
