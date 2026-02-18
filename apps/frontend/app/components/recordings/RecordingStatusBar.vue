<script setup lang="ts">
const { formatDuration } = useRecordingFormat()

defineProps<{
  duration: number
  isPaused: boolean
}>()

defineEmits<{
  togglePause: []
  stop: []
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 animate-pulse-subtle">
    <div class="flex items-center gap-3">
      <span class="relative flex size-3">
        <span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span class="relative inline-flex size-3 rounded-full bg-red-500" />
      </span>
      <span class="text-sm font-semibold text-red-600 dark:text-red-400">录制中</span>
      <span class="font-mono text-sm font-bold text-red-700 dark:text-red-300 tabular-nums">{{ formatDuration(duration) }}</span>
    </div>
    <div class="flex items-center gap-2">
      <UButton
        :icon="isPaused ? 'i-lucide-play' : 'i-lucide-pause'"
        variant="soft"
        size="sm"
        :label="isPaused ? '继续' : '暂停'"
        @click="$emit('togglePause')"
      />
      <UButton
        icon="i-lucide-square"
        color="error"
        size="sm"
        label="停止录制"
        @click="$emit('stop')"
      />
    </div>
  </div>
</template>
