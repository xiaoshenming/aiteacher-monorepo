<script setup lang="ts">
import type { Course, ClassInfo, Assistant } from '~/types/course'

const route = useRoute()
const router = useRouter()
const courses = useCourses()
const toast = useToast()

const courseId = computed(() => Number(route.params.id))
const loading = ref(true)
const course = ref<(Course & { classes?: ClassInfo[], assistants?: Assistant[] }) | null>(null)

// 添加班级
const showAddClass = ref(false)
const allClasses = ref<ClassInfo[]>([])
const addingClassId = ref<number | null>(null)

// 添加助教
const showAddAssistant = ref(false)
const teachers = ref<Assistant[]>([])
const addingAssistantId = ref<number | null>(null)

async function loadData() {
  loading.value = true
  try {
    course.value = await courses.fetchCourseDetail(courseId.value)
  }
  catch (err) {
    console.error('加载课程详情失败:', err)
    toast.add({ title: '加载课程详情失败', color: 'error' })
    router.push('/user/courses')
  }
  finally {
    loading.value = false
  }
}

async function openAddClass() {
  showAddClass.value = true
  try {
    allClasses.value = await courses.fetchClasses()
  }
  catch (err) {
    console.error('加载班级列表失败:', err)
  }
}

async function handleAddClass(classId: number) {
  addingClassId.value = classId
  try {
    await courses.addClassToCourse(courseId.value, classId)
    toast.add({ title: '班级已关联', color: 'success' })
    showAddClass.value = false
    await loadData()
  }
  catch (err) {
    console.error('关联班级失败:', err)
    toast.add({ title: '关联班级失败', color: 'error' })
  }
  finally {
    addingClassId.value = null
  }
}

async function openAddAssistant() {
  showAddAssistant.value = true
  try {
    teachers.value = await courses.fetchTeachers()
  }
  catch (err) {
    console.error('加载教师列表失败:', err)
  }
}

async function handleAddAssistant(assistantId: number) {
  addingAssistantId.value = assistantId
  try {
    await courses.addAssistant(courseId.value, assistantId)
    toast.add({ title: '助教已添加', color: 'success' })
    showAddAssistant.value = false
    await loadData()
  }
  catch (err) {
    console.error('添加助教失败:', err)
    toast.add({ title: '添加助教失败', color: 'error' })
  }
  finally {
    addingAssistantId.value = null
  }
}

async function handleRemoveAssistant(assistantId: number) {
  try {
    await courses.removeAssistant(courseId.value, assistantId)
    toast.add({ title: '助教已移除', color: 'success' })
    await loadData()
  }
  catch (err) {
    console.error('移除助教失败:', err)
    toast.add({ title: '移除助教失败', color: 'error' })
  }
}

function goToClass(classId: number) {
  router.push(`/user/classes/${classId}`)
}

onMounted(() => loadData())
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
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-teal-500" />
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
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer"
              @click="openAddClass"
            >
              <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
              关联班级
            </button>
          </div>
          <div v-if="course.classes && course.classes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <CourseClassCard
              v-for="cls in course.classes"
              :key="cls.id"
              :class-info="cls"
              @click="goToClass(cls.id)"
            />
          </div>
          <p v-else class="text-sm text-zinc-400 py-4">暂无关联班级</p>
        </div>

        <!-- 助教管理 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">助教</h3>
            <button
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer"
              @click="openAddAssistant"
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
                @click="handleRemoveAssistant(assistant.id)"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-zinc-400 py-4">暂无助教</p>
        </div>
      </div>

      <!-- 关联班级弹窗 -->
      <ClientOnly>
      <Teleport to="body">
        <div v-if="showAddClass" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showAddClass = false" />
          <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">关联班级</h3>
            <div class="max-h-64 overflow-y-auto space-y-1">
              <div v-if="allClasses.length === 0" class="text-center py-6 text-sm text-zinc-400">
                暂无可用班级
              </div>
              <div
                v-for="cls in allClasses"
                :key="cls.id"
                class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              >
                <div>
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ cls.name }}</p>
                  <p class="text-xs text-zinc-400">{{ cls.student_count ?? 0 }} 名学生</p>
                </div>
                <button
                  :disabled="addingClassId === cls.id"
                  class="px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                  @click="handleAddClass(cls.id)"
                >
                  {{ addingClassId === cls.id ? '关联中...' : '关联' }}
                </button>
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <button
                class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                @click="showAddClass = false"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </Teleport>
      </ClientOnly>

      <!-- 添加助教弹窗 -->
      <ClientOnly>
      <Teleport to="body">
        <div v-if="showAddAssistant" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showAddAssistant = false" />
          <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">添加助教</h3>
            <div class="max-h-64 overflow-y-auto space-y-1">
              <div v-if="teachers.length === 0" class="text-center py-6 text-sm text-zinc-400">
                暂无可用教师
              </div>
              <div
                v-for="teacher in teachers"
                :key="teacher.id"
                class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              >
                <div>
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ teacher.name || teacher.username }}</p>
                  <p v-if="teacher.email" class="text-xs text-zinc-400">{{ teacher.email }}</p>
                </div>
                <button
                  :disabled="addingAssistantId === teacher.id"
                  class="px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                  @click="handleAddAssistant(teacher.id)"
                >
                  {{ addingAssistantId === teacher.id ? '添加中...' : '添加' }}
                </button>
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <button
                class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                @click="showAddAssistant = false"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </Teleport>
      </ClientOnly>
    </template>
  </UDashboardPanel>
</template>
