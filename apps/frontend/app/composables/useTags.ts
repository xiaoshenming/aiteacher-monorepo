export function useTags() {
  const { apiFetch } = useApi()
  const tags = ref<any[]>([])

  async function fetchTags() {
    const res = await apiFetch<any>('/share/tags')
    tags.value = res.data || []
  }

  async function createTag(name: string, color = '#14b8a6') {
    return await apiFetch<any>('/share/tag', {
      method: 'POST',
      body: { name, color },
    })
  }

  async function deleteTag(id: number) {
    return await apiFetch<any>(`/api/share/tag/${id}`, {
      method: 'DELETE',
    })
  }

  async function bindTag(tagId: number, resourceType: string, resourceId: number) {
    return await apiFetch<any>(`/api/share/tag/${tagId}/bind`, {
      method: 'POST',
      body: { resource_type: resourceType, resource_id: resourceId },
    })
  }

  async function unbindTag(tagId: number, resourceType: string, resourceId: number) {
    return await apiFetch<any>(`/api/share/tag/${tagId}/unbind`, {
      method: 'DELETE',
      body: { resource_type: resourceType, resource_id: resourceId },
    })
  }

  return { tags, fetchTags, createTag, deleteTag, bindTag, unbindTag }
}
