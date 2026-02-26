<script setup lang="ts">
const {
  loading,
  dashboard,
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

onMounted(() => loadData())
</script>

<template>
  <div class="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
    <!-- Row 1: 欢迎 + 待办 -->
    <DashboardBentoWelcomeCard
      :prepare-days="dashboard?.prepare?.active_days ?? 0"
      :total-sessions="dashboard?.prepare?.total_sessions ?? 0"
      :loading="loading"
      class="sm:col-span-2 lg:col-span-3"
    />
    <DashboardBentoTodoCard
      :pending-assignments="pendingAssignments"
      :unread-messages="unreadMessages"
      :loading="loading"
      class="lg:col-span-3"
    />

    <!-- Row 2: 6个统计卡片 -->
    <DashboardBentoStatCard
      icon="i-lucide-book-open"
      label="备课次数"
      :value="dashboard?.prepare?.total_sessions ?? 0"
      unit="次"
      color="primary"
      :loading="loading"
      to="/user/data"
    />
    <DashboardBentoStatCard
      icon="i-lucide-clock"
      label="备课时长"
      :value="formatMinutes(dashboard?.prepare?.total_minutes ?? 0)"
      :unit="(dashboard?.prepare?.total_minutes ?? 0) >= 60 ? '小时' : '分钟'"
      color="indigo"
      :loading="loading"
      to="/user/data"
    />
    <DashboardBentoStatCard
      icon="i-lucide-bot"
      label="AI 调用"
      :value="dashboard?.ai?.total_calls ?? 0"
      unit="次"
      color="amber"
      :loading="loading"
      to="/user/data"
    />
    <DashboardBentoStatCard
      icon="i-lucide-file-text"
      label="生成内容"
      :value="dashboard?.prepare?.total_generates ?? 0"
      unit="份"
      color="sky"
      :loading="loading"
    />
    <DashboardBentoStatCard
      icon="i-lucide-coins"
      label="Token 消耗"
      :value="formatTokens(dashboard?.ai?.total_tokens ?? 0)"
      color="rose"
      :loading="loading"
    />
    <DashboardBentoStatCard
      icon="i-lucide-zap"
      label="活跃天数"
      :value="dashboard?.prepare?.active_days ?? 0"
      unit="天"
      color="emerald"
      :loading="loading"
    />

    <!-- Row 3: AI 使用趋势 + AI 模型分布 -->
    <ClientOnly>
      <DashboardChartLazy
        title="AI 使用趋势"
        subtitle="近30天"
        :option="aiTrendOption"
        height="300px"
        class="sm:col-span-2 lg:col-span-4"
      />
      <DashboardChartLazy
        title="AI 模型分布"
        subtitle="调用占比"
        :option="aiModelOption"
        height="300px"
        class="sm:col-span-2 lg:col-span-2"
      />
    </ClientOnly>

    <!-- Row 4: 备课活跃度 + 热门AI功能 -->
    <ClientOnly>
      <DashboardChartLazy
        title="备课活跃度"
        subtitle="近30天"
        :option="prepareTrendOption"
        height="260px"
        class="sm:col-span-2 lg:col-span-3"
      />
    </ClientOnly>
    <DashboardBentoPopularAI
      :functions="popularFunctions"
      :loading="loading"
      class="sm:col-span-2 lg:col-span-3"
    />

    <!-- Row 5: 教学成就 + 快捷入口 + 智能推荐 -->
    <DashboardBentoAchievementCard
      :total-generates="dashboard?.prepare?.total_generates ?? 0"
      :total-calls="dashboard?.ai?.total_calls ?? 0"
      :total-tokens="dashboard?.ai?.total_tokens ?? 0"
      :loading="loading"
      class="sm:col-span-2 lg:col-span-2"
    />
    <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 sm:col-span-2 lg:col-span-2">
      <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-zap" class="w-4 h-4" />
        快捷入口
      </h3>
      <div class="grid grid-cols-2 gap-1.5">
        <UButton
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          :icon="action.icon"
          :label="action.label"
          color="neutral"
          variant="subtle"
          size="xs"
          block
          class="justify-start"
        />
      </div>
    </div>
    <DashboardBentoRecommendCard
      :recommendations="recommendations"
      :loading="loading"
      class="sm:col-span-2 lg:col-span-2"
    />
  </div>
</template>
