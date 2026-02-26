<script setup lang="ts">
import gsap from 'gsap'

const {
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
  formatMinutes,
  formatTokens,
  loadData,
} = useDashboardData()

onMounted(async () => {
  await loadData()
  nextTick(() => {
    gsap.from('.dashboard-card', {
      y: 16,
      opacity: 0,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power3.out',
    })
  })
})
</script>

<template>
  <div class="w-full max-w-[1800px] mx-auto space-y-4 lg:space-y-5">
    <!-- Hero: 欢迎区 + 快捷入口 -->
    <DashboardFlowHeroSection
      :active-days="dashboard?.prepare?.active_days ?? 0"
      :total-sessions="dashboard?.prepare?.total_sessions ?? 0"
      :total-minutes="dashboard?.prepare?.total_minutes ?? 0"
      :format-minutes="formatMinutes"
      :actions="quickActions"
      :loading="loading"
    />

    <!-- 主体：左内容 + 右侧栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 lg:gap-5">
      <!-- 左：主内容区 -->
      <div class="space-y-4 lg:space-y-5 min-w-0">
        <!-- 统计卡片：AI 相关 3 个（备课数据已在 Hero 展示） -->
        <div class="grid grid-cols-3 gap-3">
          <DashboardFlowStatCard
            icon="i-lucide-bot"
            label="AI 调用"
            :value="dashboard?.ai?.total_calls ?? 0"
            unit="次"
            color="amber"
            :loading="loading"
            to="/user/data"
          />
          <DashboardFlowStatCard
            icon="i-lucide-file-text"
            label="生成内容"
            :value="dashboard?.prepare?.total_generates ?? 0"
            unit="份"
            color="sky"
            :loading="loading"
          />
          <DashboardFlowStatCard
            icon="i-lucide-coins"
            label="Token 消耗"
            :value="formatTokens(dashboard?.ai?.total_tokens ?? 0)"
            color="emerald"
            :loading="loading"
          />
        </div>

        <!-- 三个图表一行：趋势(大) + 模型分布 + 备课活跃度 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[5fr_3fr_4fr] gap-4">
          <ClientOnly>
            <div class="dashboard-card">
              <DashboardChartLazy
                title="AI 使用趋势"
                subtitle="近30天"
                :option="aiTrendOption"
                height="300px"
              />
            </div>
            <div class="dashboard-card">
              <DashboardChartLazy
                title="AI 模型分布"
                subtitle="调用占比"
                :option="aiModelOption"
                height="300px"
              />
            </div>
            <div class="dashboard-card">
              <DashboardChartLazy
                title="备课活跃度"
                subtitle="近30天"
                :option="prepareTrendOption"
                height="300px"
              />
            </div>
          </ClientOnly>
        </div>

        <!-- 教学成就 + AI 洞察（桌面端 2 列） -->
        <div class="hidden lg:grid grid-cols-2 gap-4">
          <div class="dashboard-card">
            <DashboardFlowAchievementBar
              :total-generates="dashboard?.prepare?.total_generates ?? 0"
              :total-calls="dashboard?.ai?.total_calls ?? 0"
              :total-tokens="dashboard?.ai?.total_tokens ?? 0"
              :loading="loading"
            />
          </div>
          <div class="dashboard-card">
            <DashboardFlowAIInsightCard
              :ai-usage="aiUsage"
              :total-calls="dashboard?.ai?.total_calls ?? 0"
              :total-tokens="dashboard?.ai?.total_tokens ?? 0"
              :popular-functions="popularFunctions"
              :loading="loading"
            />
          </div>
        </div>
      </div>

      <!-- 右：侧边栏（桌面端） -->
      <aside class="hidden lg:block">
        <div class="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
          <div class="dashboard-card">
            <DashboardBentoTodoCard
              :pending-assignments="pendingAssignments"
              :unread-messages="unreadMessages"
              :loading="loading"
            />
          </div>
          <div class="dashboard-card">
            <DashboardBentoPopularAI
              :functions="popularFunctions"
              :loading="loading"
            />
          </div>
          <div class="dashboard-card">
            <DashboardBentoRecommendCard
              :recommendations="recommendations"
              :loading="loading"
            />
          </div>
        </div>
      </aside>

      <!-- 移动端：侧栏内容回流 -->
      <div class="lg:hidden space-y-4">
        <DashboardBentoTodoCard
          :pending-assignments="pendingAssignments"
          :unread-messages="unreadMessages"
          :loading="loading"
        />
        <DashboardFlowAchievementBar
          :total-generates="dashboard?.prepare?.total_generates ?? 0"
          :total-calls="dashboard?.ai?.total_calls ?? 0"
          :total-tokens="dashboard?.ai?.total_tokens ?? 0"
          :loading="loading"
        />
        <DashboardFlowAIInsightCard
          :ai-usage="aiUsage"
          :total-calls="dashboard?.ai?.total_calls ?? 0"
          :total-tokens="dashboard?.ai?.total_tokens ?? 0"
          :popular-functions="popularFunctions"
          :loading="loading"
        />
        <DashboardBentoPopularAI
          :functions="popularFunctions"
          :loading="loading"
        />
        <DashboardBentoRecommendCard
          :recommendations="recommendations"
          :loading="loading"
        />
      </div>
    </div>
  </div>
</template>
