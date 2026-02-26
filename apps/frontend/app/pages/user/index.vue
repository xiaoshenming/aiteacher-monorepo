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
      <UserFlowDashboardPanel />
    </template>
  </UDashboardPanel>
</template>
