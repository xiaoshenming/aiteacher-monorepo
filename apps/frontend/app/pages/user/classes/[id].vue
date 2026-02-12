<script setup lang="ts">
import type { ClassInfo, Student } from '~/types/course'

const route = useRoute()
const router = useRouter()
const courses = useCourses()
const toast = useToast()

const classId = computed(() => Number(route.params.id))
const loading = ref(true)
const classInfo = ref<(ClassInfo & { students?: Student[] }) | null>(null)
const showAddStudent = ref(false)

async function loadData() {
  loading.value = true
  try {
    classInfo.value = await courses.fetchClassDetail(classId.value)
  }
  catch (err) {
    console.error('加载班级详情失败:', err)
    toast.add({ title: '加载班级详情失败', color: 'error' })
    router.push('/user/courses')
  }
  finally {
    loading.value = false
  }
}

async function handleRemoveStudent(studentId: number) {
  try {
    await courses.removeStudent(classId.value, studentId)
    toast.add({ title: '学生已移除', color: 'success' })
    await loadData()
  }
  catch (err) {
    console.error('移除学生失败:', err)
    toast.add({ title: '移除学生失败', color: 'error' })
  }
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
              title="返回"
              @click="router.back()"
            >
              <UIcon name="i-lucide-arrow-left" class="w-4 h-4 text-zinc-500" />
            </button>
            <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {{ classInfo?.name || '班级详情' }}
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

      <div v-else-if="classInfo" class="p-6 space-y-6">
        <!-- 班级信息 -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{{ classInfo.name }}</h2>
          <div class="flex items-center gap-4 text-xs text-zinc-400">
            <span v-if="classInfo.course_name" class="flex items-center gap-1">
              <UIcon name="i-lucide-book-open" class="w-3.5 h-3.5" />
              {{ classInfo.course_name }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
              {{ classInfo.students?.length ?? 0 }} 名学生
            </span>
          </div>
        </div>

        <!-- 学生名单 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">学生名单</h3>
            <button
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer"
              @click="showAddStudent = true"
            >
              <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
              添加学生
            </button>
          </div>

          <div v-if="classInfo.students && classInfo.students.length > 0" class="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-zinc-50 dark:bg-zinc-800">
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">用户名</th>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">姓名</th>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">邮箱</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in classInfo.students"
                  :key="student.id"
                  class="border-t border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td class="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">{{ student.username }}</td>
                  <td class="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">{{ student.name || '-' }}</td>
                  <td class="px-4 py-2.5 text-zinc-400">{{ student.email || '-' }}</td>
                  <td class="px-4 py-2.5 text-right">
                    <button
                      class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                      title="移除学生"
                      @click="handleRemoveStudent(student.id)"
                    >
                      <UIcon name="i-lucide-user-minus" class="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-zinc-400 py-4">暂无学生</p>
        </div>
      </div>

      <CourseAddStudentModal
        :open="showAddStudent"
        :class-id="classId"
        @update:open="showAddStudent = $event"
        @added="loadData"
      />
    </template>
  </UDashboardPanel>
</template>
