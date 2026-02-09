<script setup lang="ts">
const userStore = useUserStore()
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

        <USeparator />

        <p class="text-muted">
          超级管理后台内容即将上线，敬请期待。
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
