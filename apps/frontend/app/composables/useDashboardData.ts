import type {
  DashboardData,
  AIUsageStats,
  Recommendation,
  PopularFunction,
} from '~/types/analytics'

export function useDashboardData() {
  const userStore = useUserStore()
  const analytics = useAnalytics()
  const { apiFetch } = useApi()
  const landppt = useLandPPT()

  const loading = ref(true)
  const dashboard = ref<DashboardData | null>(null)
  const aiUsage = ref<AIUsageStats | null>(null)
  const popularFunctions = ref<PopularFunction[]>([])
  const recommendations = ref<Recommendation[]>([])
  const pendingAssignments = ref(0)
  const unreadMessages = ref(0)

  const quickActions = [
    { label: 'AI问答', icon: 'i-lucide-bot', to: '/user/ai' },
    { label: '课程表', icon: 'i-lucide-calendar-days', to: '/user/class-schedule' },
    { label: 'AI智能出题', icon: 'i-lucide-brain', to: '/user/topic' },
    { label: '作业发布', icon: 'i-lucide-clipboard-list', to: '/user/assignment' },
    { label: '学情分析', icon: 'i-lucide-bar-chart-3', to: '/user/data' },
    { label: 'PPT工具', icon: 'i-lucide-presentation', to: '/user/ppt' },
    { label: '课堂录制', icon: 'i-lucide-video', to: '/user/recordings' },
    { label: '协作白板', icon: 'i-lucide-pen-tool', to: '/user/whiteboard' },
  ]

  function getDateRange(days: number): { startDate: string, endDate: string } {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }

  async function fetchPendingAssignments(): Promise<number> {
    try {
      const res = await apiFetch<any>('/edu/assignment/list', { showError: false })
      const list = res?.data?.list ?? res?.data ?? []
      if (!Array.isArray(list)) return 0
      return list.filter((item: any) => item.status === 'pending').length
    }
    catch {
      return 0
    }
  }

  async function fetchUnreadMessages(): Promise<number> {
    try {
      const res = await apiFetch<any>('/rabbitmq/messages/unread-count', { showError: false })
      const count = res?.data?.count ?? res?.data ?? 0
      return typeof count === 'number' ? count : Number(count) || 0
    }
    catch {
      return 0
    }
  }

  // 当推荐为空时，用新闻热点作为兜底
  async function fetchNewsAsFallback(): Promise<Recommendation[]> {
    try {
      const res = await apiFetch<any>('/news/list', {
        params: { typeId: 537, page: 1 },
        showError: false,
      })
      const list = res?.data ?? []
      if (!Array.isArray(list)) return []
      return list.slice(0, 5).map((item: any, i: number) => ({
        id: item.newsId || String(i),
        title: item.title || '未知标题',
        type: 'news',
        match_score: 0,
        description: item.source || '热点资讯',
      }))
    }
    catch {
      return []
    }
  }

  async function loadData(): Promise<void> {
    loading.value = true
    const userId = userStore.userInfo?.id?.toString()
    if (!userId) {
      loading.value = false
      return
    }

    const dateRange = getDateRange(30)

    if (!landppt.ssoReady.value) {
      await landppt.ssoLogin().catch(() => {})
    }

    try {
      const [dashboardRes, aiUsageRes, popularRes, recsRes, assignRes, msgRes] = await Promise.allSettled([
        analytics.fetchDashboard(userId, 'teacher'),
        analytics.fetchAIUsageStats(userId, dateRange),
        analytics.fetchPopularFunctions(),
        analytics.fetchRecommendations(userId, 5),
        fetchPendingAssignments(),
        fetchUnreadMessages(),
      ])

      if (dashboardRes.status === 'fulfilled') dashboard.value = dashboardRes.value
      if (aiUsageRes.status === 'fulfilled') aiUsage.value = aiUsageRes.value
      if (popularRes.status === 'fulfilled') popularFunctions.value = popularRes.value
      if (recsRes.status === 'fulfilled') recommendations.value = recsRes.value
      if (assignRes.status === 'fulfilled') pendingAssignments.value = assignRes.value
      if (msgRes.status === 'fulfilled') unreadMessages.value = msgRes.value

      // 推荐为空时，用新闻热点兜底
      if (recommendations.value.length === 0) {
        recommendations.value = await fetchNewsAsFallback()
      }
    }
    finally {
      loading.value = false
    }
  }

  const aiTrendOption = computed(() => {
    if (!aiUsage.value?.details?.length) return {}

    const dateMap = new Map<string, { calls: number, tokens: number }>()
    for (const d of aiUsage.value.details) {
      const date = d.date
      const existing = dateMap.get(date)
      if (existing) {
        existing.calls += Number(d.total_calls) || 0
        existing.tokens += Number(d.total_tokens) || 0
      }
      else {
        dateMap.set(date, {
          calls: Number(d.total_calls) || 0,
          tokens: Number(d.total_tokens) || 0,
        })
      }
    }

    const sorted = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    const dates = sorted.map(([d]) => d)
    const calls = sorted.map(([, v]) => v.calls)
    const tokens = sorted.map(([, v]) => v.tokens)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['调用次数', 'Token 消耗'],
        textStyle: { fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { formatter: (v: string) => v.slice(5) },
        axisTick: { alignWithLabel: true },
      },
      yAxis: [
        { type: 'value', name: '调用次数', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
        { type: 'value', name: 'Token', position: 'right', splitLine: { show: false } },
      ],
      series: [
        {
          name: '调用次数',
          type: 'bar',
          data: calls,
          barMaxWidth: 20,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#a5b4fc' }] },
          },
        },
        {
          name: 'Token 消耗',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: tokens,
          itemStyle: { color: '#f59e0b' },
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.25)' }, { offset: 1, color: 'rgba(245,158,11,0.02)' }] },
          },
        },
      ],
    }
  })

  // AI 模型分布饼图
  const aiModelOption = computed(() => {
    if (!aiUsage.value?.details?.length) return {}

    const modelMap = new Map<string, number>()
    for (const d of aiUsage.value.details) {
      const current = modelMap.get(d.model_name) ?? 0
      modelMap.set(d.model_name, current + (Number(d.total_calls) || 0))
    }

    const modelNames: Record<string, string> = {
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-reasoner': 'DeepSeek Reasoner',
      'qwen-turbo': 'Qwen Turbo',
      'qwen-plus': 'Qwen Plus',
      'qwen-max': 'Qwen Max',
    }
    const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#10b981', '#ec4899']

    const data = [...modelMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: modelNames[name] ?? name, value }))

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
        data,
        color: colors,
      }],
    }
  })

  // 备课趋势折线图（从 dashboard.prepare 的 details 或 aiUsage 按日期聚合）
  const prepareTrendOption = computed(() => {
    if (!aiUsage.value?.details?.length) return {}

    // 按日期聚合调用次数作为备课活跃度指标
    const dateMap = new Map<string, number>()
    for (const d of aiUsage.value.details) {
      const current = dateMap.get(d.date) ?? 0
      dateMap.set(d.date, current + (Number(d.total_calls) || 0))
    }

    const sorted = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    const dates = sorted.map(([d]) => d)
    const values = sorted.map(([, v]) => v)

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '3%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: { formatter: (v: string) => v.slice(5) },
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
      series: [{
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: values,
        lineStyle: { width: 2.5, color: '#10b981' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0.02)' }] },
        },
      }],
    }
  })

  function formatTokens(tokens: number): string {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }

  function formatMinutes(minutes: number): string {
    if (minutes >= 60) return `${(minutes / 60).toFixed(1)}`
    return minutes.toString()
  }

  return {
    loading,
    dashboard,
    aiUsage,
    popularFunctions,
    recommendations,
    pendingAssignments,
    unreadMessages,
    quickActions,
    aiTrendOption,
    aiModelOption,
    prepareTrendOption,
    formatTokens,
    formatMinutes,
    loadData,
  }
}
