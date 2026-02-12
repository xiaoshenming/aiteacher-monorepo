<script setup lang="ts">
import type { ScheduleCell } from '~/types/course'

const props = defineProps<{
  data: ScheduleCell[][]
  editable?: boolean
}>()

const emit = defineEmits<{
  'update:cell': [row: number, col: number, cell: ScheduleCell]
  'click:cell': [row: number, col: number, cell: ScheduleCell]
}>()

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const timeSlots = computed(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) return []
  return props.data.map((_, i) => `第${i + 1}节`)
})

function getCell(row: number, col: number): ScheduleCell {
  if (!Array.isArray(props.data)) return { course_name: '' }
  return props.data?.[row]?.[col] ?? { course_name: '' }
}

// 编辑中的单元格
const editingCell = ref<{ row: number, col: number } | null>(null)
const editForm = ref<ScheduleCell>({ course_name: '' })

function startEdit(row: number, col: number) {
  const cell = getCell(row, col)
  if (!props.editable) {
    emit('click:cell', row, col, cell)
    return
  }
  editingCell.value = { row, col }
  editForm.value = { ...cell }
}

function saveEdit() {
  if (!editingCell.value) return
  emit('update:cell', editingCell.value.row, editingCell.value.col, { ...editForm.value })
  editingCell.value = null
}

function cancelEdit() {
  editingCell.value = null
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-500 dark:text-zinc-400 font-medium w-20">
            时间
          </th>
          <th
            v-for="day in days"
            :key="day"
            class="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-500 dark:text-zinc-400 font-medium"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(_, rowIdx) in timeSlots" :key="rowIdx">
          <td class="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-center text-zinc-500 dark:text-zinc-400 font-medium">
            {{ timeSlots[rowIdx] }}
          </td>
          <td
            v-for="colIdx in 7"
            :key="colIdx"
            class="border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 min-w-[100px] h-16 align-top transition-colors"
            :class="[
              editable ? 'cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-900/10' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              getCell(rowIdx, colIdx - 1).course_name ? 'bg-teal-50/30 dark:bg-teal-900/10' : '',
            ]"
            @click="startEdit(rowIdx, colIdx - 1)"
          >
            <template v-if="editingCell?.row === rowIdx && editingCell?.col === colIdx - 1">
              <div class="space-y-1" @click.stop>
                <input
                  v-model="editForm.course_name"
                  type="text"
                  placeholder="课程"
                  class="w-full px-1.5 py-0.5 text-xs rounded border border-teal-300 dark:border-teal-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                <input
                  v-model="editForm.teacher"
                  type="text"
                  placeholder="教师"
                  class="w-full px-1.5 py-0.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                <input
                  v-model="editForm.room"
                  type="text"
                  placeholder="教室"
                  class="w-full px-1.5 py-0.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                <div class="flex gap-1">
                  <button
                    class="px-1.5 py-0.5 text-xs text-white bg-teal-500 rounded hover:bg-teal-600 cursor-pointer"
                    @click="saveEdit"
                  >
                    确定
                  </button>
                  <button
                    class="px-1.5 py-0.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                    @click="cancelEdit"
                  >
                    取消
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="getCell(rowIdx, colIdx - 1).course_name">
                <p class="text-xs font-medium text-teal-700 dark:text-teal-300 line-clamp-1">
                  {{ getCell(rowIdx, colIdx - 1).course_name }}
                </p>
                <p v-if="getCell(rowIdx, colIdx - 1).teacher" class="text-xs text-zinc-400 mt-0.5">
                  {{ getCell(rowIdx, colIdx - 1).teacher }}
                </p>
                <p v-if="getCell(rowIdx, colIdx - 1).room" class="text-xs text-zinc-400">
                  {{ getCell(rowIdx, colIdx - 1).room }}
                </p>
              </div>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
