<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="AI助手">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col items-center justify-center py-24 text-muted">
        <UIcon name="i-lucide-bot" class="text-4xl mb-3" />
        <p class="text-lg font-medium text-highlighted">AI助手</p>
        <p class="mt-1">功能开发中，敬请期待。</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
