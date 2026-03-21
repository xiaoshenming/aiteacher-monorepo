<script setup lang="ts">
const toast = useToast()
const { fetchQuestions, removeFromBank, exportQuestions } = useQuestions()

const search = ref('')
const typeFilter = ref('')
const difficultyFilter = ref('')
const expandedId = ref<number | null>(null)
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

// 共享
const showShareModal = ref(false)
const shareTargetId = ref<number | null>(null)

interface QuestionRow {
  id: number
  type: string
  difficulty: string
  subject: string
  content: string
  answer: string
  options?: string[] | null
  explanation?: string | null
  createTime?: string
}

const questions = ref<QuestionRow[]>([])

const typeOptions = [
  { label: '全部题型', value: '' },
  { label: '选择题', value: '选择题' },
  { label: '填空题', value: '填空题' },
  { label: '判断题', value: '判断题' },
  { label: '简答题', value: '简答题' },
  { label: '计算题', value: '计算题' },
]

const difficultyOptions = [
  { label: '全部难度', value: '' },
  { label: '简单', value: '简单' },
  { label: '中等', value: '中等' },
  { label: '困难', value: '困难' },
]

async function loadQuestions() {
  loading.value = true
  try {
    const data = await fetchQuestions({
      page: page.value,
      pageSize,
      subject: undefined,
      type: typeFilter.value || undefined,
      difficulty: difficultyFilter.value || undefined,
      keyword: search.value || undefined,
    })
    questions.value = data.list
    total.value = data.total
  }
  catch {
    toast.add({ title: '加载题库失败', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

async function deleteQuestion(id: number) {
  try {
    await removeFromBank(id)
    toast.add({ title: '题目已删除', color: 'success' })
    await loadQuestions()
  }
  catch {
    toast.add({ title: '删除失败', color: 'error' })
  }
}

function handleExport() {
  const data = exportQuestions(questions.value as unknown as Array<Record<string, unknown>>, 'json')
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'question_bank.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: '导出成功', color: 'success' })
}

function handleShare(id: number) {
  shareTargetId.value = id
  showShareModal.value = true
}

function handleShared() {
  showShareModal.value = false
  shareTargetId.value = null
}

const totalPages = computed(() => Math.ceil(total.value / pageSize))

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadQuestions()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    loadQuestions()
  }
}

// Watch filters to reload
watch([typeFilter, difficultyFilter], () => {
  page.value = 1
  loadQuestions()
})

// Debounced search
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadQuestions()
  }, 400)
})

onMounted(() => {
  loadQuestions()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="题库管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <span v-if="total > 0" class="text-sm text-muted mr-2">共 {{ total }} 题</span>
          <UButton icon="i-lucide-download" label="导出" variant="outline" @click="handleExport" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <div class="flex flex-wrap gap-3 items-center">
          <UInput v-model="search" placeholder="搜索题目..." icon="i-lucide-search" class="w-64" />
          <USelectMenu v-model="typeFilter" :items="typeOptions" value-key="value" class="w-36" />
          <USelectMenu v-model="difficultyFilter" :items="difficultyOptions" value-key="value" class="w-36" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <div v-else-if="questions.length === 0" class="flex flex-col items-center py-12 text-muted">
          <UIcon name="i-lucide-database" class="text-4xl mb-3" />
          <p>暂无题目</p>
          <p class="text-sm mt-1">前往「AI智能出题」生成题目并加入题库</p>
        </div>

        <div v-else class="space-y-3">
          <QuestionBankQuestionCard
            v-for="q in questions"
            :key="q.id"
            :question="q"
            :expanded="expandedId === q.id"
            @toggle="toggleExpand"
            @delete="deleteQuestion"
            @share="handleShare"
          />

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 pt-4">
            <UButton
              icon="i-lucide-chevron-left"
              size="sm"
              variant="outline"
              :disabled="page <= 1"
              @click="prevPage"
            />
            <span class="text-sm text-muted">{{ page }} / {{ totalPages }}</span>
            <UButton
              icon="i-lucide-chevron-right"
              size="sm"
              variant="outline"
              :disabled="page >= totalPages"
              @click="nextPage"
            />
          </div>
        </div>
      </div>

      <!-- 共享对话框 -->
      <ShareShareModal
        v-if="shareTargetId"
        v-model="showShareModal"
        resource-type="question"
        :resource-id="shareTargetId"
        @shared="handleShared"
      />
    </template>
  </UDashboardPanel>
</template>
