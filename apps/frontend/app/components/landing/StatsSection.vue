<script setup lang="ts">
defineProps<{
  stats: Array<{ value: string, label: string }>
  statsVisible: boolean
}>()
</script>

<template>
  <section class="border-t border-default bg-primary/5">
    <UContainer>
      <div class="py-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div
          v-for="(stat, index) in stats"
          :key="stat.label"
          :class="[
            'text-center transition-all duration-500 ease-out',
            statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          ]"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <div class="text-3xl sm:text-4xl font-bold text-primary">
            {{ stat.value }}
          </div>
          <div class="mt-2 text-sm text-muted">
            {{ stat.label }}
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
