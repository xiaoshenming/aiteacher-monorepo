<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="VIP订阅">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UserSubscriptionPanel />
    </template>
  </UDashboardPanel>
</template>
