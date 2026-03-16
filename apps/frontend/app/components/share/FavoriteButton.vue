<template>
  <button
    class="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
    :class="favorited
      ? 'text-teal-500 bg-teal-500/10 hover:bg-teal-500/20'
      : 'text-zinc-400 dark:text-zinc-500 hover:text-teal-500 hover:bg-teal-500/10'"
    @click.stop="$emit('toggle')"
  >
    <UIcon
      :name="favorited ? 'i-lucide-heart' : 'i-lucide-heart'"
      :class="favorited ? 'fill-current' : ''"
      class="w-4 h-4"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  resourceType: string
  resourceId: number
  favorited: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>
