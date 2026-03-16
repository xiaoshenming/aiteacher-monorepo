<template>
  <div class="space-y-3">
    <h4 class="font-medium text-highlighted">{{ question }}</h4>
    <div v-for="(opt, i) in options" :key="i" class="space-y-1">
      <div class="flex items-center justify-between text-sm">
        <span>{{ opt }}</span>
        <span class="text-muted">{{ getCount(opt) }} 票 ({{ getPercent(opt) }}%)</span>
      </div>
      <div class="w-full h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full transition-all duration-500"
          :style="{ width: `${getPercent(opt)}%` }" />
      </div>
    </div>
    <p class="text-sm text-muted">总票数：{{ totalVotes }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  question: string
  options: string[]
  votes: Record<string, number>
}>()

const totalVotes = computed(() =>
  Object.values(props.votes || {}).reduce((a, b) => a + b, 0),
)

function getCount(opt: string) {
  return props.votes?.[opt] || 0
}

function getPercent(opt: string) {
  if (totalVotes.value === 0) return 0
  return Math.round((getCount(opt) / totalVotes.value) * 100)
}
</script>
