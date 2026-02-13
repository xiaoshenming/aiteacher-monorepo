<script setup lang="ts">
import type { Course } from '~/types/course'

const router = useRouter()
const courses = useCourses()
const toast = useToast()

const loading = ref(true)
const list = ref<Course[]>([])
const showCreateModal = ref(false)

async function loadData() {
  loading.value = true
  try {
    list.value = await courses.fetchCourses()
  }
  catch (err) {
    console.error('加载课程列表失败:', err)
    toast.add({ title: '加载课程列表失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function openDetail(course: Course) {
  router.push(`/user/courses/${course.id}`)
}

onMounted(() => loadData())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="课程管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors cursor-pointer"
              @click="showCreateModal = true"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
              添加课程
            </button>
            <button
              class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="刷新"
              @click="loadData"
            >
              <UIcon
                name="i-lucide-refresh-cw"
                class="w-4 h-4 text-zinc-500"
                :class="{ 'animate-spin': loading }"
              />
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <!-- 加载状态 -->
        <div v-if="loading && list.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="i in 8"
            :key="i"
            class="h-36 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 animate-pulse"
          />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && list.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
          <UIcon name="i-lucide-book-open" class="text-4xl mb-3" />
          <p class="text-lg font-medium text-highlighted">暂无课程</p>
          <p class="mt-1">点击右上角「添加课程」开始创建</p>
        </div>

        <!-- 课程卡片列表 -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <CourseCard
            v-for="course in list"
            :key="course.id"
            :course="course"
            @click="openDetail(course)"
          />
        </div>
      </div>

      <CourseAddModal
        :open="showCreateModal"
        @update:open="showCreateModal = $event"
        @created="loadData"
      />
    </template>
  </UDashboardPanel>
</template>
