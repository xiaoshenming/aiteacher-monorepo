<template>
  <div class="flex flex-col items-center justify-center py-8">
    <div class="w-48 h-48 rounded-full border-4 border-primary flex items-center justify-center mb-4 transition-all duration-300"
      :class="pickedId ? 'bg-primary/10 scale-110' : 'bg-zinc-100 dark:bg-zinc-800'">
      <span class="text-2xl font-bold" :class="pickedId ? 'text-primary' : 'text-muted'">
        {{ displayName }}
      </span>
    </div>
    <p v-if="pickedId" class="text-lg font-medium text-highlighted">
      被选中的同学：{{ displayName }}
    </p>
    <p v-else class="text-muted">等待点名...</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  students: { id: string, name?: string }[]
  pickedId: string | null
}>()

const displayName = computed(() => {
  if (!props.pickedId) return '?'
  const s = props.students.find(s => String(s.id) === String(props.pickedId))
  return s?.name || `学生${props.pickedId}`
})
</script>
