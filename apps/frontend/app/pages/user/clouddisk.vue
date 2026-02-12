<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="云盘">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CloudDiskPanel />
    </template>
  </UDashboardPanel>
</template>
