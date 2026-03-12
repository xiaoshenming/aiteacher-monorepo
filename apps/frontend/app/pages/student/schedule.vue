<script setup lang="ts">
const { apiFetch } = useApi()
const loading = ref(true)
const schedule = ref<any[]>([])

const dayNames = ['', '周一', '周二', '周三', '周四', '周五']
const timeSlots = [
  { label: '第1-2节', start: '08:00', end: '09:40' },
  { label: '第3-4节', start: '10:00', end: '11:40' },
  { label: '第5-6节', start: '14:00', end: '15:40' },
  { label: '第7-8节', start: '16:00', end: '17:40' },
]

const colors = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
]

const courseColorMap = new Map<string, string>()
function getCourseColor(name: string) {
  if (!courseColorMap.has(name)) {
    courseColorMap.set(name, colors[courseColorMap.size % colors.length])
  }
  return courseColorMap.get(name)!
}

function getCell(day: number, slot: { start: string }) {
  return schedule.value.filter(s =>
    s.schedule_day === day && s.start_time?.slice(0, 5) === slot.start
  )
}

onMounted(async () => {
  try {
    const res = await apiFetch<{ code: number, data: { schedule: any[] } }>('/students/schedule')
    if (res.code === 200) schedule.value = res.data.schedule
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课程表">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
        </div>
        <div v-else-if="schedule.length === 0" class="text-center py-12 text-muted">
          暂无课程安排
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th class="p-2 text-sm text-muted border border-default w-20" />
                <th
                  v-for="d in [1,2,3,4,5]" :key="d"
                  class="p-2 text-sm font-medium text-highlighted border border-default"
                >
                  {{ dayNames[d] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.label">
                <td class="p-2 text-xs text-muted border border-default text-center">
                  {{ slot.label }}
                </td>
                <td
                  v-for="d in [1,2,3,4,5]" :key="d"
                  class="p-1 border border-default align-top h-20"
                >
                  <div
                    v-for="(c, i) in getCell(d, slot)" :key="i"
                    class="p-2 rounded text-xs mb-1"
                    :class="getCourseColor(c.course_name)"
                  >
                    <p class="font-medium">{{ c.course_name }}</p>
                    <p class="opacity-75">{{ c.classroom }}</p>
                    <p class="opacity-75">{{ c.teacher_name }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
