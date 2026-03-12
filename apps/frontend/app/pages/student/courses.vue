<script setup lang="ts">
const { apiFetch } = useApi()

const courses = ref<any[]>([])
const loading = ref(false)

// gradients removed — unified to teal primary stripe

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
            v-for="course in courses" :key="course.id"
            class="group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <!-- 顶部细条纹 -->
            <div class="h-1 bg-primary" />
            <div class="p-5 space-y-3">
              <!-- 课程名 + 科目标签 -->
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-base text-highlighted line-clamp-1">
                  {{ course.name }}
                </h3>
                <UBadge v-if="course.subject" variant="subtle" color="primary" size="sm">
                  <UIcon :name="getSubjectIcon(course.subject)" class="text-xs mr-1" />
                  {{ course.subject }}
                </UBadge>
              </div>
              <!-- 描述 -->
              <p v-if="course.description" class="text-sm text-muted line-clamp-2">
                {{ course.description }}
              </p>
              <!-- 信息行 -->
              <div class="space-y-1.5 text-xs text-muted">
                <div v-if="course.teacher_name" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-user" class="text-sm" />
                  <span>{{ course.teacher_name }}</span>
                </div>
                <div v-if="course.class_name" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-users" class="text-sm" />
                  <span>{{ course.class_name }}</span>
                </div>
                <div v-for="(s, si) in course.schedules" :key="si" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="text-sm" />
                  <span>{{ dayMap[s.day] }} {{ formatTime(s.start_time, s.end_time) }}</span>
                  <span v-if="s.classroom" class="ml-1 text-muted">· {{ s.classroom }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
