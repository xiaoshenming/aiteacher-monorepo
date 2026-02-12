<script setup lang="ts">
import type { Stat } from '~/types/dashboard'

const userStore = useUserStore()

const stats: Stat[] = [
  { title: '我的课程', icon: 'i-lucide-book-open', value: 6 },
  { title: '作业完成率', icon: 'i-lucide-check-circle', value: '85%' },
  { title: '平均分', icon: 'i-lucide-trophy', value: 82 },
  { title: '出勤率', icon: 'i-lucide-calendar-check', value: '96%' },
]

const shortcuts = [
  { label: '我的课程', icon: 'i-lucide-book-open', to: '/student/courses' },
  { label: '作业中心', icon: 'i-lucide-clipboard-list', to: '/student/assignments' },
  { label: '学情数据', icon: 'i-lucide-bar-chart-3', to: '/student/data' },
  { label: '帮助', icon: 'i-lucide-circle-help', to: '/student/help' },
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
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-graduation-cap" class="text-2xl text-primary" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-highlighted">
              欢迎回来，{{ userStore.userInfo.name || '同学' }}
            </h1>
            <p class="text-sm text-muted">
              {{ userStore.roleLabel }} · 学生中心
            </p>
          </div>
        </div>

        <ClientOnly>
          <DashboardStats :stats="stats" />
        </ClientOnly>

        <div>
          <h2 class="text-sm font-medium text-muted mb-3">快捷入口</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NuxtLink
              v-for="item in shortcuts"
              :key="item.to"
              :to="item.to"
              class="flex flex-col items-center gap-2 p-4 rounded-lg border border-default hover:bg-elevated transition-colors"
            >
              <UIcon :name="item.icon" class="text-2xl text-primary" />
              <span class="text-sm text-highlighted">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
