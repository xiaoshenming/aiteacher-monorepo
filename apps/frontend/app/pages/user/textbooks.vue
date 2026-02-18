<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课本阅览">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ResourcePanel type="textbook" />
    </template>
  </UDashboardPanel>
</template>
