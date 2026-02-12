<script setup lang="ts">
import type { Question } from '~/types/question'

const sse = useSSE()
const { addToBank, exportQuestions } = useQuestions()
const toast = useToast()
const saving = ref(false)

const subject = ref('')
const topicInput = ref('')
const count = ref(5)
const difficulty = ref<'简单' | '中等' | '困难'>('中等')
const selectedTypes = ref<string[]>(['选择题'])

const difficultyOptions = [
  { label: '简单', value: '简单' },
  { label: '中等', value: '中等' },
  { label: '困难', value: '困难' },
]

const typeOptions = ['选择题', '填空题', '判断题', '简答题', '计算题']

const rawContent = ref('')
const parsedQuestions = ref<Question[]>([])
const expandedIds = ref<Set<string>>(new Set())
const isGenerated = ref(false)

function toggleType(type: string) {
  const idx = selectedTypes.value.indexOf(type)
  if (idx >= 0) {
    if (selectedTypes.value.length > 1) selectedTypes.value.splice(idx, 1)
  }
  else {
    selectedTypes.value.push(type)
  }
}

async function generate() {
  if (!subject.value.trim() || !topicInput.value.trim()) {
    toast.add({ title: '请填写科目和知识点', color: 'warning' })
    return
  }

  rawContent.value = ''
  parsedQuestions.value = []
  isGenerated.value = false
  expandedIds.value = new Set()

  const prompt = `你是一位专业的出题老师。请根据以下要求生成题目：
科目：${subject.value}
知识点：${topicInput.value}
数量：${count.value}题
难度：${difficulty.value}
题型：${selectedTypes.value.join('、')}

请严格按照以下JSON数组格式输出，不要包含其他内容：
[
  {
    "type": "选择题",
    "difficulty": "${difficulty.value}",
    "subject": "${subject.value}",
    "content": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": "正确答案",
    "explanation": "解析说明"
  }
]
注意：options字段仅选择题需要，其他题型不需要。请直接输出JSON数组。`

  await sse.stream({
    url: 'ai/chat-stream',
    body: { prompt, model: 'deepseek-chat' },
    callbacks: {
      onMessage(chunk: string) {
        rawContent.value += chunk
      },
      onDone() {
        parseQuestions()
        isGenerated.value = true
      },
      onError(err: string) {
        toast.add({ title: '生成失败', description: err, color: 'error' })
      },
    },
  })
}

function parseQuestions() {
  try {
    // 提取 JSON 数组（可能被 markdown 代码块包裹）
    let jsonStr = rawContent.value.trim()
    const match = jsonStr.match(/\[[\s\S]*\]/)
    if (match) jsonStr = match[0]

    const arr = JSON.parse(jsonStr)
    parsedQuestions.value = arr.map((item: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      type: item.type || '选择题',
      difficulty: item.difficulty || difficulty.value,
      subject: item.subject || subject.value,
      content: item.content || '',
      options: item.options || undefined,
      answer: item.answer || '',
      explanation: item.explanation || '',
      createdAt: new Date().toISOString(),
    })) as Question[]
  }
  catch {
    toast.add({ title: '题目解析失败，请查看原始内容', color: 'warning' })
  }
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  }
  else {
    expandedIds.value.add(id)
  }
}

