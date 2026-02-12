<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: []
}>()

const courses = useCourses()
const toast = useToast()

const name = ref('')
const creating = ref(false)

async function handleCreate() {
  if (!name.value.trim()) return
  creating.value = true
  try {
    await courses.createClass({ name: name.value.trim() })
    name.value = ''
    emit('update:open', false)
    emit('created')
  }
  catch (err) {
    console.error('创建班级失败:', err)
    toast.add({ title: '创建班级失败', color: 'error' })
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('update:open', false)" />
      <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">添加班级</h3>
        <div>
          <label class="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">班级名称</label>
          <input
            v-model="name"
            type="text"
            placeholder="请输入班级名称"
            class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            @keydown.enter="handleCreate"
          >
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            @click="emit('update:open', false)"
          >
            取消
          </button>
          <button
            :disabled="!name.trim() || creating"
            class="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            @click="handleCreate"
          >
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
