<script setup lang="ts">
const props = defineProps<{
  show: boolean
  creating: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  create: [name: string]
}>()

const newName = ref('')

function handleCreate() {
  if (!newName.value.trim()) return
  emit('create', newName.value.trim())
}

function handleClose() {
  emit('update:show', false)
}

watch(() => props.show, (val) => {
  if (val) newName.value = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="handleClose" />
      <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">新建教案</h3>
        <input
          v-model="newName"
          type="text"
          placeholder="请输入教案名称"
          class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          @keydown.enter="handleCreate"
        >
        <div class="flex justify-end gap-2 mt-4">
          <button
            class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            @click="handleClose"
          >
            取消
          </button>
          <button
            :disabled="!newName.trim() || creating"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            @click="handleCreate"
          >
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
