<script setup lang="ts">
import type { Stat } from '~/types/dashboard'

const stats: Stat[] = [
  {
    title: '平均分',
    icon: 'i-lucide-trophy',
    value: 82.5,
    variation: 3.2,
  },
  {
    title: '及格率',
    icon: 'i-lucide-check-circle',
    value: '92%',
    variation: 1.5,
  },
  {
    title: '出勤率',
    icon: 'i-lucide-calendar-check',
    value: '96.8%',
    variation: 0.3,
  },
  {
    title: '作业完成率',
    icon: 'i-lucide-clipboard-check',
    value: '87.5%',
    variation: -2.1,
  },
]

const scoreDistOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['<60', '60-70', '70-80', '80-90', '90-100'],
  },
  yAxis: {
    type: 'value',
    name: '人数',
  },
  series: [
    {
      name: '人数',
      type: 'bar',
      data: [5, 8, 15, 25, 12],
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: 'var(--ui-primary)',
      },
    },
  ],
}))

const trendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['平均分', '及格率'],
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'],
  },
  yAxis: {
    type: 'value',
    min: 60,
    max: 100,
  },
  series: [
    {
      name: '平均分',
      type: 'line',
      smooth: true,
      data: [76, 78, 79, 80, 81, 80, 82, 82.5],
      itemStyle: { color: 'var(--ui-primary)' },
    },
    {
      name: '及格率',
      type: 'line',
      smooth: true,
      data: [85, 87, 88, 89, 90, 91, 91, 92],
      itemStyle: { color: 'var(--ui-success)' },
    },
  ],
}))

const quickActions = [
  { label: 'AI问答', icon: 'i-lucide-bot', to: '/user/ai' },
  { label: '课程表', icon: 'i-lucide-calendar-days', to: '/user/class-schedule' },
  { label: 'AI智能出题', icon: 'i-lucide-brain', to: '/user/topic' },
  { label: '作业发布', icon: 'i-lucide-clipboard-list', to: '/user/assignment' },
  { label: '学情分析', icon: 'i-lucide-bar-chart-3', to: '/user/data' },
  { label: 'PPT工具', icon: 'i-lucide-presentation', to: '/user/ppt' },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="首页">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Welcome -->
        <div class="flex items-center justify-between">
          <DashboardUserProfileCard />
          <p class="text-sm text-muted hidden sm:block">
            今日是个好日子，祝您教学顺利！
          </p>
        </div>

        <!-- Stats -->
        <DashboardStats :stats="stats" />

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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardChart
            title="成绩分布"
            subtitle="班级"
            :option="scoreDistOption"
          />
          <DashboardChart
            title="学情趋势"
            subtitle="近8周"
            :option="trendOption"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
