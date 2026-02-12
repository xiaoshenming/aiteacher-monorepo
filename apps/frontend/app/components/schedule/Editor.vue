<script setup lang="ts">
import type { ScheduleCell, CourseSchedule } from '~/types/course'

const props = defineProps<{
  schedule: CourseSchedule
}>()

const emit = defineEmits<{
  save: [data: ScheduleCell[][]]
}>()

function createEmptyGrid(rows: number): ScheduleCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: 7 }, () => ({ course_name: '' })),
  )
}

function parseScheduleData(raw: unknown): ScheduleCell[][] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return createEmptyGrid(6) }
  }
  return Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : createEmptyGrid(6)
}

const editData = ref<ScheduleCell[][]>(parseScheduleData(props.schedule.schedule_data))

function handleCellUpdate(row: number, col: number, cell: ScheduleCell) {
  editData.value[row][col] = cell
}

function addRow() {
  editData.value.push(Array.from({ length: 7 }, () => ({ course_name: '' })))
}

function removeLastRow() {
  if (editData.value.length > 1) {
    editData.value.pop()
  }
}

function handleSave() {
  emit('save', JSON.parse(JSON.stringify(editData.value)))
}

watch(() => props.schedule, (val) => {
  editData.value = parseScheduleData(val.schedule_data)
}, { deep: true })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          @click="addRow"
        >
          <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
          添加时间段
        </button>
        <button
          :disabled="editData.length <= 1"
          class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          @click="removeLastRow"
        >
          <UIcon name="i-lucide-minus" class="w-3.5 h-3.5" />
          删除末行
        </button>
      </div>
      <button
        class="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors cursor-pointer"
        @click="handleSave"
      >
        <UIcon name="i-lucide-save" class="w-4 h-4" />
        保存
      </button>
    </div>

    <p class="text-xs text-zinc-400 mb-3">点击单元格编辑课程信息</p>

    <ScheduleGrid
      :data="editData"
      :editable="true"
      @update:cell="handleCellUpdate"
    />
  </div>
</template>
