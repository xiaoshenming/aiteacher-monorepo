<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  option: Record<string, unknown>
  height?: string
}>()

const DashboardChart = defineAsyncComponent(() =>
  import('./DashboardChart.vue')
)
</script>

<template>
  <Suspense>
    <DashboardChart
      :title="title"
      :subtitle="subtitle"
      :option="option"
      :height="height"
    />
    <template #fallback>
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
        <div :style="{ height: height || '320px' }" class="flex items-center justify-center">
          <div class="w-10 h-10 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-teal-500 animate-spin" />
        </div>
      </UCard>
    </template>
  </Suspense>
</template>
