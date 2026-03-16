export function useFavorites() {
  const { apiFetch } = useApi()
  const favorites = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)

  async function fetchFavorites(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const res = await apiFetch<any>('/share/favorites', {
        params: { page, pageSize },
      })
      favorites.value = res.data || []
      total.value = res.total || 0
    }
    finally {
      loading.value = false
    }
  }

  async function addFavorite(resourceType: string, resourceId: number) {
    return await apiFetch<any>('/share/favorite', {
      method: 'POST',
      body: { resource_type: resourceType, resource_id: resourceId },
    })
  }

  async function removeFavorite(id: number) {
    return await apiFetch<any>(`/share/favorite/${id}`, {
      method: 'DELETE',
    })
  }

  function isFavorited(resourceType: string, resourceId: number): boolean {
    return favorites.value.some(
      f => f.resource_type === resourceType && f.resource_id === resourceId,
    )
  }

  return { favorites, loading, total, fetchFavorites, addFavorite, removeFavorite, isFavorited }
}
