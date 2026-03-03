<script setup lang="ts">
import type { Course } from '~/types/course'

const props = defineProps<{
  course: Course
}>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
}>()

const userStore = useUserStore()

const canEdit = computed(() => userStore.userInfo?.role >= 2)
const canDelete = computed(() => userStore.userInfo?.role >= 2)

const menuItems = computed(() => {
  const items = []
  if (canEdit.value) {
    items.push([{
      label: '编辑',
      icon: 'i-lucide-pencil',
      click: () => emit('edit')
    }])
  }
  if (canDelete.value) {
    items.push([{
      label: '删除',
      icon: 'i-lucide-trash-2',
      click: () => emit('delete'),
      class: 'text-red-500'
    }])
  }
  return items
})

function handleCardClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button')) return
  emit('click')
}
</script>

<template>
  <div
    class="group relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer p-5"
    @click="handleCardClick"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50 dark:bg-primary-900/20">
        <UIcon name="i-lucide-book-open" class="w-5 h-5 text-primary-500" />
      </div>
      <UDropdown v-if="menuItems.length > 0" :items="menuItems" :popper="{ placement: 'bottom-end' }">
        <UButton
          color="gray"
          variant="ghost"
          icon="i-lucide-more-vertical"
          size="xs"
          @click.stop
        />
      </UDropdown>
    </div>
    <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">
      {{ course.name }}
    </h3>
    <p class="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mb-3 min-h-[2rem]">
      {{ course.description || '暂无描述' }}
    </p>
    <div class="flex items-center gap-3 text-xs text-zinc-400">
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
        {{ course.class_count ?? 0 }} 个班级
      </span>
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-graduation-cap" class="w-3.5 h-3.5" />
        {{ course.student_count ?? 0 }} 名学生
      </span>
    </div>
  </div>
</template>
