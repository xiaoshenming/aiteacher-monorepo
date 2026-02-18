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
      <ResourcePanel type="testpaper" />
    </template>
  </UDashboardPanel>
</template>
