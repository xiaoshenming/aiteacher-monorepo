<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课堂录制">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <RecordingsPanel />
    </template>
  </UDashboardPanel>
</template>
