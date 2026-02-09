<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="通知"
  >
    <template #body>
      <div class="flex flex-col items-center justify-center py-12 text-muted">
        <UIcon name="i-lucide-bell-off" class="text-3xl mb-2" />
        <p>暂无通知</p>
      </div>
    </template>
  </USlideover>
</template>
