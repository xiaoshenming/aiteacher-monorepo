<script setup lang="ts">
import type { CourseSchedule, ScheduleCell } from '~/types/course'

const schedule = useSchedule()
const toast = useToast()

const loading = ref(true)
const schedules = ref<CourseSchedule[]>([])
const activeId = ref<number | null>(null)
const editing = ref(false)

// 新建课程表
const showCreate = ref(false)
const creating = ref(false)

const activeSchedule = computed(() => schedules.value.find(s => s.id === activeId.value) ?? null)

// 课程详情弹窗
const showDetail = ref(false)
const detailCell = ref<ScheduleCell | null>(null)
const detailPosition = ref({ row: 0, col: 0 })

function handleCellClick(row: number, col: number, cell: ScheduleCell) {
  if (cell.course_name) {
    detailCell.value = cell
    detailPosition.value = { row, col }
    showDetail.value = true
  }
}

async function loadData() {
  loading.value = true
  try {
    schedules.value = await schedule.fetchSchedules()
    if (schedules.value.length > 0) {
      const active = schedules.value.find(s => s.is_active)
      activeId.value = active?.id ?? schedules.value[0]?.id ?? null
    }
  }
  catch (err) {
    console.error('加载课程表失败:', err)
    toast.add({ title: '加载课程表失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleCreate(name: string) {
  creating.value = true
  try {
    const defaultGrid: ScheduleCell[][] = Array.from({ length: 6 }, () =>
      Array.from({ length: 7 }, () => ({ course_name: '' })),
    )
    const res = await schedule.createSchedule({ name, schedule_data: defaultGrid })
    showCreate.value = false
    await loadData()
    if (res.data) activeId.value = res.data.id
  }
  catch (err) {
    console.error('创建课程表失败:', err)
    toast.add({ title: '创建课程表失败', color: 'error' })
  }
  finally {
    creating.value = false
  }
}

async function handleSave(data: ScheduleCell[][]) {
  if (!activeId.value) return
  try {
    await schedule.updateSchedule(activeId.value, { schedule_data: data })
    toast.add({ title: '课程表已保存', color: 'success' })
    editing.value = false
    await loadData()
  }
  catch (err) {
    console.error('保存课程表失败:', err)
    toast.add({ title: '保存失败', color: 'error' })
  }
}

async function handleSetActive(id: number) {
  try {
    await schedule.updateSchedule(id, { is_active: true })
    toast.add({ title: '已设为当前课程表', color: 'success' })
    await loadData()
  }
  catch (err) {
    console.error('设置激活状态失败:', err)
    toast.add({ title: '操作失败', color: 'error' })
  }
}

async function handleDelete(id: number) {
  try {
    await schedule.deleteSchedule(id)
    toast.add({ title: '课程表已删除', color: 'success' })
    if (activeId.value === id) activeId.value = null
    await loadData()
  }
  catch (err) {
    console.error('删除课程表失败:', err)
    toast.add({ title: '删除失败', color: 'error' })
  }
}

function handleDetailEdit() {
  showDetail.value = false
  editing.value = true
}

onMounted(() => loadData())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课程表">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button
              v-if="activeSchedule && !editing"
              class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              @click="editing = true"
            >
              <UIcon name="i-lucide-pencil" class="w-4 h-4" />
              编辑
            </button>
            <button
              v-if="editing"
              class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              @click="editing = false"
            >
              取消编辑
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors cursor-pointer"
              @click="showCreate = true"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
              新建课程表
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="schedules.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
        <UIcon name="i-lucide-calendar-days" class="text-4xl mb-3" />
        <p class="text-lg font-medium text-highlighted">暂无课程表</p>
        <p class="mt-1">点击右上角「新建课程表」开始创建</p>
      </div>

      <div v-else class="p-6">
        <!-- 课程表切换 -->
        <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <button
            v-for="s in schedules"
            :key="s.id"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer"
            :class="activeId === s.id
              ? 'bg-primary-500 text-white border-primary-500'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
            @click="activeId = s.id; editing = false"
          >
            {{ s.name }}
            <span
              v-if="s.is_active"
              class="px-1.5 py-0.5 text-xs rounded-full"
              :class="activeId === s.id ? 'bg-white/20' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'"
            >
              当前
            </span>
          </button>
        </div>

        <!-- 操作栏 -->
        <div v-if="activeSchedule && !editing" class="flex items-center gap-2 mb-4">
          <button
            v-if="!activeSchedule.is_active"
            class="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
            @click="handleSetActive(activeSchedule.id)"
          >
            设为当前
          </button>
          <button
            class="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            @click="handleDelete(activeSchedule.id)"
          >
            删除
          </button>
        </div>

        <!-- 编辑模式 -->
        <ScheduleEditor
          v-if="activeSchedule && editing"
          :schedule="activeSchedule"
          @save="handleSave"
        />

        <!-- 查看模式 -->
        <ScheduleGrid
          v-else-if="activeSchedule"
          :data="activeSchedule.schedule_data || []"
          @click:cell="handleCellClick"
        />
      </div>

      <!-- 新建课程表弹窗 -->
      <ScheduleCreateScheduleModal
        v-if="showCreate"
        :creating="creating"
        @close="showCreate = false"
        @create="handleCreate"
      />

      <!-- 课程详情弹窗 -->
      <ScheduleCourseDetailModal
        v-if="showDetail && detailCell"
        :cell="detailCell"
        :position="detailPosition"
        @close="showDetail = false"
        @edit="handleDetailEdit"
      />
    </template>
  </UDashboardPanel>
</template>
