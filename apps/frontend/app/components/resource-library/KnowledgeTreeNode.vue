<script setup lang="ts">
const props = withDefaults(defineProps<{
  node: Record<string, any>
  level?: number
}>(), { level: 0 })

const emit = defineEmits<{
  select: [node: Record<string, any>]
  'create-child': [node: Record<string, any>]
  delete: [node: Record<string, any>]
}>()

const expanded = ref(true)
const hasChildren = computed(() => props.node.children?.length > 0)

const typeLabels: Record<string, string> = {
  subject: '学科',
  textbook: '教材',
  chapter: '章',
  section: '节',
  knowledge_point: '知识点',
}

const typeColors: Record<string, string> = {
  subject: 'primary',
  textbook: 'info',
  chapter: 'success',
  section: 'warning',
  knowledge_point: 'error',
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
      :style="{ paddingLeft: `${level * 16 + 12}px` }"
      @click="emit('select', node)"
    >
      <button
        v-if="hasChildren"
        class="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        @click.stop="expanded = !expanded"
      >
        <UIcon :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="w-4 h-4" />
      </button>
      <span v-else class="w-5" />

      <UIcon name="i-lucide-folder" class="w-4 h-4 text-primary-500 shrink-0" />
      <span class="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">{{ node.name }}</span>
      <UBadge :color="typeColors[node.node_type] || 'neutral'" variant="subtle" size="xs">
        {{ typeLabels[node.node_type] || node.node_type }}
      </UBadge>

      <div class="hidden group-hover:flex items-center gap-1">
        <UButton
          icon="i-lucide-plus" size="xs" variant="ghost" color="neutral"
          @click.stop="emit('create-child', node)"
        />
        <UButton
          icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
          @click.stop="emit('delete', node)"
        />
      </div>
    </div>

    <div v-if="hasChildren && expanded">
      <ResourceLibraryKnowledgeTreeNode
        v-for="child in node.children" :key="child.id"
        :node="child" :level="level + 1"
        @select="emit('select', $event)"
        @create-child="emit('create-child', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>
