<script setup lang="ts">
import type { ClassInfo } from '~/types/course'

defineProps<{
  classes: ClassInfo[]
  addingId: number | null
}>()

const emit = defineEmits<{
  close: []
  add: [classId: number]
}>()
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">关联班级</h3>
          <div class="max-h-64 overflow-y-auto space-y-1">
            <div v-if="classes.length === 0" class="text-center py-6 text-sm text-zinc-400">
              暂无可用班级
            </div>
            <div
              v-for="cls in classes"
              :key="cls.id"
              class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ cls.name }}</p>
                <p class="text-xs text-zinc-400">
                  {{ cls.student_count != null ? `${cls.student_count} 名学生` : `${cls.grade || '未设置年级'} · 容量 ${cls.capacity ?? '-'} 人` }}
                </p>
              </div>
              <button
                :disabled="addingId === cls.id"
                class="px-3 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                @click="emit('add', cls.id)"
              >
                {{ addingId === cls.id ? '关联中...' : '关联' }}
              </button>
            </div>
          </div>
          <div class="flex justify-end mt-4">
            <button
              class="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              @click="emit('close')"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
