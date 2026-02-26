<script setup lang="ts">
const props = defineProps<{
  title: string
  subtitle?: string
  option: Record<string, unknown>
  height?: string
}>()

const hasData = computed(() => props.option && Object.keys(props.option).length > 0)
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
      <VChart v-if="hasData" :option="option" autoresize />
      <div v-else class="h-full flex flex-col items-center justify-center text-muted">
        <UIcon name="i-lucide-bar-chart-3" class="w-10 h-10 mb-2 opacity-30" />
        <p class="text-sm">暂无数据</p>
      </div>
    </div>
  </UCard>
</template>
