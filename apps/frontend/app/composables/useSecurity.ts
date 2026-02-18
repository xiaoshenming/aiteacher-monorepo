export interface OverviewData {
  totalUsers: number
  todayRegistered: number
  activeSessions: number
  pendingAuth: number
  uptimeDays: number
}

export interface LoginActivity {
  username: string
  email: string
  role: string
  loginTime: string
  status: string
}

export interface RateLimitRule {
  windowMs: number
  max: number
  description: string
}

export function useSecurity() {
  const { apiFetch } = useApi()

  const overview = ref<OverviewData | null>(null)
  const rateLimits = ref<Record<string, RateLimitRule>>({})
  const activities = ref<LoginActivity[]>([])
  const activityTotal = ref(0)
  const page = ref(1)
  const pageSize = 20
  const loading = ref(false)

  async function fetchOverview() {
    try {
      const res = await apiFetch<{ code: number, data: OverviewData }>('admin/security/overview')
      overview.value = res.data
    }
    catch {}
  }

  async function fetchRateLimits() {
    try {
      const res = await apiFetch<{ code: number, data: Record<string, RateLimitRule> }>('admin/security/rate-limits')
      rateLimits.value = res.data
    }
    catch {}
  }

  async function fetchLoginActivity() {
    try {
      const res = await apiFetch<{ code: number, data: { total: number, activities: LoginActivity[] } }>(
        `admin/security/login-activity?page=${page.value}&pageSize=${pageSize}`,
      )
      activities.value = res.data.activities
      activityTotal.value = res.data.total
    }
    catch {}
  }

  async function refreshAll() {
    loading.value = true
    await Promise.all([fetchOverview(), fetchRateLimits(), fetchLoginActivity()])
    loading.value = false
  }

  function changePage(p: number) {
    page.value = p
    fetchLoginActivity()
  }

  function formatTime(time: string) {
    if (!time) return '-'
    return new Date(time).toLocaleString('zh-CN')
  }

  const overviewCards = computed(() => {
    if (!overview.value) return []
    return [
      { label: '总用户数', value: overview.value.totalUsers, icon: 'i-lucide-users' },
      { label: '今日注册', value: overview.value.todayRegistered, icon: 'i-lucide-user-plus' },
      { label: '活跃会话', value: overview.value.activeSessions, icon: 'i-lucide-activity' },
      { label: '待审核认证', value: overview.value.pendingAuth, icon: 'i-lucide-clock' },
      { label: '系统运行天数', value: overview.value.uptimeDays, icon: 'i-lucide-server' },
    ]
  })

  const rateLimitLabels: Record<string, string> = {
    global: '全局请求',
    auth: '登录/注册',
    ai: 'AI 接口',
    captcha: '验证码',
  }

  const totalPages = computed(() => Math.ceil(activityTotal.value / pageSize))

  onMounted(() => refreshAll())

  return {
    overview,
    rateLimits,
    activities,
    activityTotal,
    page,
    loading,
    overviewCards,
    rateLimitLabels,
    totalPages,
    refreshAll,
    changePage,
    formatTime,
  }
}
