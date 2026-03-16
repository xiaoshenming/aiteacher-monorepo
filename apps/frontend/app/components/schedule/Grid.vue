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

const days = ['周一', '周二', '周三', '周四', '周五']

const timeSlots = [
  { label: '第1-2节', start: '08:00', end: '09:40' },
  { label: '第3-4节', start: '10:00', end: '11:40' },
  { label: '第5-6节', start: '14:00', end: '15:40' },
  { label: '第7-8节', start: '16:00', end: '17:40' },
]

const colors = [
  'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
]

const courseColorMap = new Map<string, string>()
function getCourseColor(name: string) {
  if (!courseColorMap.has(name)) {
    courseColorMap.set(name, colors[courseColorMap.size % colors.length])
  }
  return courseColorMap.get(name)!
}

const visibleSlots = computed(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) return []
  return props.data.slice(0, timeSlots.length).map((_, i) => timeSlots[i])
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
    <table class="w-full border-separate border-spacing-1.5 min-w-[640px]">
      <thead>
        <tr>
          <th class="p-2 text-sm rounded-lg w-24" />
          <th
            v-for="day in days"
            :key="day"
            class="p-3 text-sm font-medium text-highlighted rounded-lg bg-zinc-50 dark:bg-zinc-800"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(slot, rowIdx) in visibleSlots" :key="rowIdx">
          <td class="p-2 text-center rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div class="text-xs font-medium text-highlighted">{{ slot.label }}</div>
            <div class="text-[10px] text-muted mt-0.5">{{ slot.start }}-{{ slot.end }}</div>
          </td>
          <td
            v-for="colIdx in 5"
            :key="colIdx"
            class="align-top h-24 rounded-lg transition-all duration-200"
            :class="[
              getCell(rowIdx, colIdx - 1).course_name
                ? ''
                : 'border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30',
              editable ? 'cursor-pointer' : 'cursor-default',
            ]"
            @click="startEdit(rowIdx, colIdx - 1)"
          >
            <!-- 编辑模式 -->
            <template v-if="editingCell?.row === rowIdx && editingCell?.col === colIdx - 1">
              <div class="p-2 space-y-1 rounded-lg bg-white dark:bg-zinc-900 border border-primary-300 dark:border-primary-700" @click.stop>
                <input
                  v-model="editForm.course_name"
                  type="text"
                  placeholder="课程"
                  class="w-full px-1.5 py-0.5 text-xs rounded border border-primary-300 dark:border-primary-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
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
                    class="px-1.5 py-0.5 text-xs text-white bg-primary-500 rounded hover:bg-primary-600 cursor-pointer"
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
            <!-- 显示模式 -->
            <template v-else>
              <div
                v-if="getCell(rowIdx, colIdx - 1).course_name"
                class="p-2.5 rounded-lg text-xs hover:scale-105 transition-all duration-200 h-full"
                :class="getCourseColor(getCell(rowIdx, colIdx - 1).course_name)"
              >
                <p class="font-semibold text-sm leading-tight">{{ getCell(rowIdx, colIdx - 1).course_name }}</p>
                <p v-if="getCell(rowIdx, colIdx - 1).room" class="mt-1 opacity-80 flex items-center gap-1">
                  <UIcon name="i-lucide-map-pin" class="text-[10px]" />
                  {{ getCell(rowIdx, colIdx - 1).room }}
                </p>
                <p v-if="getCell(rowIdx, colIdx - 1).teacher" class="opacity-70 flex items-center gap-1">
                  <UIcon name="i-lucide-user" class="text-[10px]" />
                  {{ getCell(rowIdx, colIdx - 1).teacher }}
                </p>
              </div>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
