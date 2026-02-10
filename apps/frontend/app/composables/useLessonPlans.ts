interface LessonPlan {
  id: number
  name: string
  content: string
  status: number
  created_at: string
  updated_at: string
}

interface LessonPlanListResponse {
  code: number
  message: string
  data: {
    list: LessonPlan[]
    total: number
  }
}

interface LessonPlanDetailResponse {
  code: number
  message: string
  data: LessonPlan
}

interface LessonPlanMutationResponse {
  code: number
  message: string
  data: null
}

export function useLessonPlans() {
  const { apiFetch } = useApi()

  /** 获取非历史教案列表 */
  async function fetchList(page: number, pageSize: number) {
    const res = await apiFetch<LessonPlanListResponse>('lessonPlans/list/notHistory', {
      params: { page, pageSize },
    })
    return res.data
  }

  /** 获取历史教案列表 */
  async function fetchHistory(page: number, pageSize: number) {
    const res = await apiFetch<LessonPlanListResponse>('lessonPlans/list/history', {
      params: { page, pageSize },
    })
    return res.data
  }

  /** 搜索教案 */
  async function search(keyword: string, page: number, pageSize: number) {
    const res = await apiFetch<LessonPlanListResponse>('lessonPlans/search', {
      params: { keyword, page, pageSize },
    })
    return res.data
  }

  /** 获取教案详情 */
  async function fetchDetail(id: number) {
    const res = await apiFetch<LessonPlanDetailResponse>('lessonPlans/detail', {
      params: { id },
    })
    return res.data
  }

  /** 新增教案 */
  async function create(name: string) {
    return apiFetch<LessonPlanMutationResponse>('lessonPlans/add', {
      method: 'POST',
      body: { name },
    })
  }

  /** 更新教案 */
  async function update(id: number, data: { name?: string, content?: string, status?: number }) {
    return apiFetch<LessonPlanMutationResponse>('lessonPlans/edit', {
      method: 'POST',
      body: { id, ...data },
    })
  }

  /** 删除教案 */
  async function remove(id: number) {
    return apiFetch<LessonPlanMutationResponse>('lessonPlans/delete', {
      method: 'POST',
      body: { id },
    })
  }

  return {
    fetchList,
    fetchHistory,
    search,
    fetchDetail,
    create,
    update,
    remove,
  }
}

export type { LessonPlan }
