<template>
  <div class="text-center space-y-2">
    <div class="text-sm text-muted">测验结果</div>
    <div class="relative w-32 h-32 mx-auto">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke-width="8"
          class="stroke-zinc-200 dark:stroke-zinc-700" />
        <circle cx="50" cy="50" r="42" fill="none" stroke-width="8"
          class="stroke-primary" stroke-linecap="round"
          :stroke-dasharray="`${percent * 2.64} 264`" />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-2xl font-bold text-highlighted">{{ percent }}%</span>
      </div>
    </div>
    <p class="text-sm text-muted">
      {{ correctCount }}/{{ totalStudents }} 人答对
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  totalStudents: number
  correctCount: number
}>()

const percent = computed(() => {
  if (props.totalStudents === 0) return 0
  return Math.round((props.correctCount / props.totalStudents) * 100)
})
</script>
