<script setup lang="ts">
import type { Course } from '~/types/course'

defineProps<{
  course: Course
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    class="group rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all cursor-pointer p-5"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-50 dark:bg-teal-900/20">
        <UIcon name="i-lucide-book-open" class="w-5 h-5 text-teal-500" />
      </div>
    </div>
    <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">
      {{ course.name }}
    </h3>
    <p class="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mb-3 min-h-[2rem]">
      {{ course.description || '暂无描述' }}
    </p>
    <div class="flex items-center gap-3 text-xs text-zinc-400">
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
        {{ course.class_count ?? 0 }} 个班级
      </span>
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-graduation-cap" class="w-3.5 h-3.5" />
        {{ course.student_count ?? 0 }} 名学生
      </span>
    </div>
  </div>
</template>
