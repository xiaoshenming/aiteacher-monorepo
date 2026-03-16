<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ nodeId: number }>()
const emit = defineEmits<{ attached: [] }>()

const { apiFetch } = useApi()
const { attachResource } = useKnowledgeTree()
const { fetchFiles: fetchCloudFiles } = useCloudDisk()

const activeTab = ref('lesson_plan')
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const attaching = ref(false)

const tabs = [
  { label: '教案', value: 'lesson_plan', icon: 'i-lucide-notebook-pen' },
  { label: '试卷', value: 'paper', icon: 'i-lucide-file-text' },
  { label: '题目', value: 'question', icon: 'i-lucide-help-circle' },
  { label: '文件', value: 'file', icon: 'i-lucide-file' },
  { label: '云盘', value: 'cloud_file', icon: 'i-lucide-cloud' },
]

const apiMap: Record<string, string> = {
  lesson_plan: '/lesson-plans',
  paper: '/papers',
  question: '/questions',
  file: '/files',
}

async function doSearch() {
  searching.value = true
  try {
    if (activeTab.value === 'cloud_file') {
      const files = await fetchCloudFiles()
      const q = searchQuery.value.toLowerCase()
      searchResults.value = (files || [])
        .filter((f: any) => !f.is_folder && (!q || f.name.toLowerCase().includes(q)))
    }
    else {
      const url = `${apiMap[activeTab.value]}?keyword=${encodeURIComponent(searchQuery.value)}&page=1&pageSize=20`
      const { data } = await apiFetch<any>(url)
      searchResults.value = data?.list || data || []
    }
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

async function handleAttach(resourceId: number) {
  attaching.value = true
  try {
    await attachResource(props.nodeId, activeTab.value, resourceId)
    emit('attached')
    open.value = false
  } finally {
    attaching.value = false
  }
}

watch(activeTab, () => {
  searchResults.value = []
  searchQuery.value = ''
})
</script>

<template>
  <UModal v-model:open="open" title="挂载资源" :ui="{ width: 'sm:max-w-lg' }">
    <template #body>
      <div class="space-y-3">
        <div class="flex gap-1">
          <UButton
            v-for="tab in tabs" :key="tab.value"
            :icon="tab.icon" size="sm"
            :variant="activeTab === tab.value ? 'soft' : 'ghost'"
            :color="activeTab === tab.value ? 'primary' : 'neutral'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </UButton>
        </div>

        <div class="flex gap-2">
          <UInput v-model="searchQuery" placeholder="搜索资源..." class="flex-1" size="sm" />
          <UButton icon="i-lucide-search" size="sm" @click="doSearch" />
        </div>

        <div class="max-h-64 overflow-y-auto">
          <div v-if="searching" class="flex justify-center py-6">
            <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary-500" />
          </div>
          <div v-else-if="searchResults.length === 0" class="text-center py-6 text-sm text-zinc-400">
            {{ searchQuery ? '未找到匹配资源' : '请输入关键词搜索' }}
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="item in searchResults" :key="item.id"
              class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
            >
              <span class="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">
                {{ item.title || item.name || '未命名' }}
              </span>
              <UButton
                icon="i-lucide-link" size="xs" variant="soft"
                :loading="attaching"
                @click="handleAttach(item.id)"
              >
                挂载
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
