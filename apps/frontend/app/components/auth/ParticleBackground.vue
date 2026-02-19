<script setup lang="ts">
const particle1 = ref<HTMLElement>()
const particle2 = ref<HTMLElement>()
const particle3 = ref<HTMLElement>()
const particle4 = ref<HTMLElement>()
const particle5 = ref<HTMLElement>()

defineExpose({
  particle1,
  particle2,
  particle3,
  particle4,
  particle5,
})
</script>

<template>
  <div class="absolute inset-0 z-1 pointer-events-none">
    <div ref="particle1" class="absolute w-2 h-2 rounded-full bg-primary-400/70 blur-sm" />
    <div ref="particle2" class="absolute w-3 h-3 rounded-full bg-cyan-400/60 blur-sm" />
    <div ref="particle3" class="absolute w-2 h-2 rounded-full bg-emerald-400/70 blur-sm" />
    <div ref="particle4" class="absolute w-4 h-4 rounded-full bg-primary-300/50 blur-md" />
    <div ref="particle5" class="absolute w-2.5 h-2.5 rounded-full bg-sky-400/60 blur-sm" />
  </div>
</template>
