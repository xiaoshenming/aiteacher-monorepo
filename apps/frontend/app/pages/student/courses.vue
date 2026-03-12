<script setup lang="ts">
const { apiFetch } = useApi()

const courses = ref<any[]>([])
const loading = ref(false)

const gradients = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-sky-500',
  'from-indigo-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
]

const subjectIcons: Record<string, string> = {
  语文: 'i-lucide-book-open',
  数学: 'i-lucide-calculator',
  英语: 'i-lucide-languages',
  物理: 'i-lucide-atom',
  化学: 'i-lucide-flask-conical',
  生物: 'i-lucide-leaf',
  历史: 'i-lucide-landmark',
  地理: 'i-lucide-globe',
  政治: 'i-lucide-scale',
}

const dayMap: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日',
}

function getGradient(index: number) {
  return gradients[index % gradients.length]
}

function getSubjectIcon(subject: string) {
  return subjectIcons[subject] || 'i-lucide-book-open'
}

function formatTime(start: string, end: string) {
  return `${start?.slice(0, 5)}-${end?.slice(0, 5)}`
}

// 去重合并：同一课程多个时间段合并到一起
function mergeCourses(raw: any[]) {
  const map = new Map<number, any>()
  for (const item of raw) {
    if (map.has(item.id)) {
      const existing = map.get(item.id)
      if (item.schedule_day || item.start_time) {
        existing.schedules.push({
          day: item.schedule_day,
          start_time: item.start_time,
          end_time: item.end_time,
          classroom: item.classroom,
        })
      }
    } else {
      const schedules = []
      if (item.schedule_day || item.start_time) {
        schedules.push({
          day: item.schedule_day,
          start_time: item.start_time,
          end_time: item.end_time,
          classroom: item.classroom,
        })
      }
      map.set(item.id, { ...item, schedules })
    }
  }
  return Array.from(map.values())
}

async function loadCourses() {
  loading.value = true
  try {
    const res = await apiFetch<{ code: number, data: { courses: any[] } }>('/students/courses')
    const raw = res.data?.courses || []
    courses.value = mergeCourses(raw)
  }
  catch {
    courses.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(loadCourses)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="我的课程">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-2xl text-muted animate-spin" />
        </div>
        <div v-else-if="courses.length === 0" class="flex flex-col items-center py-12 text-muted">
          <UIcon name="i-lucide-book-open" class="text-4xl mb-3" />
          <p>暂无课程</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(course, idx) in courses" :key="course.id"
            class="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800/80"
          >
            <!-- 渐变顶部条纹 -->
            <div class="h-2 bg-gradient-to-r" :class="getGradient(idx)" />
            <div class="p-5 space-y-3">
              <!-- 课程名 + 科目标签 -->
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-bold text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                  {{ course.name }}
                </h3>
                <span
                  v-if="course.subject"
                  class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r"
                  :class="getGradient(idx)"
                >
                  <UIcon :name="getSubjectIcon(course.subject)" class="text-xs" />
                  {{ course.subject }}
                </span>
              </div>
              <!-- 描述 -->
              <p v-if="course.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {{ course.description }}
              </p>
              <!-- 信息行 -->
              <div class="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div v-if="course.teacher_name" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-user" class="text-sm" />
                  <span>{{ course.teacher_name }}</span>
                </div>
                <div v-if="course.class_name" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-users" class="text-sm" />
                  <span>{{ course.class_name }}</span>
                </div>
                <!-- 上课时间 -->
                <div v-for="(s, si) in course.schedules" :key="si" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="text-sm" />
                  <span>{{ dayMap[s.day] }} {{ formatTime(s.start_time, s.end_time) }}</span>
                  <span v-if="s.classroom" class="ml-1 text-gray-400">· {{ s.classroom }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
