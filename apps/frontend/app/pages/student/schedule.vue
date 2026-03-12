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
                  v-for="d in [1,2,3,4,5]" :key="d"
                  class="p-3 text-sm font-medium text-highlighted rounded-lg bg-zinc-50 dark:bg-zinc-800"
                >
                  {{ dayNames[d] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.label">
                <td class="p-2 text-center rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <div class="text-xs font-medium text-highlighted">{{ slot.label }}</div>
                  <div class="text-[10px] text-muted mt-0.5">{{ slot.start }}-{{ slot.end }}</div>
                </td>
                <td
                  v-for="d in [1,2,3,4,5]" :key="d"
                  class="align-top h-24 rounded-lg"
                  :class="getCell(d, slot).length === 0 ? 'border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30' : ''"
                >
                  <div
                    v-for="(c, i) in getCell(d, slot)" :key="i"
                    class="p-2.5 rounded-lg text-xs hover:scale-105 transition-all duration-200 cursor-default"
                    :class="getCourseColor(c.course_name)"
                  >
                    <p class="font-semibold text-sm leading-tight">{{ c.course_name }}</p>
                    <p v-if="c.classroom" class="mt-1 opacity-80 flex items-center gap-1">
                      <UIcon name="i-lucide-map-pin" class="text-[10px]" />
                      {{ c.classroom }}
                    </p>
                    <p v-if="c.teacher_name" class="opacity-70 flex items-center gap-1">
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
