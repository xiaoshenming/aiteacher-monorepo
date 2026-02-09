<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="试卷阅览">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col items-center justify-center py-24 text-muted">
        <UIcon name="i-lucide-file-text" class="text-4xl mb-3" />
        <p class="text-lg font-medium text-highlighted">试卷阅览</p>
        <p class="mt-1">功能开发中，敬请期待。</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
