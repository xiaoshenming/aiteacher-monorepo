<script setup lang="ts">
defineProps<{
  nodeId?: number
  resources: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  attach: []
  detach: [mapId: number]
  share: [resource: any]
}>()

const typeIcons: Record<string, string> = {
  lesson_plan: 'i-lucide-notebook-pen',
  paper: 'i-lucide-file-text',
  question: 'i-lucide-help-circle',
  file: 'i-lucide-file',
}

const typeLabels: Record<string, string> = {
  lesson_plan: '教案',
  paper: '试卷',
  question: '题目',
  file: '文件',
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
      <h3 class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        关联资源 ({{ resources.length }})
      </h3>
      <UButton v-if="nodeId" icon="i-lucide-link" size="sm" variant="soft" @click="emit('attach')">
        挂载资源
      </UButton>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary-500" />
      </div>
      <div v-else-if="!nodeId" class="text-center py-12 text-sm text-zinc-400">
        <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 mb-2 mx-auto text-zinc-300 dark:text-zinc-600" />
        <p>请在左侧选择一个知识点</p>
      </div>
      <div v-else-if="resources.length === 0" class="text-center py-12 text-sm text-zinc-400">
        <UIcon name="i-lucide-package-open" class="w-8 h-8 mb-2 mx-auto text-zinc-300 dark:text-zinc-600" />
        <p>暂无关联资源</p>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="res in resources" :key="res.map_id || res.id"
          class="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-500/10">
            <UIcon :name="typeIcons[res.resource_type] || 'i-lucide-file'" class="w-4 h-4 text-primary-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-zinc-800 dark:text-zinc-200 truncate">{{ res.title || res.name || '未命名' }}</p>
            <UBadge variant="subtle" size="xs" class="mt-1">
              {{ typeLabels[res.resource_type] || res.resource_type }}
            </UBadge>
          </div>
          <UButton
            icon="i-lucide-share-2" size="xs" variant="ghost" color="primary" title="共享"
            @click="emit('share', res)"
          />
          <UButton
            icon="i-lucide-unlink" size="xs" variant="ghost" color="error" title="解除关联"
            @click="emit('detach', res.map_id || res.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
