<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 5 })
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
    <div class="flex gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
      <USkeleton v-for="i in 4" :key="i" class="h-4 flex-1" />
    </div>
    <div v-for="r in rows" :key="r" class="flex gap-4 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <USkeleton v-for="i in 4" :key="i" class="h-3 flex-1" />
    </div>
  </div>
</template>
