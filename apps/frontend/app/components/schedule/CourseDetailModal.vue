<script setup lang="ts">
import type { ScheduleCell } from '~/types/course'

defineProps<{
  cell: ScheduleCell
  position: { row: number, col: number }
}>()

const emit = defineEmits<{
  close: []
  edit: []
}>()

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
      <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {{ cell.course_name }}
          </h3>
          <button
            class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex">
            <span class="w-16 text-zinc-400 shrink-0">时间</span>
            <span class="text-zinc-900 dark:text-zinc-100">
              {{ days[position.col] }} 第{{ position.row + 1 }}节
            </span>
          </div>
          <div v-if="cell.teacher" class="flex">
            <span class="w-16 text-zinc-400 shrink-0">教师</span>
            <span class="text-zinc-900 dark:text-zinc-100">{{ cell.teacher }}</span>
          </div>
          <div v-if="cell.room" class="flex">
            <span class="w-16 text-zinc-400 shrink-0">教室</span>
            <span class="text-zinc-900 dark:text-zinc-100">{{ cell.room }}</span>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors cursor-pointer"
            @click="emit('edit')"
          >
            编辑课程表
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
