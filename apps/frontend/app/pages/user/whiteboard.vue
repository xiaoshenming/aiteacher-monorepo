<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role-guard'],
})

const excalidrawUrl = 'http://localhost:10007'

function openWhiteboard() {
  window.open(excalidrawUrl, '_blank')
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="协作白板">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col items-center justify-center h-full gap-6 p-6">
        <UIcon name="i-lucide-pen-tool" class="size-16 text-primary" />
        <h2 class="text-2xl font-semibold">Excalidraw 协作白板</h2>
        <p class="text-muted max-w-md text-center">
          支持多人实时协作的在线白板工具，可用于课堂演示、头脑风暴和教学互动。
        </p>
        <UButton
          size="lg"
          icon="i-lucide-external-link"
          label="打开白板"
          @click="openWhiteboard"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
