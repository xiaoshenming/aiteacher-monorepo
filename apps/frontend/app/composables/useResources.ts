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
  const userStore = useUserStore()

  // cloud base 去掉 /api/ 后缀，用于拼 /Resource/* 静态路径
  const cloudBase = (config.public.apiCloud as string).replace(/\/api\/?$/, '')

  function buildCoverUrl(item: ResourceItem): string | undefined {
    if (!item.cover) return undefined
    return `${cloudBase}${item.cover}`
  }

  function mapItem(item: ResourceItem): ResourceItem {
    // 年份：testpaper 从 label 提取（如 "2008年,..."），textbook 用 publicationYear
    const year = item.year
      || item.label?.match(/(\d{4})年/)?.[1]
      || (item.publicationYear ? String(item.publicationYear) : undefined)
    // 上传时间：testpaper 用 uploadTime，textbook 用 createTime
    const created_at = item.created_at || item.uploadTime || item.createTime
    return { ...item, cover_url: buildCoverUrl(item), year, created_at }
  }

  async function fetchOptions(): Promise<FilterOptions> {
    const res = await apiFetch<FilterOptionsResponse>(`resource/paper/${type}/options/all`)
    return res.data
  }

  async function fetchList(params: FetchListParams = {}): Promise<{ list: ResourceItem[], total: number }> {
    const res = await apiFetch<ResourceListResponse>(`resource/paper/${type}`, {
      params,
    })
    return { list: res.data.list.map(mapItem), total: res.data.total }
  }

  async function search(keyword: string, page = 1, pageSize = 12): Promise<{ list: ResourceItem[], total: number }> {
    const res = await apiFetch<ResourceListResponse>(`resource/paper/search/${type}`, {
      params: { keyword, page, pageSize },
    })
    return { list: res.data.list.map(mapItem), total: res.data.total }
  }

  function downloadBodyUrl(id: number): string {
    return `${config.public.apiBase}resource/paper/${type}/download/body/${id}?token=${userStore.token}`
  }

  return {
    fetchOptions,
    fetchList,
    search,
    downloadBodyUrl,
  }
}

export type { ResourceType }

