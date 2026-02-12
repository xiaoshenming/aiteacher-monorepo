import type { FilterOptions, FilterOptionsResponse, ResourceItem, ResourceListResponse } from '~/types/resource'

type ResourceType = 'testpaper' | 'textbook'

interface FetchListParams {
  page?: number
  pageSize?: number
  grade?: string
  subject?: string
  province?: string
  city?: string
}

export function useResources(type: ResourceType) {
  const { apiFetch } = useApi()
  const config = useRuntimeConfig()

  async function fetchOptions(): Promise<FilterOptions> {
    const res = await apiFetch<FilterOptionsResponse>(`resource/paper/${type}/options/all`)
    return res.data
  }

  async function fetchList(params: FetchListParams = {}): Promise<{ list: ResourceItem[], total: number }> {
    const res = await apiFetch<ResourceListResponse>(`resource/paper/${type}`, {
      params,
    })
    return res.data
  }

  async function search(keyword: string, page = 1, pageSize = 12): Promise<{ list: ResourceItem[], total: number }> {
    const res = await apiFetch<ResourceListResponse>(`resource/paper/search/${type}`, {
      params: { keyword, page, pageSize },
    })
    return res.data
  }

  function downloadCoverUrl(id: number): string {
    return `${config.public.apiBase}resource/paper/${type}/download/cover/${id}`
  }

  function downloadBodyUrl(id: number): string {
    return `${config.public.apiBase}resource/paper/${type}/download/body/${id}`
  }

  return {
    fetchOptions,
    fetchList,
    search,
    downloadCoverUrl,
    downloadBodyUrl,
  }
}

export type { ResourceType }
