<script setup lang="ts">
const props = defineProps<{
  content: string
  streaming: boolean
}>()

const { html, isComplete, feed, finish, reset } = useStreamingMarkdown()

let lastLength = 0
watch(() => props.content, (newContent) => {
  if (!newContent) {
    reset()
    lastLength = 0
    return
  }
  const delta = newContent.slice(lastLength)
  if (delta) feed(delta)
  lastLength = newContent.length
}, { immediate: true })

watch(() => props.streaming, (streaming) => {
  if (!streaming && props.content) finish()
})

onUnmounted(() => reset())
</script>

<template>
  <div class="streaming-markdown">
    <MDC
      v-if="isComplete"
      :value="content"
      class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
    />
    <div
      v-else
      class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
      v-html="html"
    />
    <span
      v-if="streaming && !isComplete"
      class="inline-block w-2 h-4 bg-primary-500 rounded-sm animate-pulse ml-0.5 align-text-bottom"
    />
  </div>
</template>
