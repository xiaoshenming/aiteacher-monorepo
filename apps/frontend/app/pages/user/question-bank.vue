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

const difficultyColors: Record<string, string> = {
  '简单': 'success',
  '中等': 'warning',
  '困难': 'error',
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
          <USelectMenu v-model="typeFilter" :items="typeOptions" class="w-36" />
          <USelectMenu v-model="difficultyFilter" :items="difficultyOptions" class="w-36" />
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
          <div
            v-for="q in questions"
            :key="q.id"
            class="border border-default rounded-lg overflow-hidden"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-elevated transition-colors"
              @click="toggleExpand(q.id)"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UBadge variant="subtle" color="neutral">{{ q.type }}</UBadge>
                <UBadge variant="subtle" :color="(difficultyColors[q.difficulty] as any) || 'neutral'">{{ q.difficulty }}</UBadge>
                <span class="text-sm text-highlighted truncate">{{ q.content }}</span>
              </div>
              <div class="flex items-center gap-2 ml-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-trash-2"
                  @click.stop="deleteQuestion(q.id)"
                />
                <UIcon
                  :name="expandedId === q.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="text-muted"
                />
              </div>
            </div>
            <div v-if="expandedId === q.id" class="px-4 pb-4 space-y-2 border-t border-default pt-3">
              <p class="text-sm"><span class="text-muted">科目：</span>{{ q.subject }}</p>
              <p class="text-sm"><span class="text-muted">题目：</span>{{ q.content }}</p>
              <div v-if="q.options && q.options.length" class="text-sm space-y-1">
                <p class="text-muted">选项：</p>
                <p v-for="opt in q.options" :key="opt" class="ml-4">{{ opt }}</p>
              </div>
              <p class="text-sm"><span class="text-muted">答案：</span><span class="text-primary font-medium">{{ q.answer }}</span></p>
              <p v-if="q.explanation" class="text-sm"><span class="text-muted">解析：</span>{{ q.explanation }}</p>
            </div>
          </div>

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
    </template>
  </UDashboardPanel>
</template>
