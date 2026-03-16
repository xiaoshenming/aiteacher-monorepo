<script setup lang="ts">
const props = defineProps<{
  suggestion: { score: number, feedback: string }
}>()
defineEmits<{ accept: [] }>()
</script>

<template>
  <div class="p-3 rounded-lg bg-teal-500/10 dark:bg-teal-500/5 border border-teal-200 dark:border-teal-800">
    <div class="flex items-center gap-2 mb-2">
      <UIcon name="i-lucide-sparkles" class="text-teal-500" />
      <span class="text-sm font-medium text-teal-700 dark:text-teal-300">AI 评分建议</span>
    </div>
    <div class="flex items-center gap-4 mb-2">
      <span class="text-sm text-muted">建议分数：</span>
      <span class="text-lg font-semibold text-teal-600 dark:text-teal-400">{{ suggestion.score }}</span>
    </div>
    <p class="text-sm text-muted mb-3">{{ suggestion.feedback }}</p>
    <UButton size="xs" variant="soft" color="primary" label="采纳建议" icon="i-lucide-check" @click="$emit('accept')" />
  </div>
</template>
