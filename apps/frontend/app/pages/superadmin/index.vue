<script setup lang="ts">
import type { Stat } from '~/types/dashboard'

const userStore = useUserStore()

const stats: Stat[] = [
  { title: '总用户', icon: 'i-lucide-users', value: 1286, variation: 12 },
  { title: '总教师', icon: 'i-lucide-graduation-cap', value: 48, variation: 5 },
  { title: '总学生', icon: 'i-lucide-user', value: 1120, variation: 15 },
  { title: '总课程', icon: 'i-lucide-book-open', value: 96, variation: 8 },
]

const growthOption = {
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '新增用户',
      type: 'line',
      smooth: true,
      data: [120, 200, 150, 280, 320, 410],
      areaStyle: { opacity: 0.15 },
    },
  ],
}

const roleOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 1120, name: '学生' },
        { value: 48, name: '教师' },
        { value: 110, name: '普通用户' },
        { value: 6, name: '管理员' },
        { value: 2, name: '超级管理员' },
      ],
    },
  ],
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="仪表盘">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-crown" class="text-2xl text-primary" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-highlighted">
              欢迎回来，{{ userStore.userInfo.name || '超级管理员' }}
            </h1>
            <p class="text-sm text-muted">
              {{ userStore.roleLabel }} · 超级管理后台
            </p>
          </div>
        </div>

        <ClientOnly>
          <DashboardStats :stats="stats" />
        </ClientOnly>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientOnly>
            <DashboardChart title="用户增长趋势" subtitle="近6个月" :option="growthOption" />
          </ClientOnly>
          <ClientOnly>
            <DashboardChart title="角色分布" subtitle="全平台" :option="roleOption" />
          </ClientOnly>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
