<script setup lang="ts">
const { stats, scoreDistOption, trendOption, quickActions } = useDashboardData()
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <DashboardUserProfileCard />
      <p class="text-sm text-muted hidden sm:block">
        今日是个好日子，祝您教学顺利！
      </p>
    </div>

    <!-- Stats -->
    <ClientOnly>
      <DashboardStats :stats="stats" />
    </ClientOnly>

    <!-- Quick Actions -->
    <div>
      <h3 class="text-sm font-medium text-muted mb-3">
        快捷入口
      </h3>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <UButton
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          :icon="action.icon"
          :label="action.label"
          color="neutral"
          variant="subtle"
          block
          class="flex-col gap-2 py-4"
        />
      </div>
    </div>

    <!-- Charts -->
    <ClientOnly>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChartLazy
          title="成绩分布"
          subtitle="班级"
          :option="scoreDistOption"
        />
        <DashboardChartLazy
          title="学情趋势"
          subtitle="近8周"
          :option="trendOption"
        />
      </div>
    </ClientOnly>
  </div>
</template>
