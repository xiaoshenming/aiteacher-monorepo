<script setup lang="ts">
import type { DashboardData, AIUsageStats, Recommendation, PopularFunction, PPTUsageStats, PPTUsageByModel, PPTUsageByAction } from '~/types/analytics'

const userStore = useUserStore()
const analytics = useAnalytics()

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

  const userType = userStore.userInfo?.role === 'student' ? 'student' : 'teacher'
  const dateRange = getDateRange(selectedRange.value)

  try {
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

watch(selectedRange, () => loadData())

onMounted(() => loadData())

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return tokens.toString()
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)}`
  return minutes.toString()
}

// PPT action label mapping
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="数据分析">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <div class="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <button
                v-for="opt in dateRangeOptions"
                :key="opt.value"
                class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                :class="
                  selectedRange === opt.value
                    ? 'bg-teal-500 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                "
                @click="selectedRange = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <button
              class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="刷新数据"
              @click="loadData"
            >
              <UIcon
                name="i-lucide-refresh-cw"
                class="w-4 h-4 text-zinc-500"
                :class="{ 'animate-spin': loading }"
              />
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- 核心指标卡片 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnalyticsStatCard
            icon="i-lucide-book-open"
            label="备课次数"
            :value="dashboard?.prepare?.total_sessions ?? 0"
            unit="次"
            color="teal"
            :loading="loading"
          />
          <AnalyticsStatCard
            icon="i-lucide-clock"
            label="备课时长"
            :value="formatMinutes(dashboard?.prepare?.total_minutes ?? 0)"
            :unit="(dashboard?.prepare?.total_minutes ?? 0) >= 60 ? '小时' : '分钟'"
            color="indigo"
            :loading="loading"
          />
          <AnalyticsStatCard
            icon="i-lucide-bot"
            label="AI 调用次数"
            :value="dashboard?.ai?.total_calls ?? 0"
            unit="次"
            color="amber"
            :loading="loading"
          />
          <AnalyticsStatCard
            icon="i-lucide-coins"
            label="Token 消耗"
            :value="formatTokens(dashboard?.ai?.total_tokens ?? 0)"
            color="rose"
            :loading="loading"
          />
          <AnalyticsStatCard
            icon="i-lucide-file-text"
            label="生成内容"
            :value="dashboard?.prepare?.total_generates ?? 0"
            unit="份"
            color="sky"
            :loading="loading"
          />
        </div>

        <!-- 图表行 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <AnalyticsPrepareChart
              :details="aiUsage?.details ?? []"
              :loading="loading"
            />
          </div>
          <AnalyticsAIModelChart
            :details="aiUsage?.details ?? []"
            :loading="loading"
          />
        </div>

        <!-- 热度榜 + 推荐 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsPopularFunctions
            :functions="popularFunctions"
            :loading="loading"
          />
          <AnalyticsRecommendationList
            :recommendations="recommendations"
            :loading="loading"
          />
        </div>

        <!-- PPT AI 使用量统计 -->
        <div
          v-if="pptUsage"
          class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5"
        >
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-presentation" class="size-5 text-primary" />
            <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              PPT 生成 AI 用量
            </h3>
          </div>

          <!-- PPT stat cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div class="text-center">
              <p class="text-2xl font-bold text-teal-500">
                {{ pptUsage.total_calls }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">AI 调用次数</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-indigo-500">
                {{ formatTokens(pptUsage.total_tokens) }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">Token 消耗</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-500">
                {{ pptUsage.success_count }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">成功次数</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-rose-500">
                {{ pptUsage.failure_count }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">失败次数</p>
            </div>
          </div>

          <!-- PPT by model + by action -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- By model -->
            <div v-if="pptByModel.length" class="rounded-lg border border-zinc-100 dark:border-zinc-700 p-3">
              <p class="text-xs font-medium text-muted mb-2">按模型分布</p>
              <div class="space-y-2">
                <div
                  v-for="item in pptByModel"
                  :key="`${item.provider}-${item.model}`"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="text-highlighted truncate max-w-[60%]">{{ item.provider }}/{{ item.model }}</span>
                  <div class="flex items-center gap-3 text-muted">
                    <span>{{ item.call_count }}次</span>
                    <span>{{ formatTokens(item.total_tokens) }} tokens</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- By action -->
            <div v-if="pptByAction.length" class="rounded-lg border border-zinc-100 dark:border-zinc-700 p-3">
              <p class="text-xs font-medium text-muted mb-2">按操作类型</p>
              <div class="space-y-2">
                <div
                  v-for="item in pptByAction"
                  :key="item.action"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="text-highlighted">{{ pptActionLabel(item.action) }}</span>
                  <div class="flex items-center gap-3 text-muted">
                    <span>{{ item.call_count }}次</span>
                    <span>{{ formatTokens(item.total_tokens) }} tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 学生角色: 学习统计 -->
        <div
          v-if="userStore.userInfo?.role === 'student' && dashboard?.learning"
          class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5"
        >
          <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            学习效果追踪
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-teal-500">
                {{ dashboard.learning.total_courses }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">参与课程</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-indigo-500">
                {{ dashboard.learning.completed_courses }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">已完成</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-amber-500">
                {{ dashboard.learning.total_study_hours.toFixed(1) }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">学习时长(h)</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-rose-500">
                {{ dashboard.learning.avg_score.toFixed(1) }}
              </p>
              <p class="text-xs text-zinc-400 mt-1">平均分</p>
            </div>
          </div>

          <!-- 薄弱点提示 -->
          <div
            v-if="dashboard.learning.weak_points?.length"
            class="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
          >
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-amber-500" />
              <span class="text-sm font-medium text-amber-700 dark:text-amber-400">薄弱知识点</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="point in dashboard.learning.weak_points"
                :key="point"
                class="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                {{ point }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