async function addAllToBank() {
  if (!parsedQuestions.value.length || saving.value) return
  saving.value = true
  try {
    const result = await addToBank(parsedQuestions.value)
    toast.add({ title: `已添加 ${result.count} 道题到题库`, color: 'success' })
  }
  catch {
    toast.add({ title: '添加失败，请重试', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

async function addOneToBank(q: Question) {
  if (saving.value) return
  saving.value = true
  try {
    await addToBank([q])
    toast.add({ title: '已添加到题库', color: 'success' })
  }
  catch {
    toast.add({ title: '添加失败，请重试', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

function handleExport(format: 'json' | 'text') {
  const content = exportQuestions(parsedQuestions.value as unknown as Array<Record<string, unknown>>, format)
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `题库导出.${format === 'json' ? 'json' : 'txt'}`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: '导出成功', color: 'success' })
}

function stopGenerate() {
  sse.abort()
  parseQuestions()
  isGenerated.value = true
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="AI智能出题">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div v-if="isGenerated && parsedQuestions.length" class="flex items-center gap-1.5">
            <UButton
              icon="i-lucide-database"
              label="加入题库"
              size="sm"
              variant="soft"
              :loading="saving"
              @click="addAllToBank"
            />
            <UButton
              icon="i-lucide-download"
              label="导出JSON"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleExport('json')"
            />
            <UButton
              icon="i-lucide-file-text"
              label="导出文本"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleExport('text')"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-5xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 左侧配置面板 -->
          <div class="lg:col-span-1 space-y-4">
            <UCard>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">科目</label>
                  <UInput v-model="subject" placeholder="例如：数学" icon="i-lucide-book-open" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">知识点</label>
                  <UTextarea v-model="topicInput" placeholder="例如：二次函数的性质与应用" :rows="2" autoresize />
                </div>

                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">数量 ({{ count }}题)</label>
                  <input
                    v-model.number="count"
                    type="range"
                    min="1"
                    max="20"
                    class="w-full accent-primary"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">难度</label>
                  <URadioGroup v-model="difficulty" :items="difficultyOptions" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">题型</label>
                  <div class="flex flex-wrap gap-1.5">
                    <UButton
                      v-for="t in typeOptions"
                      :key="t"
                      :label="t"
                      size="xs"
                      :variant="selectedTypes.includes(t) ? 'solid' : 'outline'"
                      :color="selectedTypes.includes(t) ? 'primary' : 'neutral'"
                      @click="toggleType(t)"
                    />
                  </div>
                </div>

                <UButton
                  v-if="!sse.isStreaming.value"
                  label="开始生成"
                  icon="i-lucide-sparkles"
                  size="lg"
                  block
                  @click="generate"
                />
                <UButton
                  v-else
                  label="停止生成"
                  icon="i-lucide-square"
                  size="lg"
                  block
                  color="neutral"
                  variant="outline"
                  @click="stopGenerate"
                />
              </div>
            </UCard>
          </div>

          <!-- 右侧结果面板 -->
          <div class="lg:col-span-2 space-y-4">
            <!-- 流式输出 -->
            <UCard v-if="sse.isStreaming.value || (rawContent && !parsedQuestions.length)">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-sm text-muted">
                  <UIcon v-if="sse.isStreaming.value" name="i-lucide-loader-2" class="size-4 animate-spin" />
                  <span>{{ sse.isStreaming.value ? '正在生成题目...' : '生成内容' }}</span>
                </div>
                <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-3 bg-elevated rounded-lg min-h-[100px]">
                  {{ rawContent || '等待生成...' }}
                </div>
              </div>
            </UCard>

            <!-- 解析后的题目列表 -->
            <template v-if="parsedQuestions.length">
              <UCard v-for="(q, idx) in parsedQuestions" :key="q.id">
                <div class="space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <UBadge :label="q.type" size="sm" variant="subtle" />
                        <UBadge
                          :label="q.difficulty"
                          size="sm"
                          variant="subtle"
                          :color="q.difficulty === '简单' ? 'success' : q.difficulty === '中等' ? 'warning' : 'error'"
                        />
                      </div>
                      <p class="text-sm text-highlighted">{{ idx + 1 }}. {{ q.content }}</p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <UButton
                        :icon="expandedIds.has(q.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        @click="toggleExpand(q.id)"
                      />
                      <UButton
                        icon="i-lucide-plus"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        title="加入题库"
                        @click="addOneToBank(q)"
                      />
                    </div>
                  </div>

                  <!-- 选项 -->
                  <div v-if="q.options?.length" class="pl-4 space-y-0.5">
                    <p v-for="opt in q.options" :key="opt" class="text-sm text-muted">{{ opt }}</p>
                  </div>

                  <!-- 展开的答案和解析 -->
                  <div v-if="expandedIds.has(q.id)" class="mt-2 pt-2 border-t border-default space-y-1.5">
                    <p class="text-sm"><span class="font-medium text-primary">答案：</span>{{ q.answer }}</p>
                    <p v-if="q.explanation" class="text-sm text-muted"><span class="font-medium">解析：</span>{{ q.explanation }}</p>
                  </div>
                </div>
              </UCard>
            </template>

            <!-- 空状态 -->
            <div v-else-if="!sse.isStreaming.value && !rawContent" class="flex flex-col items-center justify-center py-20 text-muted">
              <UIcon name="i-lucide-brain" class="size-12 mb-3" />
              <p class="text-lg font-medium text-highlighted">AI智能出题</p>
              <p class="mt-1">配置参数后点击"开始生成"</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
