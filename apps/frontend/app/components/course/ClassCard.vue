<script setup lang="ts">
import type { ClassInfo } from '~/types/course'

defineProps<{
  classInfo: ClassInfo
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    class="group rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer p-5"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
        <UIcon name="i-lucide-school" class="w-5 h-5 text-indigo-500" />
      </div>
    </div>
    <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">
      {{ classInfo.name }}
    </h3>
    <div class="flex items-center gap-3 text-xs text-zinc-400 mt-2">
      <span v-if="classInfo.course_name" class="flex items-center gap-1">
        <UIcon name="i-lucide-book-open" class="w-3.5 h-3.5" />
        {{ classInfo.course_name }}
      </span>
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
        {{ classInfo.student_count ?? 0 }} 名学生
      </span>
    </div>
  </div>
</template>
