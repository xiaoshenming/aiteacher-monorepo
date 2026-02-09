<script setup lang="ts">
const userStore = useUserStore()
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

        <USeparator />

        <p class="text-muted">
          学生中心内容即将上线，敬请期待。
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
