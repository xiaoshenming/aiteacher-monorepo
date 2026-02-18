import type {
  DashboardData,
  AIUsageStats,
  Recommendation,
  PopularFunction,
  PPTUsageStats,
  PPTUsageByModel,
  PPTUsageByAction,
} from '~/types/analytics'

export function useAnalyticsData() {
  const userStore = useUserStore()
  const analytics = useAnalytics()
  const landppt = useLandPPT()

  const loading = ref(true)
  const dashboard = ref<DashboardData | null>(null)
  const aiUsage = ref<AIUsageStats | null>(null)
  const recommendations = ref<Recommendation[]>([])
  const popularFunctions = ref<PopularFunction[]>([])

  // PPT usage data
  const pptUsage = ref<PPTUsageStats | null>(null)
  const pptByModel = ref<PPTUsageByModel[]>([])
  const pptByAction = ref<PPTUsageByAction[]>([])

  // 日期范围
  const dateRangeOptions = [
    { label: '近7天', value: 7 },
    { label: '近30天', value: 30 },
    { label: '近90天', value: 90 },
  ]
  const selectedRange = ref(30)

  function getDateRange(days: number): { startDate: string, endDate: string } {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }

  async function loadData(): Promise<void> {
    loading.value = true
    const userId = userStore.userInfo?.id?.toString()
    if (!userId) return

    const userType = (userStore.userInfo?.role as string) === 'student' ? 'student' : 'teacher'
    const dateRange = getDateRange(selectedRange.value)

    try {
      // Ensure LandPPT SSO session exists before fetching PPT usage data
      if (!landppt.ssoReady.value) {
        await landppt.ssoLogin()
      }

      const [dashboardRes, aiUsageRes, recsRes, popularRes, pptUsageRes, pptModelRes, pptActionRes] = await Promise.allSettled([
        analytics.fetchDashboard(userId, userType),
        analytics.fetchAIUsageStats(userId, dateRange),
        analytics.fetchRecommendations(userId),
        analytics.fetchPopularFunctions(),
        analytics.fetchPPTUsageStats(userId, dateRange),
        analytics.fetchPPTUsageByModel(userId, dateRange),
        analytics.fetchPPTUsageByAction(userId, dateRange),
      ])

      if (dashboardRes.status === 'fulfilled') dashboard.value = dashboardRes.value
      if (aiUsageRes.status === 'fulfilled') aiUsage.value = aiUsageRes.value
      if (recsRes.status === 'fulfilled') recommendations.value = recsRes.value
      if (popularRes.status === 'fulfilled') popularFunctions.value = popularRes.value
      if (pptUsageRes.status === 'fulfilled') pptUsage.value = pptUsageRes.value
      if (pptModelRes.status === 'fulfilled') pptByModel.value = pptModelRes.value
      if (pptActionRes.status === 'fulfilled') pptByAction.value = pptActionRes.value
    }
    finally {
      loading.value = false
    }
  }

  function formatTokens(tokens: number): string {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }

  function formatMinutes(minutes: number): string {
    if (minutes >= 60) return `${(minutes / 60).toFixed(1)}`
    return minutes.toString()
  }

  function pptActionLabel(action: string): string {
    const map: Record<string, string> = {
      generate_outline: '生成大纲',
      generate_slide: '生成幻灯片',
      generate_image: '生成图片',
      refine_content: '优化内容',
      translate: '翻译',
    }
    return map[action] || action
  }

  return {
    loading,
    dashboard,
    aiUsage,
    recommendations,
    popularFunctions,
    pptUsage,
    pptByModel,
    pptByAction,
    dateRangeOptions,
    selectedRange,
    loadData,
    formatTokens,
    formatMinutes,
    pptActionLabel,
  }
}
