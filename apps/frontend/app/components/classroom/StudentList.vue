<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-muted">在线学生</h4>
      <UBadge variant="subtle" size="sm" color="primary">{{ students.length }}</UBadge>
    </div>
    <div class="space-y-1 max-h-80 overflow-y-auto">
      <div v-for="s in students" :key="s.id"
        class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
          {{ (s.name || '?').charAt(0) }}
        </div>
        <span class="text-sm text-highlighted truncate">{{ s.name || `学生${s.id}` }}</span>
      </div>
      <p v-if="!students.length" class="text-sm text-muted text-center py-4">暂无学生加入</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  students: { id: string, name?: string }[]
}>()
</script>
