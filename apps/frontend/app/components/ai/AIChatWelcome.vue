<script setup lang="ts">
import type { QuickQuestion } from '~/composables/useAIChat'

defineProps<{
  title: string
  description: string
  quickQuestions: QuickQuestion[]
}>()

const emit = defineEmits<{
  quickQuestion: [text: string]
}>()
</script>

<template>
  <div class="text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
      <UIcon name="i-lucide-bot" class="size-8 text-primary" />
    </div>
    <h2 class="text-2xl font-bold text-highlighted mb-2">
      {{ title }}
    </h2>
    <p class="text-muted max-w-md mx-auto">
      {{ description }}
    </p>
  </div>

  <slot />

  <div class="flex flex-wrap justify-center gap-2">
    <UButton
      v-for="q in quickQuestions"
      :key="q.label"
      :icon="q.icon"
      :label="q.label"
      size="sm"
      color="neutral"
      variant="outline"
      class="rounded-full"
      @click="emit('quickQuestion', q.label)"
    />
  </div>
</template>
