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
  'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
  'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  'bg-gradient-to-br from-rose-500 to-pink-600 text-white',
  'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
  'bg-gradient-to-br from-cyan-500 to-sky-600 text-white',
  'bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white',
  'bg-gradient-to-br from-lime-500 to-green-600 text-white',
]

const headerColors = [
  'bg-gradient-to-r from-blue-500 to-indigo-500',
  'bg-gradient-to-r from-emerald-500 to-teal-500',
  'bg-gradient-to-r from-rose-500 to-pink-500',
  'bg-gradient-to-r from-amber-500 to-orange-500',
  'bg-gradient-to-r from-violet-500 to-purple-500',
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
          <table class="w-full border-separate border-spacing-1.5 min-w-[640px]">
            <thead>
              <tr>
                <th class="p-2 text-sm rounded-lg w-24" />
                <th
                  v-for="(d, di) in [1,2,3,4,5]" :key="d"
                  class="p-3 text-sm font-bold text-white rounded-lg shadow-md"
                  :class="headerColors[di]"
                >
                  {{ dayNames[d] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.label">
                <td class="p-2 text-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div class="text-xs font-bold text-gray-700 dark:text-gray-200">{{ slot.label }}</div>
                  <div class="text-[10px] text-gray-400 mt-0.5">{{ slot.start }}-{{ slot.end }}</div>
                </td>
                <td
                  v-for="d in [1,2,3,4,5]" :key="d"
                  class="align-top h-24 rounded-lg"
                  :class="getCell(d, slot).length === 0 ? 'border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30' : ''"
                >
                  <div
                    v-for="(c, i) in getCell(d, slot)" :key="i"
                    class="p-2.5 rounded-lg text-xs shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default"
                    :class="getCourseColor(c.course_name)"
                  >
                    <p class="font-bold text-sm leading-tight">{{ c.course_name }}</p>
                    <p v-if="c.classroom" class="mt-1 opacity-90 flex items-center gap-1">
                      <UIcon name="i-lucide-map-pin" class="text-[10px]" />
                      {{ c.classroom }}
                    </p>
                    <p v-if="c.teacher_name" class="opacity-80 flex items-center gap-1">
                      <UIcon name="i-lucide-user" class="text-[10px]" />
                      {{ c.teacher_name }}
                    </p>
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
