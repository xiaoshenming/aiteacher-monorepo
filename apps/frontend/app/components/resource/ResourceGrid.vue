<script setup lang="ts">
import type { ResourceItem } from '~/types/resource'

defineProps<{
  items: ResourceItem[]
  loading: boolean
}>()

const emit = defineEmits<{
  detail: [item: ResourceItem]
  download: [item: ResourceItem]
}>()
</script>

<template>
  <!-- 骨架屏 -->
  <div v-if="loading && items.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div
      v-for="i in 8"
      :key="i"
      class="h-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 animate-pulse"
    />
  </div>

  <!-- 空状态 -->
  <div v-else-if="!loading && items.length === 0" class="flex flex-col items-center justify-center py-24 text-muted">
    <UIcon name="i-lucide-file-search" class="text-4xl mb-3" />
    <p class="text-lg font-medium text-highlighted">暂无资源</p>
    <p class="mt-1">请尝试调整筛选条件或搜索关键词</p>
  </div>

  <!-- 资源卡片网格 -->
  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="group rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all overflow-hidden cursor-pointer"
      @click="emit('detail', item)"
    >
      <!-- 封面 -->
      <div class="relative h-40 bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
        <img
          v-if="item.cover_url"
          :src="item.cover_url"
          :alt="item.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        >
        <div v-else class="flex items-center justify-center h-full">
          <UIcon name="i-lucide-file-text" class="w-12 h-12 text-zinc-300 dark:text-zinc-500" />
        </div>
      </div>

      <!-- 信息 -->
      <div class="p-3">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 min-h-[2.5rem]">
          {{ item.title }}
        </h3>
        <div class="flex flex-wrap gap-1.5 mb-3">
          <span
            v-if="item.grade"
            class="text-xs px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
          >
            {{ item.grade }}
          </span>
          <span
            v-if="item.subject"
            class="text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          >
            {{ item.subject }}
          </span>
          <span
            v-if="item.year"
            class="text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          >
            {{ item.year }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-400">{{ item.province }}{{ item.city ? ` · ${item.city}` : '' }}</span>
          <button
            class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition-colors cursor-pointer"
            title="下载"
            @click.stop="emit('download', item)"
          >
            <UIcon name="i-lucide-download" class="w-3.5 h-3.5" />
            下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
