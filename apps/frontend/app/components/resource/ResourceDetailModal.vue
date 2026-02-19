<script setup lang="ts">
import type { ResourceItem } from '~/types/resource'

const props = defineProps<{
  resource: ResourceItem | null
  downloadUrl?: string
}>()

const emit = defineEmits<{
  close: []
  download: [item: ResourceItem]
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fields = computed(() => [
  { label: '年级', value: props.resource?.grade },
  { label: '科目', value: props.resource?.subject },
  { label: '省份', value: props.resource?.province },
  { label: '城市', value: props.resource?.city },
  { label: '年份', value: props.resource?.year },
  { label: '类型', value: props.resource?.type },
  { label: '上传时间', value: props.resource ? formatDate(props.resource.created_at) : '' },
])
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="resource" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 pr-4">
              {{ resource.title }}
            </h3>
            <button
              class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              @click="emit('close')"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <!-- 封面 -->
          <div v-if="resource.cover_url" class="mb-4 rounded-lg overflow-hidden">
            <NuxtImg :src="resource.cover_url" :alt="resource.title" class="w-full object-cover max-h-60" />
          </div>

          <!-- 信息列表 -->
          <div class="space-y-2 text-sm">
            <div v-for="field in fields" :key="field.label" class="flex">
              <span class="w-20 text-zinc-400 shrink-0">{{ field.label }}</span>
              <span class="text-zinc-900 dark:text-zinc-100">{{ field.value || '-' }}</span>
            </div>
          </div>

          <!-- 下载按钮 -->
          <div class="mt-6 flex justify-end">
            <button
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors cursor-pointer"
              @click="emit('download', resource)"
            >
              <UIcon name="i-lucide-download" class="w-4 h-4" />
              下载 PDF
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
