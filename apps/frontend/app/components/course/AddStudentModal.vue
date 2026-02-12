<script setup lang="ts">
import type { Student } from '~/types/course'

const props = defineProps<{
  open: boolean
  classId: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  added: []
}>()

const courses = useCourses()
const toast = useToast()

const keyword = ref('')
const results = ref<Student[]>([])
const searching = ref(false)
const adding = ref<number | null>(null)

let searchTimer: ReturnType<typeof setTimeout>
watch(keyword, () => {
  clearTimeout(searchTimer)
  if (!keyword.value.trim()) {
    results.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      results.value = await courses.searchStudents(keyword.value.trim())
    }
    catch (err) {
      console.error('搜索学生失败:', err)
    }
    finally {
      searching.value = false
    }
  }, 300)
})

async function handleAdd(student: Student) {
  adding.value = student.id
  try {
    await courses.addStudent(props.classId, student.id)
    toast.add({ title: `已添加学生 ${student.name || student.username}`, color: 'success' })
    emit('added')
  }
  catch (err) {
    console.error('添加学生失败:', err)
    toast.add({ title: '添加学生失败', color: 'error' })
  }
  finally {
    adding.value = null
  }
}

function handleClose() {
  keyword.value = ''
  results.value = []
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="handleClose" />
      <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">添加学生</h3>
        <div class="relative">
          <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索学生姓名或用户名..."
            class="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
        </div>

        <div class="mt-3 max-h-64 overflow-y-auto">
          <div v-if="searching" class="flex items-center justify-center py-6 text-zinc-400">
            <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
          </div>
          <div v-else-if="keyword.trim() && results.length === 0" class="text-center py-6 text-sm text-zinc-400">
            未找到匹配的学生
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="student in results"
              :key="student.id"
              class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {{ student.name || student.username }}
                </p>
                <p class="text-xs text-zinc-400">{{ student.username }}</p>
              </div>
              <button
                :disabled="adding === student.id"
                class="px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                @click="handleAdd(student)"
              >
                {{ adding === student.id ? '添加中...' : '添加' }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button
            class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            @click="handleClose"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
