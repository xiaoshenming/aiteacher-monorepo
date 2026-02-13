import type {
  ApiResponse,
  DashboardData,
  PrepareStats,
  AIUsageStats,
  AIUsageDetail,
  LearningStats,
  Recommendation,
  PopularFunction,
  DateRange,
  PPTUsageStats,
  PPTUsageByModel,
  PPTUsageByAction,
} from '~/types/analytics'

/**
 * 确保 MySQL SUM/COUNT 返回的字符串值转为数字
 */
function normalizeAIDetail(d: AIUsageDetail): AIUsageDetail {
  return {
    ...d,
    total_calls: Number(d.total_calls) || 0,
    total_tokens: Number(d.total_tokens) || 0,
  }
}

export function useAnalytics() {
  const { cloudFetch } = useApi()

  async function fetchDashboard(userId: string, userType: string = 'teacher'): Promise<DashboardData> {
    const res = await cloudFetch<ApiResponse<DashboardData>>(
      `/analytics/dashboard/${userId}`,
      { params: { userType } },
    )
    const data = res.data
    // 确保数值类型
    if (data.ai) {
      data.ai.total_calls = Number(data.ai.total_calls) || 0
      data.ai.total_tokens = Number(data.ai.total_tokens) || 0
    }
    if (data.prepare) {
      data.prepare.total_sessions = Number(data.prepare.total_sessions) || 0
      data.prepare.total_minutes = Number(data.prepare.total_minutes) || 0
      data.prepare.total_generates = Number(data.prepare.total_generates) || 0
    }
    return data
  }

  async function fetchPrepareStats(teacherId: string, dateRange?: DateRange): Promise<PrepareStats> {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    const res = await cloudFetch<ApiResponse<PrepareStats>>(
      `/analytics/teacher/prepare/${teacherId}`,
      { params },
    )
    return res.data
  }

  async function fetchAIUsageStats(userId: string, dateRange?: DateRange): Promise<AIUsageStats> {
    const params: Record<string, string> = {}
    if (dateRange) {
      params.startDate = dateRange.startDate
      params.endDate = dateRange.endDate
    }
    const res = await cloudFetch<ApiResponse<AIUsageStats>>(
      `/analytics/ai/usage/${userId}`,
      { params },
    )
    // 规范化数值
    const data = res.data
    data.details = data.details.map(normalizeAIDetail)
    if (data.summary) {
      data.summary.total_calls = Number(data.summary.total_calls) || 0
      data.summary.total_tokens = Number(data.summary.total_tokens) || 0
    }
    return data
  }

  async function fetchLearningStats(studentId: string): Promise<LearningStats> {
    const res = await cloudFetch<ApiResponse<LearningStats>>(
      `/analytics/student/learning/${studentId}`,
    )
    return res.data
  }

  async function fetchRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
    const res = await cloudFetch<ApiResponse<Recommendation[]>>(
      `/analytics/recommendation/lessons/${userId}`,
      { params: { limit } },
    )
    return res.data
  }

  async function fetchPopularFunctions(): Promise<PopularFunction[]> {
    const res = await cloudFetch<ApiResponse<PopularFunction[]>>(
      '/analytics/ai/popular',
    )
    // 规范化数值
    return res.data.map(f => ({
      ...f,
      total_calls: Number(f.total_calls) || 0,
      unique_users: Number(f.unique_users) || 0,
    }))
  }

  // --- PPT (LandPPT) AI Usage ---

  async function fetchPPTUsageStats(userId: string, dateRange?: DateRange): Promise<PPTUsageStats> {
    const config = useRuntimeConfig()
    const landpptBase = config.public.landpptBase as string
    const params: Record<string, string> = { user_id: userId }
    if (dateRange) {
      params.start_time = String(new Date(dateRange.startDate).getTime() / 1000)
      params.end_time = String(new Date(dateRange.endDate).getTime() / 1000)
    }
    const query = new URLSearchParams(params).toString()
    const res = await $fetch<{ success: boolean, stats: PPTUsageStats }>(
      `${landpptBase}/api/usage/stats?${query}`,
    )
    return res.stats
  }

  async function fetchPPTUsageByModel(userId: string, dateRange?: DateRange): Promise<PPTUsageByModel[]> {
    const config = useRuntimeConfig()
    const landpptBase = config.public.landpptBase as string
    const params: Record<string, string> = { user_id: userId }
    if (dateRange) {
      params.start_time = String(new Date(dateRange.startDate).getTime() / 1000)
      params.end_time = String(new Date(dateRange.endDate).getTime() / 1000)
    }
    const query = new URLSearchParams(params).toString()
    const res = await $fetch<{ success: boolean, by_model: PPTUsageByModel[] }>(
      `${landpptBase}/api/usage/by-model?${query}`,
    )
    return res.by_model
  }

  async function fetchPPTUsageByAction(userId: string, dateRange?: DateRange): Promise<PPTUsageByAction[]> {
    const config = useRuntimeConfig()
    const landpptBase = config.public.landpptBase as string
    const params: Record<string, string> = { user_id: userId }
    if (dateRange) {
      params.start_time = String(new Date(dateRange.startDate).getTime() / 1000)
      params.end_time = String(new Date(dateRange.endDate).getTime() / 1000)
    }
    const query = new URLSearchParams(params).toString()
    const res = await $fetch<{ success: boolean, by_action: PPTUsageByAction[] }>(
      `${landpptBase}/api/usage/by-action?${query}`,
    )
    return res.by_action
  }

  return {
    fetchDashboard,
    fetchPrepareStats,
    fetchAIUsageStats,
    fetchLearningStats,
    fetchRecommendations,
    fetchPopularFunctions,
    fetchPPTUsageStats,
    fetchPPTUsageByModel,
    fetchPPTUsageByAction,
  }
}
