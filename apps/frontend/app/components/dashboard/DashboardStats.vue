<script setup lang="ts">
import type { Stat } from '~/types/dashboard'

defineProps<{
  stats: Stat[]
}>()

function formatValue(stat: Stat): string {
  if (stat.formatter) return stat.formatter(Number(stat.value))
  return String(stat.value)
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <UPageCard
      v-for="stat in stats"
      :key="stat.title"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ formatValue(stat) }}
        </span>
        <UBadge
          v-if="stat.variation !== undefined"
          :color="stat.variation >= 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </div>
</template>
