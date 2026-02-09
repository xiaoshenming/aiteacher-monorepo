<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  option: Record<string, unknown>
  height?: string
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <p v-if="subtitle" class="text-xs text-muted uppercase mb-1">
          {{ subtitle }}
        </p>
        <p class="text-lg font-semibold text-highlighted">
          {{ title }}
        </p>
      </div>
    </template>

    <div :style="{ height: height || '320px' }">
      <VChart :option="option" autoresize />
    </div>
  </UCard>
</template>
