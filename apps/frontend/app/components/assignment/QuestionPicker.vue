<script setup lang="ts">
const { apiFetch } = useApi()

const props = defineProps<{
  modelValue: any[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: any[]] }>()

const questions = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)

const filterType = ref('all')
const filterDifficulty = ref('all')
const keyword = ref('')

const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '单选', value: 'single_choice' },
  { label: '多选', value: 'multiple_choice' },
  { label: '判断', value: 'true_false' },
  { label: '填空', value: 'fill_blank' },
  { label: '简答', value: 'short_answer' },
  { label: '论述', value: 'essay' },
]

const difficultyOptions = [
  { label: '全部难度', value: 'all' },
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]

const selectedIds = computed(() => new Set(props.modelValue.map((q: any) => q.id)))

async function fetchQuestions() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: '20' })
    if (filterType.value && filterType.value !== 'all') params.append('type', filterType.value)
    if (filterDifficulty.value && filterDifficulty.value !== 'all') params.append('difficulty', filterDifficulty.value)
    if (keyword.value) params.append('keyword', keyword.value)
    const res = await apiFetch<{ code: number, data: any }>(`/question-bank?${params}`)
    if (res.code === 200) {
      questions.value = res.data?.list || res.data || []
      total.value = res.data?.total || 0
    }
  }
  finally { loading.value = false }
}

function toggleQuestion(q: any) {
  const current = [...props.modelValue]
  const idx = current.findIndex((item: any) => item.id === q.id)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(q)
  emit('update:modelValue', current)
}

function handleSearch() {
  page.value = 1
  fetchQuestions()
}

watch([filterType, filterDifficulty], () => handleSearch())
onMounted(() => fetchQuestions())
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <USelectMenu v-model="filterType" :items="typeOptions" value-key="value" class="w-36" />
      <USelectMenu v-model="filterDifficulty" :items="difficultyOptions" value-key="value" class="w-36" />
      <UInput v-model="keyword" placeholder="搜索题目..." icon="i-lucide-search" class="flex-1 min-w-48" @keyup.enter="handleSearch" />
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
    </div>
    <div v-else-if="questions.length === 0" class="text-center py-8 text-muted">
      暂无题目
    </div>
    <div v-else class="grid gap-2 max-h-96 overflow-y-auto pr-1">
      <AssignmentQuestionPickerCard
        v-for="q in questions"
        :key="q.id"
        :question="q"
        :selected="selectedIds.has(q.id)"
        @toggle="toggleQuestion(q)"
      />
    </div>

    <div class="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
      <span class="text-sm text-muted">已选 {{ modelValue.length }} 题</span>
      <div class="flex gap-2">
        <UButton v-if="page > 1" size="xs" variant="ghost" label="上一页" @click="page--; fetchQuestions()" />
        <UButton v-if="questions.length >= 20" size="xs" variant="ghost" label="下一页" @click="page++; fetchQuestions()" />
      </div>
    </div>
  </div>
</template>
