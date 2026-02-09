<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课程设置">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col items-center justify-center py-24 text-muted">
        <UIcon name="i-lucide-settings" class="text-4xl mb-3" />
        <p class="text-lg font-medium text-highlighted">课程设置</p>
        <p class="mt-1">功能开发中，敬请期待。</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
