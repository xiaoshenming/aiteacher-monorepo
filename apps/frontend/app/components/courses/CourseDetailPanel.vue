<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const courseId = computed(() => Number(route.params.id))

const {
  loading,
  course,
  showAddClass,
  allClasses,
  addingClassId,
  showAddAssistant,
  teachers,
  addingAssistantId,
  loadCourse,
  loadClasses,
  loadTeachers,
  linkClass,
  addAssistant,
  removeAssistant,
  goToClass,
} = useCourseDetail(courseId)

onMounted(() => loadCourse())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-2">
            <UDashboardSidebarCollapse />
            <button
              class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="返回课程列表"
              @click="router.push('/user/courses')"
            >
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4 text-zinc-500" />
            </button>
            <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {{ course?.name || '课程详情' }}
            </span>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <div v-else-if="course" class="p-6 space-y-6">
        <!-- 课程信息 -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{{ course.name }}</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ course.description || '暂无描述' }}</p>
          <div class="flex items-center gap-4 mt-3 text-xs text-zinc-400">
            <span v-if="course.teacher_name" class="flex items-center gap-1">
              <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
              {{ course.teacher_name }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
              {{ course.classes?.length ?? 0 }} 个班级
            </span>
          </div>
        </div>

        <!-- 班级列表 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">关联班级</h3>
            <button
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
              @click="loadClasses"
            >
              <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
              关联班级
            </button>
          </div>
          <div v-if="course.classes && course.classes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="cls in course.classes"
              :key="cls.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              @click="goToClass(cls.id)"
            >
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ cls.name }}</p>
                <p class="text-xs text-zinc-400">{{ cls.student_count ?? 0 }} 名学生</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-zinc-400" />
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-4">暂无关联班级</p>
        </div>

        <!-- 助教管理 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">助教</h3>
            <button
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
              @click="loadTeachers"
            >
              <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
              添加助教
            </button>
          </div>
          <div v-if="course.assistants && course.assistants.length > 0" class="space-y-2">
            <div
              v-for="assistant in course.assistants"
              :key="assistant.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50"
            >
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ assistant.name || assistant.username }}</p>
                <p v-if="assistant.email" class="text-xs text-zinc-400">{{ assistant.email }}</p>
              </div>
              <button
                class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                title="移除助教"
                @click="removeAssistant(assistant.id)"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-4">暂无助教</p>
        </div>
      </div>

      <!-- 关联班级弹窗 -->
      <CoursesAddClassModal
        v-if="showAddClass"
        :classes="allClasses"
        :adding-id="addingClassId"
        @close="showAddClass = false"
        @add="linkClass"
      />

      <!-- 添加助教弹窗 -->
      <CoursesAddAssistantModal
        v-if="showAddAssistant"
        :teachers="teachers"
        :adding-id="addingAssistantId"
        :existing-ids="course?.assistants?.map(a => a.id) ?? []"
        :main-teacher-id="course?.main_teacher_id ?? null"
        @close="showAddAssistant = false"
        @add="addAssistant"
      />
    </template>
  </UDashboardPanel>
</template>
