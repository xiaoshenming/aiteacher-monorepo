<template>
  <div class="text-center space-y-4">
    <div class="text-6xl font-mono font-bold text-highlighted tabular-nums">
      {{ display }}
    </div>
    <div class="w-64 mx-auto h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div class="h-full bg-primary rounded-full transition-all duration-1000"
        :style="{ width: `${progressPercent}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  remaining: number
  total?: number
}>()

const display = computed(() => {
  const m = Math.floor(props.remaining / 60)
  const s = props.remaining % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  const t = props.total || 60
  return Math.max(0, (props.remaining / t) * 100)
})
</script>
