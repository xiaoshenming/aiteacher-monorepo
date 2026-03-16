<script setup lang="ts">
const emit = defineEmits<{
  select: [node: Record<string, any>]
}>()

const { treeData, loading, fetchTree, deleteNode } = useKnowledgeTree()

const subjectFilter = ref('')
const gradeFilter = ref('')
const showCreateModal = ref(false)
const parentNodeForCreate = ref<Record<string, any> | null>(null)

const subjectOptions = [
  { label: '全部学科', value: '' },
  { label: '语文', value: '语文' },
  { label: '数学', value: '数学' },
  { label: '英语', value: '英语' },
  { label: '物理', value: '物理' },
  { label: '化学', value: '化学' },
  { label: '生物', value: '生物' },
  { label: '历史', value: '历史' },
  { label: '地理', value: '地理' },
  { label: '政治', value: '政治' },
]

const gradeOptions = [
  { label: '全部年级', value: '' },
  { label: '七年级', value: '七年级' },
  { label: '八年级', value: '八年级' },
  { label: '九年级', value: '九年级' },
  { label: '高一', value: '高一' },
  { label: '高二', value: '高二' },
  { label: '高三', value: '高三' },
]

function handleCreateRoot() {
  parentNodeForCreate.value = null
  showCreateModal.value = true
}

function handleCreateChild(node: Record<string, any>) {
  parentNodeForCreate.value = node
  showCreateModal.value = true
}

async function handleDelete(node: Record<string, any>) {
  if (!confirm(`确定删除「${node.name}」及其所有子节点？`)) return
  await deleteNode(node.id)
}

function handleCreated() {
  showCreateModal.value = false
}

watch([subjectFilter, gradeFilter], () => {
  const filters: Record<string, string> = {}
  if (subjectFilter.value) filters.subject = subjectFilter.value
  if (gradeFilter.value) filters.grade = gradeFilter.value
  fetchTree(filters)
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700">
      <USelect v-model="subjectFilter" :items="subjectOptions" class="flex-1" size="sm" />
      <USelect v-model="gradeFilter" :items="gradeOptions" class="flex-1" size="sm" />
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary-500" />
      </div>
      <div v-else-if="treeData.length === 0" class="text-center py-8 text-sm text-zinc-400">
        暂无知识树节点
      </div>
      <template v-else>
        <KnowledgeTreeNode
          v-for="node in treeData" :key="node.id"
          :node="node" :level="0"
          @select="emit('select', $event)"
          @create-child="handleCreateChild"
          @delete="handleDelete"
        />
      </template>
    </div>

    <div class="p-3 border-t border-zinc-200 dark:border-zinc-700">
      <UButton block icon="i-lucide-plus" variant="soft" @click="handleCreateRoot">
        新建根节点
      </UButton>
    </div>

    <CreateNodeModal
      v-model:open="showCreateModal"
      :parent-node="parentNodeForCreate"
      @created="handleCreated"
    />
  </div>
</template>
