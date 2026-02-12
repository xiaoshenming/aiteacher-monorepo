<script setup lang="ts">
const page = defineModel<number>('page', { required: true })

const props = defineProps<{
  total: number
  pageSize: number
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
    <button
      :disabled="page <= 1"
      class="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      @click="page--"
    >
      上一页
    </button>
    <span class="text-sm text-zinc-500">{{ page }} / {{ totalPages }}</span>
    <button
      :disabled="page >= totalPages"
      class="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      @click="page++"
    >
      下一页
    </button>
  </div>
</template>
