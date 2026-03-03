<script setup lang="ts">
import type { Course } from '~/types/course'

const props = defineProps<{
  open: boolean
  course: Course | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  updated: []
}>()

const courses = useCourses()
const toast = useToast()

const name = ref('')
const description = ref('')
const updating = ref(false)

watch(() => props.course, (newCourse) => {
  if (newCourse) {
    name.value = newCourse.name || ''
    description.value = newCourse.description || ''
  }
}, { immediate: true })

async function handleUpdate() {
  if (!name.value.trim() || !props.course) return
  updating.value = true
  try {
    await courses.updateCourse(props.course.id, {
      name: name.value.trim(),
      description: description.value.trim() || undefined
    })
    toast.add({ title: '课程更新成功', color: 'success' })
    emit('update:open', false)
    emit('updated')
  }
  catch (err) {
    console.error('更新课程失败:', err)
    toast.add({ title: '更新课程失败', color: 'error' })
  }
  finally {
    updating.value = false
  }
}
</script>

<template>
  <ClientOnly>
  <Teleport to="body">
    <div v-if="props.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('update:open', false)" />
      <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">编辑课程</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">课程名称</label>
            <input
              v-model="name"
              type="text"
              placeholder="请输入课程名称"
              class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              @keydown.enter="handleUpdate"
            >
          </div>
          <div>
            <label class="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">课程描述</label>
            <textarea
              v-model="description"
              placeholder="请输入课程描述（可选）"
              rows="3"
              class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            @click="emit('update:open', false)"
          >
            取消
          </button>
          <button
            :disabled="!name.trim() || updating"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="handleUpdate"
          >
            {{ updating ? '更新中...' : '更新' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
  </ClientOnly>
</template>
